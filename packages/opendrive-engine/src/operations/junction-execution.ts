/**
 * Junction execution operations.
 *
 * Executes a JunctionCreationPlan against the OpenDrive and EditorMetadata stores,
 * handling road splitting, link propagation, connecting road generation,
 * and virtual road metadata management.
 *
 * Separated from the detection hook so that:
 * - Logic is testable without React
 * - The hook stays focused on WHEN to create/remove junctions
 * - This module handles HOW to create/remove them
 */

import type { OpenDriveStore } from '../store/opendrive-store.js';
import type { EditorMetadataStore } from '../store/editor-metadata-store.js';
import type { JunctionMetadata, VirtualRoad } from '../store/editor-metadata-types.js';
import type { JunctionCreationPlan } from './junction-operations.js';
import { syncLaneLinksForDirectConnections as syncLaneLinksImpl } from './lane-link-operations.js';

// Re-export for backward compatibility
export { syncLaneLinksForDirectConnections, buildSectionWithLaneLinks } from './lane-link-operations.js';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ExecuteJunctionResult {
  /** Actual junction ID assigned by the store. */
  junctionId: string;
  /** Actual connecting road IDs assigned by the store. */
  connectingRoadIds: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Update a junction's connections to replace an old incomingRoad ID with a new one.
 * Needed when a segment road is re-split by a later junction creation.
 */
function updateJunctionIncomingRoad(
  store: OpenDriveStore,
  junctionId: string,
  oldRoadId: string,
  newRoadId: string,
): void {
  const doc = store.getDocument();
  const junction = doc.junctions.find((j) => j.id === junctionId);
  if (!junction) return;

  const updatedConnections = junction.connections.map((conn) =>
    conn.incomingRoad === oldRoadId ? { ...conn, incomingRoad: newRoadId } : conn,
  );

  store.updateJunction(junctionId, { connections: updatedConnections });
}

/**
 * Add a VirtualRoad to the metadata store, but only if it doesn't already
 * exist (either as a direct match or as a segment of an existing VR).
 *
 * This prevents duplicate VR entries when a road is re-split by a second
 * junction — the road-split loop's `updateVirtualRoadSegments` already
 * replaced the old segment ID with the new sub-segments, so we don't
 * need a new VR entry.
 */
function addVirtualRoadIfNew(
  metaStore: EditorMetadataStore,
  newVR: VirtualRoad,
): void {
  const existing = metaStore.metadata.virtualRoads.find(
    (vr) => vr.virtualRoadId === newVR.virtualRoadId,
  );
  if (existing) return; // Already tracked under this ID

  // Check if this road ID is already a segment of an existing VR
  // (happens when a segment road is re-split by a later junction)
  const parentVR = metaStore.findVirtualRoadBySegment(newVR.virtualRoadId);
  if (parentVR) return; // Already tracked as a segment of another VR

  metaStore.addVirtualRoad(newVR);
}

// ---------------------------------------------------------------------------
// Junction creation
// ---------------------------------------------------------------------------

/**
 * Execute a JunctionCreationPlan against the stores.
 *
 * Performs all store mutations in order:
 * 1. Split original roads into before/after segments
 * 2. Propagate predecessor/successor links to segments
 * 3. Restore back-links from other roads
 * 4. Update VirtualRoad metadata for re-splits
 * 5. Add the junction
 * 6. Add connecting roads
 * 7. Set road links on segments pointing to the junction
 * 8. Persist VirtualRoad and JunctionMetadata
 *
 * Callers should wrap this in store.beginBatch()/endBatch() for single-step undo.
 */
export function executeJunctionCreationPlan(
  odrStore: OpenDriveStore,
  metaStore: EditorMetadataStore,
  plan: JunctionCreationPlan,
): ExecuteJunctionResult {
  // --- 1. Replace original roads with split segments ---
  for (const split of plan.roadSplits) {
    // Read original road's links BEFORE removing it so we can propagate them
    const preSplitDoc = odrStore.getDocument();
    const originalRoad = preSplitDoc.roads.find((r) => r.id === split.originalRoadId);
    const originalPred = originalRoad?.link?.predecessor;
    const originalSucc = originalRoad?.link?.successor;

    // Collect back-links BEFORE removeRoad, because RemoveRoadCommand
    // automatically clears all references to the deleted road from other roads.
    // We need to restore these links pointing to the correct new segment.
    const backLinks: {
      roadId: string;
      linkType: 'predecessor' | 'successor';
      contactPoint: 'start' | 'end' | undefined;
    }[] = [];
    for (const road of preSplitDoc.roads) {
      if (road.id === split.originalRoadId) continue;
      if (
        road.link?.predecessor?.elementType === 'road' &&
        road.link.predecessor.elementId === split.originalRoadId
      ) {
        backLinks.push({
          roadId: road.id,
          linkType: 'predecessor',
          contactPoint: road.link.predecessor.contactPoint,
        });
      }
      if (
        road.link?.successor?.elementType === 'road' &&
        road.link.successor.elementId === split.originalRoadId
      ) {
        backLinks.push({
          roadId: road.id,
          linkType: 'successor',
          contactPoint: road.link.successor.contactPoint,
        });
      }
    }

    // Remove the original road (this clears back-links on other roads)
    odrStore.removeRoad(split.originalRoadId);

    // Add the before and after segments
    odrStore.addRoad(split.beforeSegment);
    odrStore.addRoad(split.afterSegment);

    // --- 2. Inherit predecessor link to beforeSegment ---
    if (originalPred) {
      odrStore.setRoadLink(split.beforeSegment.id, 'predecessor', originalPred);

      // Update the previous junction's connections to reference the new segment
      if (originalPred.elementType === 'junction') {
        updateJunctionIncomingRoad(
          odrStore,
          originalPred.elementId,
          split.originalRoadId,
          split.beforeSegment.id,
        );
      }
    }

    // --- 3. Inherit successor link to afterSegment ---
    if (originalSucc) {
      odrStore.setRoadLink(split.afterSegment.id, 'successor', originalSucc);

      // Update the later junction's connections to reference the new segment
      if (originalSucc.elementType === 'junction') {
        updateJunctionIncomingRoad(
          odrStore,
          originalSucc.elementId,
          split.originalRoadId,
          split.afterSegment.id,
        );
      }
    }

    // --- 4. Restore back-links that were cleared by removeRoad ---
    // contactPoint 'start' referenced the original's start → beforeSegment
    // contactPoint 'end' referenced the original's end → afterSegment
    for (const bl of backLinks) {
      const newTargetId =
        bl.contactPoint === 'start' ? split.beforeSegment.id : split.afterSegment.id;
      odrStore.setRoadLink(bl.roadId, bl.linkType, {
        elementType: 'road',
        elementId: newTargetId,
        contactPoint: bl.contactPoint,
      });
    }

    // --- 5. Update VirtualRoad metadata: replace old segment ID with the two new ones ---
    const freshMeta = metaStore.metadata;
    for (const vr of freshMeta.virtualRoads) {
      const idx = vr.segmentRoadIds.indexOf(split.originalRoadId);
      if (idx !== -1) {
        const newSegIds = [...vr.segmentRoadIds];
        newSegIds.splice(idx, 1, split.beforeSegment.id, split.afterSegment.id);
        metaStore.updateVirtualRoadSegments(vr.virtualRoadId, newSegIds);
        break;
      }
    }

    // --- 5b. Repair stale incomingRoad references in existing junctions ---
    // After removing the original road and adding segments, existing junctions
    // may still reference the old road ID in their connections. Use connecting
    // road links as ground truth to find the correct replacement.
    const postSplitDoc = odrStore.getDocument();
    for (const junction of postSplitDoc.junctions) {
      const hasStale = junction.connections.some(
        (c) => c.incomingRoad === split.originalRoadId,
      );
      if (!hasStale) continue;

      const updated = junction.connections.map((conn) => {
        if (conn.incomingRoad !== split.originalRoadId) return conn;
        // Use connecting road's predecessor link as ground truth
        const connRoad = postSplitDoc.roads.find((r) => r.id === conn.connectingRoad);
        if (!connRoad) return conn;
        const actualId = connRoad.link?.predecessor?.elementId;
        if (actualId && postSplitDoc.roads.some((r) => r.id === actualId)) {
          return { ...conn, incomingRoad: actualId };
        }
        return conn;
      });
      odrStore.updateJunction(junction.id, { connections: updated });
    }
  }

  // --- 6. Add junction ---
  const addedJunction = odrStore.addJunction({
    name: plan.junction.name,
    type: plan.junction.type ?? 'default',
    connections: plan.junction.connections,
  });

  // --- 7. Add connecting roads with the actual junction ID ---
  const addedConnRoadIds: string[] = [];
  for (const connRoad of plan.connectingRoads) {
    const added = odrStore.addRoad({
      ...connRoad,
      junction: addedJunction.id,
    });
    addedConnRoadIds.push(added.id);
  }

  // --- 8. Set road links on segment roads pointing to the junction ---
  // Build a lookup of which segment+contactPoint faces the junction,
  // then iterate roadSplits (whose IDs match the actually-added roads)
  // to set the junction link.
  const junctionFacing = new Set(
    plan.incomingEndpoints.map((ep) => `${ep.roadId}:${ep.contactPoint}`),
  );

  for (const split of plan.roadSplits) {
    // Before segment's END faces the junction → successor = junction
    if (junctionFacing.has(`${split.beforeSegment.id}:end`)) {
      odrStore.setRoadLink(split.beforeSegment.id, 'successor', {
        elementType: 'junction',
        elementId: addedJunction.id,
      });
    }
    // After segment's START faces the junction → predecessor = junction
    if (junctionFacing.has(`${split.afterSegment.id}:start`)) {
      odrStore.setRoadLink(split.afterSegment.id, 'predecessor', {
        elementType: 'junction',
        elementId: addedJunction.id,
      });
    }
  }

  // Verify links were actually set
  const postDoc = odrStore.getDocument();
  for (const ep of plan.incomingEndpoints) {
    const road = postDoc.roads.find((r) => r.id === ep.roadId);
    const linkType = ep.contactPoint === 'end' ? 'successor' : 'predecessor';
    const link = road?.link?.[linkType];
    if (!road) {
      console.warn(
        `[junction-execution] Road ${ep.roadId} not found in document after junction creation`,
      );
    } else if (!link || link.elementId !== addedJunction.id) {
      console.warn(
        `[junction-execution] Road ${ep.roadId} missing ${linkType} link to junction ${addedJunction.id}`,
      );
    }
  }

  // --- 9. Synchronize lane-level links for direct road-to-road connections ---
  // Segment roads that are NOT junction-facing have direct road-to-road links
  // and need explicit lane predecessor/successor IDs per OpenDRIVE spec.
  const allSegmentIds = plan.roadSplits.flatMap((split) => [
    split.beforeSegment.id,
    split.afterSegment.id,
  ]);
  syncLaneLinksImpl(odrStore, allSegmentIds);

  // --- 10. Persist virtual roads and junction metadata ---
  for (const vr of plan.virtualRoads) {
    addVirtualRoadIfNew(metaStore, vr);
  }
  metaStore.addJunctionMetadata({
    ...plan.junctionMetadata,
    junctionId: addedJunction.id,
    connectingRoadIds: addedConnRoadIds,
    autoCreated: true,
  });

  return {
    junctionId: addedJunction.id,
    connectingRoadIds: addedConnRoadIds,
  };
}

// ---------------------------------------------------------------------------
// Junction removal
// ---------------------------------------------------------------------------

/**
 * Collect all segment road IDs tracked by a junction's virtual roads.
 */
function getSegmentRoadIdsForJunction(
  metaStore: EditorMetadataStore,
  virtualRoadIds: string[],
): string[] {
  const segmentIds: string[] = [];
  for (const vrId of virtualRoadIds) {
    const vr = metaStore.metadata.virtualRoads.find((v) => v.virtualRoadId === vrId);
    if (vr) {
      segmentIds.push(...vr.segmentRoadIds);
    }
  }
  return segmentIds;
}

/**
 * Remove an auto-created junction, its connecting roads, and segment roads.
 * Also cleans up the corresponding editor metadata.
 *
 * Callers should wrap this in store.beginBatch()/endBatch() for single-step undo.
 */
export function executeJunctionRemoval(
  odrStore: OpenDriveStore,
  metaStore: EditorMetadataStore,
  junctionId: string,
  meta: JunctionMetadata,
): void {
  const segmentRoadIds = getSegmentRoadIdsForJunction(metaStore, meta.intersectingVirtualRoadIds);

  // Clear road links pointing to this junction before removing it
  const doc = odrStore.getDocument();
  for (const road of doc.roads) {
    if (
      road.link?.predecessor?.elementType === 'junction' &&
      road.link.predecessor.elementId === junctionId
    ) {
      odrStore.setRoadLink(road.id, 'predecessor', undefined);
    }
    if (
      road.link?.successor?.elementType === 'junction' &&
      road.link.successor.elementId === junctionId
    ) {
      odrStore.setRoadLink(road.id, 'successor', undefined);
    }
  }

  // Remove connecting roads
  for (const connRoadId of meta.connectingRoadIds) {
    if (odrStore.getDocument().roads.some((r) => r.id === connRoadId)) {
      odrStore.removeRoad(connRoadId);
    }
  }

  // Remove segment roads
  for (const segId of segmentRoadIds) {
    if (odrStore.getDocument().roads.some((r) => r.id === segId)) {
      odrStore.removeRoad(segId);
    }
  }

  // Remove junction
  if (odrStore.getDocument().junctions.some((j) => j.id === junctionId)) {
    odrStore.removeJunction(junctionId);
  }

  // Clean up editor metadata
  metaStore.removeJunctionMetadata(junctionId);
  for (const vrId of meta.intersectingVirtualRoadIds) {
    metaStore.removeVirtualRoad(vrId);
  }
}
