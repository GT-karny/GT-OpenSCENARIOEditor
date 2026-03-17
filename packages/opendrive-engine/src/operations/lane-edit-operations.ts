/**
 * Compound lane editing operations.
 *
 * Each function orchestrates multiple store mutations (add/remove lane,
 * split section, taper generation, link sync) wrapped in a single
 * beginBatch/endBatch so the entire operation is one undo step.
 */

import type { OdrRoad, OdrLaneSection } from '@osce/shared';
import type { OpenDriveStore } from '../store/opendrive-store.js';
import { createDefaultLane } from '../store/defaults.js';
import {
  buildTaperSectionForAdd,
  buildTaperSectionForRemove,
  computeCubicTaperCoefficients,
} from './lane-taper-operations.js';
import { syncIntraRoadLaneLinks, syncLaneLinksForDirectConnections } from './lane-link-operations.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRoad(store: OpenDriveStore, roadId: string): OdrRoad | undefined {
  return store.getDocument().roads.find((r) => r.id === roadId);
}

function getSectionEnd(road: OdrRoad, sectionIdx: number): number {
  const next = road.lanes[sectionIdx + 1];
  return next ? next.s : road.length;
}

/**
 * Check if a position on the road is near a junction connection endpoint.
 */
export function isNearJunctionConnection(road: OdrRoad, s: number, minDistance = 1): boolean {
  // Junction roads themselves should not be edited
  if (road.junction !== '-1') return true;

  // Check proximity to road start/end if they connect to junctions
  if (road.link?.predecessor?.elementType === 'junction' && s < minDistance) return true;
  if (road.link?.successor?.elementType === 'junction' && road.length - s < minDistance) return true;

  return false;
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface LaneEditOptions {
  taperLength?: number;
  useLaneOffset?: boolean;
}

/**
 * Add a lane to a section with automatic taper generation and link sync.
 * The entire operation is a single undo step.
 */
export function addLaneToSection(
  store: OpenDriveStore,
  roadId: string,
  sectionIdx: number,
  side: 'left' | 'right',
  options: LaneEditOptions = {},
): void {
  const road = getRoad(store, roadId);
  if (!road) return;
  const section = road.lanes[sectionIdx];
  if (!section) return;

  const taperLength = options.taperLength ?? 30;

  store.beginBatch(`Add ${side} lane to road ${roadId}`);

  try {
    // Determine if we have room for a taper before the target section
    const hasTaperRoom = section.s >= taperLength;

    if (hasTaperRoom && sectionIdx > 0) {
      const taperStartS = section.s - taperLength;

      // Build the taper section
      const taperSection = buildTaperSectionForAdd(road, sectionIdx, side, taperLength);
      taperSection.s = taperStartS;

      // Insert the taper by splitting the previous section at taperStartS
      // then replacing the new portion with our taper section
      const freshRoad = getRoad(store, roadId)!;
      const newSections = [...freshRoad.lanes];
      newSections.splice(sectionIdx, 0, taperSection);
      store.updateRoad(roadId, { lanes: newSections });
    }

    // Add the lane to the target section (index may have shifted if taper was inserted)
    const targetIdx = hasTaperRoom && sectionIdx > 0 ? sectionIdx + 1 : sectionIdx;
    store.addLane(roadId, targetIdx, side, {});

    // Add default road mark to new lane
    // (addLane via AddLaneCommand already uses createDefaultLane which includes roadMarks)

    // Sync intra-road lane links
    syncIntraRoadLaneLinks(store, roadId);

    // Sync inter-road lane links
    syncLaneLinksForDirectConnections(store, [roadId]);
  } finally {
    store.endBatch();
  }
}

/**
 * Remove a lane from a section with automatic taper generation and link sync.
 * Returns true if a warning was issued (last lane being removed).
 */
export function removeLaneFromSection(
  store: OpenDriveStore,
  roadId: string,
  sectionIdx: number,
  side: 'left' | 'right',
  laneId: number,
  options: LaneEditOptions = {},
): boolean {
  const road = getRoad(store, roadId);
  if (!road) return false;
  const section = road.lanes[sectionIdx];
  if (!section) return false;

  const lanes = side === 'left' ? section.leftLanes : section.rightLanes;
  const isLastLane = lanes.length <= 1;

  const taperLength = options.taperLength ?? 30;

  store.beginBatch(`Remove ${side} lane ${laneId} from road ${roadId}`);

  try {
    // Insert taper section before removal if there's room
    const hasTaperRoom = section.s >= taperLength;

    if (hasTaperRoom && sectionIdx > 0) {
      const taperStartS = section.s - taperLength;
      const taperSection = buildTaperSectionForRemove(road, sectionIdx, side, laneId, taperLength);
      taperSection.s = taperStartS;

      const freshRoad = getRoad(store, roadId)!;
      const newSections = [...freshRoad.lanes];
      newSections.splice(sectionIdx, 0, taperSection);
      store.updateRoad(roadId, { lanes: newSections });
    }

    // Remove the lane
    const targetIdx = hasTaperRoom && sectionIdx > 0 ? sectionIdx + 1 : sectionIdx;
    store.removeLane(roadId, targetIdx, side, laneId);

    // Sync links
    syncIntraRoadLaneLinks(store, roadId);
    syncLaneLinksForDirectConnections(store, [roadId]);
  } finally {
    store.endBatch();
  }

  return isLastLane;
}

/**
 * Compute cubic Hermite coefficients for interval [0, L]:
 *   w(0) = p0,  w'(0) = m0,  w(L) = p1,  w'(L) = m1
 *
 * A cubic is uniquely determined by 4 constraints (value + derivative at 2 points),
 * so this reproduces the original polynomial exactly when the correct values are used.
 */
function hermiteCubic(
  p0: number,
  m0: number,
  p1: number,
  m1: number,
  L: number,
): { sOffset: number; a: number; b: number; c: number; d: number } {
  if (L <= 0) return { sOffset: 0, a: p1, b: 0, c: 0, d: 0 };
  const L2 = L * L;
  const L3 = L2 * L;
  return {
    sOffset: 0,
    a: p0,
    b: m0,
    c: 3 * (p1 - p0) / L2 - 2 * m0 / L - m1 / L,
    d: -2 * (p1 - p0) / L3 + (m0 + m1) / L2,
  };
}

/**
 * Re-express a width polynomial for a sub-range [offset, offset+newLength]
 * of the original [0, oldLength], preserving values AND derivatives exactly.
 *
 * Because a cubic has exactly 4 DOF and we match value + derivative at both
 * endpoints, the result is mathematically identical to the original over the
 * sub-range — no shape change at all.
 */
function splitTaperWidth(
  w: { sOffset: number; a: number; b: number; c: number; d: number },
  _oldLength: number,
  offset: number,
  newLength: number,
): { sOffset: number; a: number; b: number; c: number; d: number } {
  // If not a polynomial (constant width), return as-is
  if (Math.abs(w.b) < 1e-10 && Math.abs(w.c) < 1e-10 && Math.abs(w.d) < 1e-10) return { ...w };

  // Evaluate the original polynomial value and derivative at offset and offset+newLength
  const evalAt = (ds: number) => w.a + ds * (w.b + ds * (w.c + ds * w.d));
  const derivAt = (ds: number) => w.b + ds * (2 * w.c + ds * 3 * w.d);

  const ds0 = offset;
  const ds1 = offset + newLength;

  const p0 = evalAt(ds0);
  const m0 = derivAt(ds0);
  const p1 = evalAt(ds1);
  const m1 = derivAt(ds1);

  return hermiteCubic(p0, m0, p1, m1, newLength);
}

/**
 * Split all taper lanes in a section for the first half [0, splitDs) or second half [splitDs, sectionLength).
 */
function splitTaperLanes(
  section: OdrLaneSection,
  sectionLength: number,
  splitDs: number,
  isFirstHalf: boolean,
): OdrLaneSection {
  const offset = isFirstHalf ? 0 : splitDs;
  const newLength = isFirstHalf ? splitDs : sectionLength - splitDs;

  const updateLanes = (lanes: OdrLaneSection['leftLanes']) =>
    lanes.map((lane) => ({
      ...lane,
      width: lane.width.map((w) => {
        if (Math.abs(w.b) < 1e-10 && Math.abs(w.c) < 1e-10 && Math.abs(w.d) < 1e-10) return w;
        return splitTaperWidth(w, sectionLength, offset, newLength);
      }),
    }));

  return {
    ...section,
    leftLanes: updateLanes(section.leftLanes),
    rightLanes: updateLanes(section.rightLanes),
  };
}

/**
 * Core split logic without batch wrapping (for use inside other batched operations).
 */
function splitLaneSectionCore(
  store: OpenDriveStore,
  roadId: string,
  sectionIdx: number,
  splitS: number,
  minDistance: number,
): boolean {
  const road = getRoad(store, roadId);
  if (!road) return false;
  const section = road.lanes[sectionIdx];
  if (!section) return false;

  const sectionEnd = getSectionEnd(road, sectionIdx);
  if (splitS - section.s < minDistance || sectionEnd - splitS < minDistance) return false;
  if (isNearJunctionConnection(road, splitS, minDistance)) return false;

  const freshRoad = getRoad(store, roadId)!;
  const origSection = freshRoad.lanes[sectionIdx];
  const origLength = getSectionEnd(freshRoad, sectionIdx) - origSection.s;
  const splitDs = splitS - origSection.s;
  const hasTaper = isTaperSection(origSection);

  let newSection: OdrLaneSection = {
    ...structuredClone(origSection),
    s: splitS,
  };

  if (hasTaper) {
    const firstHalf = splitTaperLanes(structuredClone(origSection), origLength, splitDs, true);
    firstHalf.s = origSection.s;

    newSection = splitTaperLanes(structuredClone(origSection), origLength, splitDs, false);
    newSection.s = splitS;

    const newSections = [...freshRoad.lanes];
    newSections[sectionIdx] = firstHalf;
    newSections.splice(sectionIdx + 1, 0, newSection);
    store.updateRoad(roadId, { lanes: newSections });
  } else {
    const newSections = [...freshRoad.lanes];
    newSections.splice(sectionIdx + 1, 0, newSection);
    store.updateRoad(roadId, { lanes: newSections });
  }

  syncIntraRoadLaneLinks(store, roadId);
  return true;
}

/**
 * Split a lane section at the given s position.
 * Validates minimum distance and junction proximity.
 * If the section contains taper lanes, their coefficients are recalculated
 * for the two resulting sections.
 */
export function splitLaneSectionAt(
  store: OpenDriveStore,
  roadId: string,
  sectionIdx: number,
  splitS: number,
  minDistance = 1,
): boolean {
  const road = getRoad(store, roadId);
  if (!road) return false;
  const section = road.lanes[sectionIdx];
  if (!section) return false;

  const sectionEnd = getSectionEnd(road, sectionIdx);
  if (splitS - section.s < minDistance || sectionEnd - splitS < minDistance) return false;
  if (isNearJunctionConnection(road, splitS, minDistance)) return false;

  store.beginBatch(`Split section at s=${splitS.toFixed(1)} on road ${roadId}`);
  try {
    return splitLaneSectionCore(store, roadId, sectionIdx, splitS, minDistance);
  } finally {
    store.endBatch();
  }
}

/**
 * Check if a lane section contains a taper (any lane with non-zero c or d coefficients).
 */
function isTaperSection(section: OdrLaneSection): boolean {
  const allLanes = [...section.leftLanes, ...section.rightLanes];
  return allLanes.some((lane) =>
    lane.width.some((w) => Math.abs(w.c) > 1e-10 || Math.abs(w.d) > 1e-10),
  );
}

/**
 * Re-compute taper coefficients for all taper lanes in a section when its length changes
 * (e.g. due to boundary drag). Preserves the start and end widths with a new S-curve.
 * @param oldLength - the section's length BEFORE the boundary move
 */
function recomputeTaperCoefficients(
  section: OdrLaneSection,
  oldLength: number,
  newLength: number,
): OdrLaneSection {
  const updated = { ...section };
  const updateLanes = (lanes: typeof section.leftLanes) =>
    lanes.map((lane) => ({
      ...lane,
      width: lane.width.map((w) => {
        if (Math.abs(w.c) < 1e-10 && Math.abs(w.d) < 1e-10) return w;
        // Evaluate the original polynomial at old end to get the end width
        const evalAt = (ds: number) => w.a + ds * (w.b + ds * (w.c + ds * w.d));
        const startWidth = evalAt(0);
        const endWidth = evalAt(oldLength);
        return computeCubicTaperCoefficients(startWidth, endWidth, newLength);
      }),
    }));

  updated.leftLanes = updateLanes(section.leftLanes);
  updated.rightLanes = updateLanes(section.rightLanes);
  return updated;
}

/**
 * Move a section boundary (change the s-position of a section).
 * If the adjacent sections contain tapers, their coefficients are recalculated.
 */
export function moveSectionBoundary(
  store: OpenDriveStore,
  roadId: string,
  sectionIdx: number,
  newS: number,
  minDistance = 1,
): boolean {
  const road = getRoad(store, roadId);
  if (!road) return false;
  if (sectionIdx <= 0 || sectionIdx >= road.lanes.length) return false;

  // Validate: newS must be between the previous section's start and the next boundary
  const prevSection = road.lanes[sectionIdx - 1];
  const nextBoundary = getSectionEnd(road, sectionIdx);

  if (newS - prevSection.s < minDistance || nextBoundary - newS < minDistance) return false;

  store.beginBatch(`Move section boundary to s=${newS.toFixed(1)} on road ${roadId}`);

  try {
    const freshRoad = getRoad(store, roadId)!;
    const newSections = freshRoad.lanes.map((section, i) => {
      if (i === sectionIdx) {
        const oldLength = getSectionEnd(freshRoad, i) - section.s;
        const movedSection = { ...section, s: newS };
        // Recalculate taper if this section is a taper
        if (isTaperSection(section)) {
          const newLength = getSectionEnd(freshRoad, i) - newS;
          return recomputeTaperCoefficients(movedSection, oldLength, newLength);
        }
        return movedSection;
      }
      // The previous section's length changes too — recalculate if it's a taper
      if (i === sectionIdx - 1 && isTaperSection(section)) {
        const oldLength = getSectionEnd(freshRoad, i) - section.s;
        const newLength = newS - section.s;
        return recomputeTaperCoefficients(section, oldLength, newLength);
      }
      return section;
    });
    store.updateRoad(roadId, { lanes: newSections });

    syncIntraRoadLaneLinks(store, roadId);
  } finally {
    store.endBatch();
  }

  return true;
}

/**
 * Change the width of a lane in a section.
 * Updates the `a` coefficient (constant width) of all width records.
 */
export function changeLaneWidth(
  store: OpenDriveStore,
  roadId: string,
  sectionIdx: number,
  laneId: number,
  newWidth: number,
): boolean {
  const road = getRoad(store, roadId);
  if (!road) return false;
  const section = road.lanes[sectionIdx];
  if (!section) return false;

  const allLanes = [...section.leftLanes, ...section.rightLanes];
  const lane = allLanes.find((l) => l.id === laneId);
  if (!lane) return false;

  if (newWidth < 0) return false;

  store.beginBatch(`Change lane ${laneId} width to ${newWidth.toFixed(2)} on road ${roadId}`);

  try {
    const freshRoad = getRoad(store, roadId)!;
    const newSections = freshRoad.lanes.map((s, i) => {
      if (i !== sectionIdx) return s;
      const updateLanes = (lanes: typeof s.leftLanes) =>
        lanes.map((l) => {
          if (l.id !== laneId) return l;
          return {
            ...l,
            width: l.width.map((w) => ({ ...w, a: newWidth })),
          };
        });
      return {
        ...s,
        leftLanes: updateLanes(s.leftLanes),
        rightLanes: updateLanes(s.rightLanes),
      };
    });
    store.updateRoad(roadId, { lanes: newSections });

    syncIntraRoadLaneLinks(store, roadId);
  } finally {
    store.endBatch();
  }

  return true;
}

/**
 * Insert a lane at an inner position (between existing lanes) with renumbering.
 * Only renumbers lanes in the affected section.
 */
export function insertLaneInner(
  store: OpenDriveStore,
  roadId: string,
  sectionIdx: number,
  side: 'left' | 'right',
  insertAfterLaneId: number,
  _options: LaneEditOptions = {},
): void {
  const road = getRoad(store, roadId);
  if (!road) return;
  const section = road.lanes[sectionIdx];
  if (!section) return;

  store.beginBatch(`Insert inner ${side} lane after ${insertAfterLaneId} on road ${roadId}`);

  try {
    const freshRoad = getRoad(store, roadId)!;
    const freshSection = freshRoad.lanes[sectionIdx];
    const lanes = side === 'left'
      ? [...freshSection.leftLanes]
      : [...freshSection.rightLanes];

    // Find insertion position
    const insertIdx = lanes.findIndex((l) => l.id === insertAfterLaneId);
    if (insertIdx === -1) {
      store.endBatch();
      return;
    }

    // Renumber outer lanes (shift IDs outward by 1)
    const newLaneId = insertAfterLaneId + (side === 'left' ? 1 : -1);

    // Shift outer lanes
    const renumbered = lanes.map((lane) => {
      if (side === 'left' && lane.id > insertAfterLaneId) {
        return { ...lane, id: lane.id + 1 };
      }
      if (side === 'right' && lane.id < insertAfterLaneId) {
        return { ...lane, id: lane.id - 1 };
      }
      return lane;
    });

    // Create and insert the new lane
    const newLane = createDefaultLane(newLaneId);
    renumbered.splice(insertIdx + 1, 0, newLane);

    // Update the section
    const newSections = freshRoad.lanes.map((s, i) => {
      if (i !== sectionIdx) return s;
      return side === 'left'
        ? { ...s, leftLanes: renumbered }
        : { ...s, rightLanes: renumbered };
    });
    store.updateRoad(roadId, { lanes: newSections });

    // Sync links
    syncIntraRoadLaneLinks(store, roadId);
    syncLaneLinksForDirectConnections(store, [roadId]);
  } finally {
    store.endBatch();
  }
}

/**
 * Create a taper transition over a specified range [startS, endS].
 *
 * Steps:
 *  1. Split the road at startS and endS to isolate the taper section
 *  2. Add a new lane to the taper section with cubic width polynomial
 *  3. Add the same lane (full width) to all sections after endS
 *  4. Sync lane links
 *
 * @param direction - 'narrow-to-wide' means width goes 0→3.5 (lane appears).
 *                    'wide-to-narrow' means width goes 3.5→0 (lane disappears).
 */
export function createTaperAtRange(
  store: OpenDriveStore,
  roadId: string,
  startS: number,
  endS: number,
  side: 'left' | 'right',
  direction: 'narrow-to-wide' | 'wide-to-narrow',
  position: 'outer' | 'inner' = 'outer',
  useLaneOffset = false,
): boolean {
  const road = getRoad(store, roadId);
  if (!road) return false;
  if (endS - startS < 1) return false;

  store.beginBatch(`Create taper s=${startS.toFixed(1)}–${endS.toFixed(1)} on road ${roadId}`);

  try {
    // Step 1a: Split at startS
    {
      const r = getRoad(store, roadId)!;
      let secIdx = 0;
      for (let i = r.lanes.length - 1; i >= 0; i--) {
        if (startS >= r.lanes[i].s) { secIdx = i; break; }
      }
      const secEnd = r.lanes[secIdx + 1]?.s ?? r.length;
      // Only split if startS is inside the section (not at boundaries)
      if (startS - r.lanes[secIdx].s > 0.5 && secEnd - startS > 0.5) {
        splitLaneSectionCore(store, roadId, secIdx, startS, 0.5);
      }
    }

    // Step 1b: Split at endS
    {
      const r = getRoad(store, roadId)!;
      let secIdx = 0;
      for (let i = r.lanes.length - 1; i >= 0; i--) {
        if (endS >= r.lanes[i].s) { secIdx = i; break; }
      }
      const secEnd = r.lanes[secIdx + 1]?.s ?? r.length;
      if (endS - r.lanes[secIdx].s > 0.5 && secEnd - endS > 0.5) {
        splitLaneSectionCore(store, roadId, secIdx, endS, 0.5);
      }
    }

    // Step 2: Find ALL sections in the taper range [startS, endS)
    const r2 = getRoad(store, roadId)!;
    const totalTaperLength = endS - startS;

    // Collect indices of sections that fall within [startS, endS)
    const taperSecIndices: number[] = [];
    for (let i = 0; i < r2.lanes.length; i++) {
      const secStart = r2.lanes[i].s;
      const secEnd = r2.lanes[i + 1]?.s ?? r2.length;
      // Section overlaps with [startS, endS) if secStart < endS && secEnd > startS
      if (secStart < endS - 0.01 && secEnd > startS + 0.01) {
        taperSecIndices.push(i);
      }
    }
    if (taperSecIndices.length === 0) return false;

    // Determine new lane ID from the first taper section
    const firstTaperSection = r2.lanes[taperSecIndices[0]];
    const existingLanes = side === 'left' ? firstTaperSection.leftLanes : firstTaperSection.rightLanes;

    let newLaneId: number;
    if (position === 'inner') {
      // Inner: insert next to center lane (ID = 1 for left, -1 for right)
      newLaneId = side === 'left' ? 1 : -1;
    } else {
      // Outer: add beyond the outermost lane
      newLaneId = side === 'left'
        ? (existingLanes.length > 0 ? Math.max(...existingLanes.map((l) => l.id)) : 0) + 1
        : (existingLanes.length > 0 ? Math.min(...existingLanes.map((l) => l.id)) : 0) - 1;
    }

    // For inner position, check if the innermost ID already exists
    // and shift existing lanes outward if needed
    const needsRenumber = position === 'inner' &&
      existingLanes.some((l) => l.id === newLaneId);

    // Build the global taper polynomial over [0, totalTaperLength]
    const globalStartWidth = direction === 'narrow-to-wide' ? 0 : 3.5;
    const globalEndWidth = direction === 'narrow-to-wide' ? 3.5 : 0;
    const globalCoeffs = computeCubicTaperCoefficients(globalStartWidth, globalEndWidth, totalTaperLength);

    // Helper: renumber lanes outward by 1 to make room for the inner lane
    const renumberOutward = (lanes: OdrLaneSection['leftLanes']): OdrLaneSection['leftLanes'] => {
      if (!needsRenumber) return lanes;
      return lanes.map((l) => ({
        ...l,
        id: side === 'left' ? l.id + 1 : l.id - 1,
      }));
    };

    // Helper: insert the taper lane into a lane array
    const insertTaperLane = (
      lanes: OdrLaneSection['leftLanes'],
      taperLane: OdrLaneSection['leftLanes'][0],
    ): OdrLaneSection['leftLanes'] => {
      const renumbered = renumberOutward(lanes);
      if (renumbered.some((l) => l.id === newLaneId)) return renumbered;
      renumbered.push(taperLane);
      if (side === 'left') {
        renumbered.sort((a, b) => a.id - b.id);
      } else {
        renumbered.sort((a, b) => b.id - a.id);
      }
      return renumbered;
    };

    // For each section in the taper range, compute the appropriate sub-range of the polynomial
    const r3 = getRoad(store, roadId)!;
    const taperSecSet = new Set(taperSecIndices);
    const lastTaperIdx = taperSecIndices[taperSecIndices.length - 1];

    const updatedSections = r3.lanes.map((sec, i) => {
      if (!taperSecSet.has(i)) return sec;

      const secStart = sec.s;
      const secEnd = r3.lanes[i + 1]?.s ?? r3.length;

      // Offset within the global taper polynomial
      const offset = Math.max(0, secStart - startS);
      const secLength = secEnd - secStart;

      // Compute sub-range coefficients using Hermite interpolation (exact split)
      const evalAt = (ds: number) => globalCoeffs.a + ds * (globalCoeffs.b + ds * (globalCoeffs.c + ds * globalCoeffs.d));
      const derivAt = (ds: number) => globalCoeffs.b + ds * (2 * globalCoeffs.c + ds * 3 * globalCoeffs.d);

      const p0 = evalAt(offset);
      const m0 = derivAt(offset);
      const p1 = evalAt(offset + secLength);
      const m1 = derivAt(offset + secLength);

      const localCoeffs = hermiteCubic(p0, m0, p1, m1, secLength);

      const newLane = createDefaultLane(newLaneId);
      newLane.width = [localCoeffs];

      const srcLanes = side === 'left' ? [...sec.leftLanes] : [...sec.rightLanes];
      const updatedLanes = insertTaperLane(srcLanes, newLane);

      return side === 'left'
        ? { ...sec, leftLanes: updatedLanes }
        : { ...sec, rightLanes: updatedLanes };
    });
    store.updateRoad(roadId, { lanes: updatedSections });

    // Step 3: For narrow-to-wide, add full-width lane to all sections after the taper range
    if (direction === 'narrow-to-wide') {
      const r4 = getRoad(store, roadId)!;
      const extendedSections = r4.lanes.map((sec, i) => {
        if (i <= lastTaperIdx) return sec;

        const srcLanes = side === 'left' ? [...sec.leftLanes] : [...sec.rightLanes];

        const fullLane = createDefaultLane(newLaneId);
        fullLane.width = [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }];
        const updatedLanes = insertTaperLane(srcLanes, fullLane);

        // Skip if no change (lane already existed and wasn't added)
        const origCount = (side === 'left' ? sec.leftLanes : sec.rightLanes).length;
        if (updatedLanes.length === origCount) return sec;

        return side === 'left'
          ? { ...sec, leftLanes: updatedLanes }
          : { ...sec, rightLanes: updatedLanes };
      });
      store.updateRoad(roadId, { lanes: extendedSections });
    }

    // Step 4: Apply lane offset if requested
    // The offset at any point = ±0.5 × width_of_new_lane at that point.
    // Right side lane → positive offset (shift center left)
    // Left side lane → negative offset (shift center right)
    // This works regardless of direction flips because it's derived directly
    // from the global width polynomial.
    if (useLaneOffset) {
      const r5 = getRoad(store, roadId)!;
      // Scale factor: +0.5 for right (shift left), -0.5 for left (shift right)
      const m = side === 'right' ? 0.5 : -0.5;

      const newOffsets = [...r5.laneOffset];

      // Taper range: offset = m × width polynomial (same shape as the taper)
      newOffsets.push({
        s: startS,
        a: globalCoeffs.a * m,
        b: globalCoeffs.b * m,
        c: globalCoeffs.c * m,
        d: globalCoeffs.d * m,
      });

      // After taper: constant offset at final width, or return to 0
      const endWidth = globalCoeffs.a
        + globalCoeffs.b * totalTaperLength
        + globalCoeffs.c * totalTaperLength ** 2
        + globalCoeffs.d * totalTaperLength ** 3;
      newOffsets.push({ s: endS, a: endWidth * m, b: 0, c: 0, d: 0 });

      // Sort by s and update
      newOffsets.sort((a, b) => a.s - b.s);
      store.updateRoad(roadId, { laneOffset: newOffsets });
    }

    // Step 5: Sync lane links
    syncIntraRoadLaneLinks(store, roadId);
    syncLaneLinksForDirectConnections(store, [roadId]);
  } finally {
    store.endBatch();
  }

  return true;
}
