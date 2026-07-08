/**
 * Lane-level link operations for direct road-to-road connections.
 *
 * OpenDRIVE spec (v1.6 opendrive_16_lane.xsd:357-359) requires explicit lane
 * predecessor/successor links when roads share a direct road-to-road connection
 * (not via junction). This module provides utilities to synchronize and clear
 * those lane links.
 *
 * Extracted from junction-execution.ts for reuse across chain editing,
 * road extension, disconnect, and xodr import flows.
 */

import type { OdrLane, OdrLaneLink, OdrLaneSection } from '@osce/shared';
import { computeLaneInnerT, computeLaneOuterT, computeLaneWidth } from '@osce/opendrive';

/** An empty lane link (both sides unlinked). */
const emptyLaneLink = (): OdrLaneLink => ({ predecessors: [], successors: [] });
import type { OpenDriveStore } from '../store/opendrive-store.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build an updated laneSection with lane-level links set for a direct road-to-road connection.
 *
 * Lane IDs are matched by value (lane -1 ↔ lane -1, lane 1 ↔ lane 1, etc.).
 *
 * Returns [updatedSection, modified] — a new section object if changes were needed.
 */
export function buildSectionWithLaneLinks(
  section: OdrLaneSection,
  linkType: 'predecessors' | 'successors',
  targetSection: OdrLaneSection,
): [OdrLaneSection, boolean] {
  const targetLaneIds = new Set([
    ...targetSection.leftLanes.map((l) => l.id),
    ...targetSection.rightLanes.map((l) => l.id),
  ]);

  let modified = false;
  const updateLanes = (lanes: OdrLaneSection['leftLanes']) =>
    lanes.map((lane) => {
      if (targetLaneIds.has(lane.id)) {
        // A direct road-to-road link is 1:1 (lane.id ↔ lane.id).
        const current = lane.link?.[linkType];
        if (!(current?.length === 1 && current[0].id === lane.id)) {
          modified = true;
          const base: OdrLaneLink = lane.link ?? emptyLaneLink();
          return { ...lane, link: { ...base, [linkType]: [{ id: lane.id }] } };
        }
      }
      return lane;
    });

  const updatedLeft = updateLanes(section.leftLanes);
  const updatedRight = updateLanes(section.rightLanes);

  if (!modified) return [section, false];
  return [{ ...section, leftLanes: updatedLeft, rightLanes: updatedRight }, true];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Synchronize lane-level links for roads that have direct road-to-road connections.
 * Iterates through the specified road IDs and sets lane predecessor/successor IDs
 * based on road-level link topology.
 */
export function syncLaneLinksForDirectConnections(
  odrStore: OpenDriveStore,
  roadIds: string[],
): void {
  const processedPairs = new Set<string>();

  // Helper: apply lane link updates to a road if any section changed
  const applyUpdate = (
    roadId: string,
    lanes: OdrLaneSection[],
    sectionIdx: number,
    updatedSection: OdrLaneSection,
  ) => {
    const newLanes = lanes.map((ls, i) => (i === sectionIdx ? updatedSection : ls));
    odrStore.updateRoad(roadId, { lanes: newLanes });
  };

  for (const roadId of roadIds) {
    // Re-read doc after each iteration since updateRoad changes the document
    const currentDoc = odrStore.getDocument();
    const road = currentDoc.roads.find((r) => r.id === roadId);
    if (!road || road.lanes.length === 0) continue;

    // Process successor link (road-to-road only)
    if (road.link?.successor?.elementType === 'road') {
      const targetId = road.link.successor.elementId;
      const pairKey = `${roadId}:succ:${targetId}`;
      if (!processedPairs.has(pairKey)) {
        processedPairs.add(pairKey);
        const targetRoad = currentDoc.roads.find((r) => r.id === targetId);
        if (targetRoad && targetRoad.lanes.length > 0) {
          const contactPoint = road.link.successor.contactPoint;
          const thisIdx = road.lanes.length - 1;
          const targetIdx = contactPoint === 'start' ? 0 : targetRoad.lanes.length - 1;

          // This road's last laneSection → successor link
          const [updatedThis, thisModified] = buildSectionWithLaneLinks(
            road.lanes[thisIdx],
            'successors',
            targetRoad.lanes[targetIdx],
          );
          if (thisModified) {
            applyUpdate(roadId, road.lanes, thisIdx, updatedThis);
          }

          // Target road's facing laneSection → predecessorId or successorId
          const targetLinkType =
            contactPoint === 'start' ? 'predecessors' : 'successors';
          const [updatedTarget, targetModified] = buildSectionWithLaneLinks(
            targetRoad.lanes[targetIdx],
            targetLinkType,
            road.lanes[thisIdx],
          );
          if (targetModified) {
            applyUpdate(targetId, targetRoad.lanes, targetIdx, updatedTarget);
          }
        }
      }
    }

    // Process predecessor link (road-to-road only)
    if (road.link?.predecessor?.elementType === 'road') {
      const targetId = road.link.predecessor.elementId;
      const pairKey = `${roadId}:pred:${targetId}`;
      if (!processedPairs.has(pairKey)) {
        processedPairs.add(pairKey);
        // Re-read for fresh data after potential successor update above
        const freshDoc = odrStore.getDocument();
        const freshRoad = freshDoc.roads.find((r) => r.id === roadId);
        const targetRoad = freshDoc.roads.find((r) => r.id === targetId);
        if (freshRoad && targetRoad && freshRoad.lanes.length > 0 && targetRoad.lanes.length > 0) {
          const contactPoint = road.link.predecessor.contactPoint;
          const thisIdx = 0;
          const targetIdx = contactPoint === 'start' ? 0 : targetRoad.lanes.length - 1;

          // This road's first laneSection → predecessor link
          const [updatedThis, thisModified] = buildSectionWithLaneLinks(
            freshRoad.lanes[thisIdx],
            'predecessors',
            targetRoad.lanes[targetIdx],
          );
          if (thisModified) {
            applyUpdate(roadId, freshRoad.lanes, thisIdx, updatedThis);
          }

          // Target road's facing laneSection
          const targetLinkType =
            contactPoint === 'start' ? 'predecessors' : 'successors';
          const [updatedTarget, targetModified] = buildSectionWithLaneLinks(
            targetRoad.lanes[targetIdx],
            targetLinkType,
            freshRoad.lanes[thisIdx],
          );
          if (targetModified) {
            applyUpdate(targetId, targetRoad.lanes, targetIdx, updatedTarget);
          }
        }
      }
    }
  }
}

/**
 * Clear lane-level links on a road for the specified side (predecessor or successor).
 *
 * When a road-to-road connection is broken, the lane-level links should also be
 * cleared to avoid stale references.
 *
 * - side === 'predecessor' → clears predecessors from the first laneSection's lanes
 * - side === 'successor' → clears successors from the last laneSection's lanes
 */
export function clearLaneLinks(
  odrStore: OpenDriveStore,
  roadId: string,
  side: 'predecessor' | 'successor',
): void {
  const doc = odrStore.getDocument();
  const road = doc.roads.find((r) => r.id === roadId);
  if (!road || road.lanes.length === 0) return;

  const sectionIdx = side === 'predecessor' ? 0 : road.lanes.length - 1;
  const linkProp = side === 'predecessor' ? 'predecessors' : 'successors';
  const section = road.lanes[sectionIdx];

  let modified = false;

  const clearFromLanes = (lanes: OdrLaneSection['leftLanes']) =>
    lanes.map((lane) => {
      if (lane.link && lane.link[linkProp].length > 0) {
        modified = true;
        const newLink: OdrLaneLink = { ...lane.link, [linkProp]: [] };
        // If the link becomes empty on both sides, remove it entirely.
        const hasAny = newLink.predecessors.length > 0 || newLink.successors.length > 0;
        return { ...lane, link: hasAny ? newLink : undefined };
      }
      return lane;
    });

  const updatedLeft = clearFromLanes(section.leftLanes);
  const updatedRight = clearFromLanes(section.rightLanes);

  if (modified) {
    const updatedSection: OdrLaneSection = {
      ...section,
      leftLanes: updatedLeft,
      rightLanes: updatedRight,
    };
    const newLanes = road.lanes.map((ls, i) => (i === sectionIdx ? updatedSection : ls));
    odrStore.updateRoad(roadId, { lanes: newLanes });
  }
}

/** Minimum t-tolerance for a lane-center match, used when all candidates are zero-width. */
const LINK_T_FLOOR = 0.5;

/**
 * Lateral t of a lane's center within a section, evaluated `ds` from the section
 * start. Center lane (id 0) lies on the reference line (t = 0).
 */
function laneCenterT(section: OdrLaneSection, lane: OdrLane, ds: number): number {
  if (lane.id === 0) return 0;
  return (computeLaneInnerT(section, lane, ds) + computeLaneOuterT(section, lane, ds)) / 2;
}

interface LaneCenter {
  lane: OdrLane;
  t: number;
}

/**
 * Mutual nearest-neighbor match between two lane lists by lane-center t.
 * Returns a map from `a` lane id → `b` lane id for pairs (X, Y) where X's nearest
 * is Y AND Y's nearest is X, and their centers are within `tolerance`. Lanes
 * without a mutual partner — e.g. a newly inserted zero-width lane on the inner
 * side — are intentionally absent so they receive no link.
 */
function mutualNearestMatch(
  a: LaneCenter[],
  b: LaneCenter[],
  tolerance: number,
): Map<number, number> {
  const result = new Map<number, number>();
  if (a.length === 0 || b.length === 0) return result;

  const nearest = (from: LaneCenter, list: LaneCenter[]): LaneCenter => {
    let best = list[0];
    let bestDist = Math.abs(from.t - best.t);
    for (const c of list) {
      const d = Math.abs(from.t - c.t);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    return best;
  };

  for (const x of a) {
    const y = nearest(x, b);
    const back = nearest(y, a);
    if (back.lane.id === x.lane.id && Math.abs(x.t - y.t) <= tolerance) {
      result.set(x.lane.id, y.lane.id);
    }
  }
  return result;
}

/**
 * Apply a desired link target to each lane, following the existing link-object
 * conventions (delete the prop when undefined; drop an empty link entirely).
 * Returns the same array reference when nothing changed.
 */
function applyLaneLinks(
  lanes: OdrLane[],
  prop: 'successors' | 'predecessors',
  desired: Map<number, number>,
): OdrLane[] {
  let changed = false;
  const out = lanes.map((lane) => {
    const target = desired.get(lane.id);
    const current = lane.link?.[prop] ?? [];
    // Intra-road matching yields a single target per lane; represent it as a
    // one-element array (or empty when there is no match).
    const isCorrect =
      target === undefined ? current.length === 0 : current.length === 1 && current[0].id === target;
    if (isCorrect) return lane;
    changed = true;
    const base: OdrLaneLink = lane.link ?? emptyLaneLink();
    const newLink: OdrLaneLink = { ...base, [prop]: target === undefined ? [] : [{ id: target }] };
    const hasAny = newLink.predecessors.length > 0 || newLink.successors.length > 0;
    return { ...lane, link: hasAny ? newLink : undefined };
  });
  return changed ? out : lanes;
}

/**
 * Recompute intra-road lane links across each internal lane-section boundary by
 * **geometric mutual-nearest-neighbor matching** of lane-center t — not by lane
 * ID. When a lane is inserted on the inner side, the through lane's ID shifts
 * (e.g. -1 → -2); ID-based matching would wrongly link the through lane to the
 * new zero-width lane. Matching by lane-center t keeps the physically continuous
 * lane linked and leaves the new lane unlinked on its closed end.
 *
 * Each side (left/right) is matched independently; the center lane (id 0) is
 * never linked. Road-to-road end links (the first section's predecessors and the
 * last section's successors) are outside any internal boundary and preserved.
 *
 * Pure: takes and returns lane sections, returning the same reference when
 * unchanged. Shared by `syncIntraRoadLaneLinks` and the xodr repair script.
 */
export function relinkIntraRoadLanes(sections: OdrLaneSection[]): OdrLaneSection[] {
  if (sections.length <= 1) return sections;

  let result = sections;
  let anyModified = false;

  for (let i = 0; i < result.length - 1; i++) {
    const sectionA = result[i];
    const sectionB = result[i + 1];
    const dsA = sectionB.s - sectionA.s; // A evaluated at the shared boundary

    const aSucc = new Map<number, number>(); // A lane id → B lane id
    const bPred = new Map<number, number>(); // B lane id → A lane id

    for (const side of ['left', 'right'] as const) {
      const lanesA = side === 'left' ? sectionA.leftLanes : sectionA.rightLanes;
      const lanesB = side === 'left' ? sectionB.leftLanes : sectionB.rightLanes;
      const aCenters = lanesA.map<LaneCenter>((l) => ({ lane: l, t: laneCenterT(sectionA, l, dsA) }));
      const bCenters = lanesB.map<LaneCenter>((l) => ({ lane: l, t: laneCenterT(sectionB, l, 0) }));

      // Tolerance ≈ one lane width, so a clearly displaced match is rejected even
      // if it happens to be mutual; floored so zero-width lanes can still match.
      const tolerance = Math.max(
        LINK_T_FLOOR,
        ...lanesA.map((l) => computeLaneWidth(l, dsA)),
        ...lanesB.map((l) => computeLaneWidth(l, 0)),
      );

      for (const [aId, bId] of mutualNearestMatch(aCenters, bCenters, tolerance)) {
        aSucc.set(aId, bId);
        bPred.set(bId, aId);
      }
    }

    const newALeft = applyLaneLinks(sectionA.leftLanes, 'successors', aSucc);
    const newARight = applyLaneLinks(sectionA.rightLanes, 'successors', aSucc);
    const newBLeft = applyLaneLinks(sectionB.leftLanes, 'predecessors', bPred);
    const newBRight = applyLaneLinks(sectionB.rightLanes, 'predecessors', bPred);

    const aChanged = newALeft !== sectionA.leftLanes || newARight !== sectionA.rightLanes;
    const bChanged = newBLeft !== sectionB.leftLanes || newBRight !== sectionB.rightLanes;

    if (aChanged || bChanged) {
      anyModified = true;
      result = result.map((s, idx) => {
        if (idx === i && aChanged) return { ...s, leftLanes: newALeft, rightLanes: newARight };
        if (idx === i + 1 && bChanged) return { ...s, leftLanes: newBLeft, rightLanes: newBRight };
        return s;
      });
    }
  }

  return anyModified ? result : sections;
}

/**
 * Synchronize lane-level predecessor/successor links between adjacent lane
 * sections within the same road. Delegates to {@link relinkIntraRoadLanes} and
 * writes the result back to the store.
 *
 * This should be called after adding/removing lanes or splitting sections.
 */
export function syncIntraRoadLaneLinks(odrStore: OpenDriveStore, roadId: string): void {
  const doc = odrStore.getDocument();
  const road = doc.roads.find((r) => r.id === roadId);
  if (!road || road.lanes.length <= 1) return;

  const newLanes = relinkIntraRoadLanes(road.lanes);
  if (newLanes !== road.lanes) {
    odrStore.updateRoad(roadId, { lanes: newLanes });
  }
}
