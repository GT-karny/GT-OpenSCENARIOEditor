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
import { buildTaperSectionForAdd, buildTaperSectionForRemove } from './lane-taper-operations.js';
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
 * Split a lane section at the given s position.
 * Validates minimum distance and junction proximity.
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

  // Validate minimum distance from section boundaries
  const sectionEnd = getSectionEnd(road, sectionIdx);
  if (splitS - section.s < minDistance || sectionEnd - splitS < minDistance) return false;

  // Check junction proximity
  if (isNearJunctionConnection(road, splitS, minDistance)) return false;

  store.beginBatch(`Split section at s=${splitS.toFixed(1)} on road ${roadId}`);

  try {
    // Execute split via the store's SplitLaneSectionCommand
    const freshRoad = getRoad(store, roadId)!;
    const newSection: OdrLaneSection = {
      ...structuredClone(freshRoad.lanes[sectionIdx]),
      s: splitS,
    };
    const newSections = [...freshRoad.lanes];
    newSections.splice(sectionIdx + 1, 0, newSection);
    store.updateRoad(roadId, { lanes: newSections });

    // Sync links
    syncIntraRoadLaneLinks(store, roadId);
  } finally {
    store.endBatch();
  }

  return true;
}

/**
 * Move a section boundary (change the s-position of a section).
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
    const newSections = freshRoad.lanes.map((s, i) =>
      i === sectionIdx ? { ...s, s: newS } : s,
    );
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
