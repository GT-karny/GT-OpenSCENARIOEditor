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

import type { OdrLaneSection } from '@osce/shared';
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
  linkType: 'predecessorId' | 'successorId',
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
        const currentVal = lane.link?.[linkType];
        if (currentVal !== lane.id) {
          modified = true;
          return { ...lane, link: { ...lane.link, [linkType]: lane.id } };
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

          // This road's last laneSection → successorId
          const [updatedThis, thisModified] = buildSectionWithLaneLinks(
            road.lanes[thisIdx],
            'successorId',
            targetRoad.lanes[targetIdx],
          );
          if (thisModified) {
            applyUpdate(roadId, road.lanes, thisIdx, updatedThis);
          }

          // Target road's facing laneSection → predecessorId or successorId
          const targetLinkType =
            contactPoint === 'start' ? 'predecessorId' : 'successorId';
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

          // This road's first laneSection → predecessorId
          const [updatedThis, thisModified] = buildSectionWithLaneLinks(
            freshRoad.lanes[thisIdx],
            'predecessorId',
            targetRoad.lanes[targetIdx],
          );
          if (thisModified) {
            applyUpdate(roadId, freshRoad.lanes, thisIdx, updatedThis);
          }

          // Target road's facing laneSection
          const targetLinkType =
            contactPoint === 'start' ? 'predecessorId' : 'successorId';
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
 * - side === 'predecessor' → clears predecessorId from the first laneSection's lanes
 * - side === 'successor' → clears successorId from the last laneSection's lanes
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
  const linkProp = side === 'predecessor' ? 'predecessorId' : 'successorId';
  const section = road.lanes[sectionIdx];

  let modified = false;

  const clearFromLanes = (lanes: OdrLaneSection['leftLanes']) =>
    lanes.map((lane) => {
      if (lane.link?.[linkProp] != null) {
        modified = true;
        const newLink = { ...lane.link };
        delete newLink[linkProp];
        // If link becomes empty, remove it entirely
        const hasAny = newLink.predecessorId != null || newLink.successorId != null;
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

/**
 * Synchronize lane-level predecessor/successor links between adjacent lane sections
 * within the same road. Uses index-based matching: lanes with the same ID in
 * neighboring sections are linked. Lanes that exist in only one section get no link.
 *
 * This should be called after adding/removing lanes or splitting sections.
 */
export function syncIntraRoadLaneLinks(odrStore: OpenDriveStore, roadId: string): void {
  const doc = odrStore.getDocument();
  const road = doc.roads.find((r) => r.id === roadId);
  if (!road || road.lanes.length <= 1) return;

  let anyModified = false;
  let sections = road.lanes;

  for (let i = 0; i < sections.length - 1; i++) {
    const sectionA = sections[i];
    const sectionB = sections[i + 1];

    const idsInA = new Set([
      ...sectionA.leftLanes.map((l) => l.id),
      ...sectionA.rightLanes.map((l) => l.id),
    ]);
    const idsInB = new Set([
      ...sectionB.leftLanes.map((l) => l.id),
      ...sectionB.rightLanes.map((l) => l.id),
    ]);

    let sectionAModified = false;
    let sectionBModified = false;

    // Update successorId on section[i] lanes
    const updateSuccessor = (lanes: OdrLaneSection['leftLanes']) =>
      lanes.map((lane) => {
        const desired = idsInB.has(lane.id) ? lane.id : undefined;
        if (lane.link?.successorId !== desired) {
          sectionAModified = true;
          const newLink = { ...lane.link, successorId: desired };
          if (newLink.successorId === undefined) delete newLink.successorId;
          const hasAny = newLink.predecessorId != null || newLink.successorId != null;
          return { ...lane, link: hasAny ? newLink : undefined };
        }
        return lane;
      });

    // Update predecessorId on section[i+1] lanes
    const updatePredecessor = (lanes: OdrLaneSection['leftLanes']) =>
      lanes.map((lane) => {
        const desired = idsInA.has(lane.id) ? lane.id : undefined;
        if (lane.link?.predecessorId !== desired) {
          sectionBModified = true;
          const newLink = { ...lane.link, predecessorId: desired };
          if (newLink.predecessorId === undefined) delete newLink.predecessorId;
          const hasAny = newLink.predecessorId != null || newLink.successorId != null;
          return { ...lane, link: hasAny ? newLink : undefined };
        }
        return lane;
      });

    const updatedALeft = updateSuccessor(sectionA.leftLanes);
    const updatedARight = updateSuccessor(sectionA.rightLanes);
    const updatedBLeft = updatePredecessor(sectionB.leftLanes);
    const updatedBRight = updatePredecessor(sectionB.rightLanes);

    if (sectionAModified || sectionBModified) {
      anyModified = true;
      sections = sections.map((s, idx) => {
        if (idx === i && sectionAModified) {
          return { ...s, leftLanes: updatedALeft, rightLanes: updatedARight };
        }
        if (idx === i + 1 && sectionBModified) {
          return { ...s, leftLanes: updatedBLeft, rightLanes: updatedBRight };
        }
        return s;
      });
    }
  }

  if (anyModified) {
    odrStore.updateRoad(roadId, { lanes: sections });
  }
}
