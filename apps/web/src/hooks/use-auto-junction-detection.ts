/**
 * Hook that automatically detects road intersections and creates/removes junctions.
 *
 * After any road geometry change (drag end, road creation), this hook:
 * 1. Runs intersection detection on the affected roads
 * 2. For new intersections, splits roads at junction boundaries and creates
 *    connecting roads between the resulting segments
 * 3. When an intersection no longer exists, removes the junction, reconnects segments
 * 4. When an intersection moves (road dragged), rebuilds the junction at the new position
 *
 * Junction tracking is persisted via EditorMetadataStore (VirtualRoad + JunctionMetadata)
 * instead of ephemeral useRef state, ensuring junctions survive across detection cycles.
 */

import { useCallback } from 'react';
import type { OpenDriveDocument } from '@osce/shared';
import { detectRoadIntersections, evaluateReferenceLineAtS } from '@osce/opendrive';
import type { IntersectionResult } from '@osce/opendrive';
import {
  planJunctionCreation,
  createDefaultLaneRoutingConfig,
} from '@osce/opendrive-engine';
import type { OpenDriveStore, EditorMetadataStore } from '@osce/opendrive-engine';
import type { StoreApi } from 'zustand';

interface UseAutoJunctionDetectionOptions {
  /** Whether auto-detection is enabled. */
  enabled: boolean;
  /** Store API for reading/writing OpenDRIVE data. */
  odrStoreApi: StoreApi<OpenDriveStore>;
  /** Store API for editor metadata (virtual roads, junction metadata). */
  editorMetadataStoreApi: StoreApi<EditorMetadataStore>;
}

/**
 * Remove an auto-created junction, its connecting roads, and segment roads from the store.
 * Also cleans up the corresponding editor metadata.
 */
function removeAutoJunction(
  store: OpenDriveStore,
  metaStore: EditorMetadataStore,
  junctionId: string,
  connectingRoadIds: string[],
  segmentRoadIds: string[],
  virtualRoadIds: string[],
): void {
  // Clear road links pointing to this junction before removing it
  for (const road of store.document.roads) {
    if (
      road.link?.predecessor?.elementType === 'junction' &&
      road.link.predecessor.elementId === junctionId
    ) {
      store.setRoadLink(road.id, 'predecessor', undefined);
    }
    if (
      road.link?.successor?.elementType === 'junction' &&
      road.link.successor.elementId === junctionId
    ) {
      store.setRoadLink(road.id, 'successor', undefined);
    }
  }

  // Remove connecting roads
  for (const connRoadId of connectingRoadIds) {
    if (store.document.roads.some((r) => r.id === connRoadId)) {
      store.removeRoad(connRoadId);
    }
  }

  // Remove segment roads
  for (const segId of segmentRoadIds) {
    if (store.document.roads.some((r) => r.id === segId)) {
      store.removeRoad(segId);
    }
  }

  // Remove junction
  if (store.document.junctions.some((j) => j.id === junctionId)) {
    store.removeJunction(junctionId);
  }

  // Clean up editor metadata
  metaStore.removeJunctionMetadata(junctionId);
  for (const vrId of virtualRoadIds) {
    metaStore.removeVirtualRoad(vrId);
  }
}

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
 * Returns a `checkForIntersections` callback that runs intersection detection
 * on the current document, auto-creates junctions for new crossings,
 * and auto-removes junctions when roads no longer cross.
 *
 * Uses EditorMetadataStore for persistent junction tracking instead of
 * ephemeral useRef, so junctions survive across multiple detection cycles.
 */
export function useAutoJunctionDetection({
  enabled,
  odrStoreApi,
  editorMetadataStoreApi,
}: UseAutoJunctionDetectionOptions) {
  const checkForIntersections = useCallback(
    (document: OpenDriveDocument) => {
      if (!enabled) return;

      // Collect connecting road IDs and segment road IDs to exclude from detection
      const excludeRoadIds = new Set<string>();
      for (const junction of document.junctions) {
        for (const conn of junction.connections) {
          excludeRoadIds.add(conn.connectingRoad);
        }
      }
      for (const road of document.roads) {
        if (road.junction !== '-1') {
          excludeRoadIds.add(road.id);
        }
      }

      // Detect current intersections
      const intersections = detectRoadIntersections(document.roads, {
        excludeRoadIds,
      });

      // Build map of current intersection results by pair key
      const currentHitsByPairKey = new Map<string, IntersectionResult>();
      for (const hit of intersections) {
        currentHitsByPairKey.set(makePairKey(hit), hit);
      }

      // --- Cleanup: validate existing auto-junctions ---
      const store = odrStoreApi.getState();
      const metaStore = editorMetadataStoreApi.getState();
      const autoJunctionMetas = metaStore.metadata.junctionMetadata.filter(
        (m) => m.autoCreated,
      );

      // Track which pair keys are already handled by surviving auto-junctions
      const handledPairKeys = new Set<string>();

      for (const meta of autoJunctionMetas) {
        // Check if the junction itself still exists in the document
        const junctionExists = store.document.junctions.some(
          (j) => j.id === meta.junctionId,
        );
        if (!junctionExists) {
          // Junction was removed externally (e.g., manual delete) — clean up metadata only
          metaStore.removeJunctionMetadata(meta.junctionId);
          for (const vrId of meta.intersectingVirtualRoadIds) {
            metaStore.removeVirtualRoad(vrId);
          }
          continue;
        }

        // Collect segment road IDs for this junction's virtual roads
        const segmentRoadIds = getSegmentRoadIdsForJunction(
          metaStore,
          meta.intersectingVirtualRoadIds,
        );

        // Check if segment roads still exist — if roads were split, originals are gone
        // but segments should still be present. If segments exist, the junction is valid.
        const segmentsExist = segmentRoadIds.length > 0 &&
          segmentRoadIds.some((id) => store.document.roads.some((r) => r.id === id));

        if (segmentsExist) {
          // Junction is valid (roads were split and segments exist) — keep it.
          // Mark all pair keys involving this junction's incoming roads as handled.
          const incomingRoadIds = new Set<string>();
          const junction = store.document.junctions.find((j) => j.id === meta.junctionId);
          if (junction) {
            for (const conn of junction.connections) {
              incomingRoadIds.add(conn.incomingRoad);
            }
          }
          const ids = [...incomingRoadIds];
          for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
              handledPairKeys.add(
                ids[i] < ids[j] ? `${ids[i]}:${ids[j]}` : `${ids[j]}:${ids[i]}`,
              );
            }
          }
        } else {
          // No segment roads found — junction's roads may have been fully removed.
          // Remove the junction and metadata.
          removeAutoJunction(
            store,
            metaStore,
            meta.junctionId,
            meta.connectingRoadIds,
            segmentRoadIds,
            meta.intersectingVirtualRoadIds,
          );
        }
      }

      // --- Create: add junctions for new intersections ---
      // Also check manually-created junctions
      const refreshedDoc = store.document;
      const manualJunctionPairs = new Set<string>();
      for (const junction of refreshedDoc.junctions) {
        const roadIds = new Set<string>();
        for (const conn of junction.connections) {
          roadIds.add(conn.incomingRoad);
        }
        const ids = [...roadIds];
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            manualJunctionPairs.add(
              ids[i] < ids[j] ? `${ids[i]}:${ids[j]}` : `${ids[j]}:${ids[i]}`,
            );
          }
        }
      }

      const routingConfig = createDefaultLaneRoutingConfig();

      for (const hit of intersections) {
        const pairKey = makePairKey(hit);

        // Skip if already handled (auto or manual)
        if (handledPairKeys.has(pairKey) || manualJunctionPairs.has(pairKey)) {
          continue;
        }

        // Plan junction creation (includes road splitting)
        const currentDoc = store.document;
        const plan = planJunctionCreation(currentDoc, {
          intersection: hit,
          routingConfig,
          evaluateAtS: evaluateReferenceLineAtS,
        });

        if (!plan) continue;

        // --- Execute the plan ---

        // 1. Replace original roads with split segments
        for (const split of plan.roadSplits) {
          // Remove the original road
          store.removeRoad(split.originalRoadId);

          // Add the before and after segments
          store.addRoad(split.beforeSegment);
          store.addRoad(split.afterSegment);
        }

        // 2. Add connecting roads
        const addedConnRoadIds: string[] = [];
        for (const connRoad of plan.connectingRoads) {
          const added = store.addRoad({
            ...connRoad,
            junction: plan.junction.id,
          });
          addedConnRoadIds.push(added.id);
        }

        // 3. Add junction
        const addedJunction = store.addJunction({
          name: plan.junction.name,
          type: 'default',
          connections: plan.junction.connections,
        });

        // 4. Set road links on segment roads pointing to the junction
        for (const ep of plan.incomingEndpoints) {
          const linkType: 'predecessor' | 'successor' =
            ep.contactPoint === 'end' ? 'successor' : 'predecessor';
          store.setRoadLink(ep.roadId, linkType, {
            elementType: 'junction',
            elementId: addedJunction.id,
          });
        }

        // 5. Persist virtual roads and junction metadata in EditorMetadataStore
        const freshMetaStore = editorMetadataStoreApi.getState();
        for (const vr of plan.virtualRoads) {
          freshMetaStore.addVirtualRoad(vr);
        }
        freshMetaStore.addJunctionMetadata({
          ...plan.junctionMetadata,
          junctionId: addedJunction.id,
          connectingRoadIds: addedConnRoadIds,
          autoCreated: true,
        });
      }
    },
    [enabled, odrStoreApi, editorMetadataStoreApi],
  );

  const resetAutoJunctions = useCallback(() => {
    editorMetadataStoreApi.getState().resetMetadata();
  }, [editorMetadataStoreApi]);

  return { checkForIntersections, resetAutoJunctions };
}

function makePairKey(hit: IntersectionResult): string {
  const a = hit.roadIdA;
  const b = hit.roadIdB;
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}
