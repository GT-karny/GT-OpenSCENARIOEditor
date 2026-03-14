/**
 * Hook that automatically detects road intersections and creates/removes junctions.
 *
 * After any road geometry change (drag end, road creation), this hook:
 * 1. Runs intersection detection on the affected roads
 * 2. For new intersections, creates a junction with connecting roads
 * 3. When an intersection no longer exists, removes the junction and its connecting roads
 * 4. When an intersection moves (road dragged), rebuilds the junction at the new position
 */

import { useCallback, useRef } from 'react';
import type { OpenDriveDocument } from '@osce/shared';
import { detectRoadIntersections, evaluateReferenceLineAtS } from '@osce/opendrive';
import type { IntersectionResult } from '@osce/opendrive';
import {
  planJunctionCreation,
  createDefaultLaneRoutingConfig,
} from '@osce/opendrive-engine';
import type { OpenDriveStore } from '@osce/opendrive-engine';
import type { StoreApi } from 'zustand';

interface UseAutoJunctionDetectionOptions {
  /** Whether auto-detection is enabled. */
  enabled: boolean;
  /** Store API for reading/writing OpenDRIVE data. */
  odrStoreApi: StoreApi<OpenDriveStore>;
}

/** Distance threshold (meters) to consider an intersection as "moved". */
const MOVE_THRESHOLD = 1.0;

/**
 * Info about an auto-created junction, used for cleanup when intersection disappears.
 */
interface AutoJunctionRecord {
  junctionId: string;
  connectingRoadIds: string[];
  pairKey: string;
  /** Intersection point at the time of creation. */
  point: { x: number; y: number };
}

/**
 * Remove an auto-created junction and its connecting roads from the store.
 */
function removeAutoJunction(store: OpenDriveStore, record: AutoJunctionRecord): void {
  for (const connRoadId of record.connectingRoadIds) {
    if (store.document.roads.some((r) => r.id === connRoadId)) {
      store.removeRoad(connRoadId);
    }
  }
  if (store.document.junctions.some((j) => j.id === record.junctionId)) {
    store.removeJunction(record.junctionId);
  }
}

/**
 * Returns a `checkForIntersections` callback that runs intersection detection
 * on the current document, auto-creates junctions for new crossings,
 * and auto-removes junctions when roads no longer cross.
 */
export function useAutoJunctionDetection({
  enabled,
  odrStoreApi,
}: UseAutoJunctionDetectionOptions) {
  // Track auto-created junctions for cleanup
  const autoJunctionsRef = useRef<AutoJunctionRecord[]>([]);

  const checkForIntersections = useCallback(
    (document: OpenDriveDocument) => {
      if (!enabled) return;

      // Collect connecting road IDs to exclude from detection
      const connectingRoadIds = new Set<string>();
      for (const junction of document.junctions) {
        for (const conn of junction.connections) {
          connectingRoadIds.add(conn.connectingRoad);
        }
      }
      for (const road of document.roads) {
        if (road.junction !== '-1') {
          connectingRoadIds.add(road.id);
        }
      }

      // Detect current intersections
      const intersections = detectRoadIntersections(document.roads, {
        excludeRoadIds: connectingRoadIds,
      });

      // Build map of current intersection results by pair key
      const currentHitsByPairKey = new Map<string, IntersectionResult>();
      for (const hit of intersections) {
        currentHitsByPairKey.set(makePairKey(hit), hit);
      }

      // --- Cleanup: remove/keep/rebuild auto-junctions ---
      const store = odrStoreApi.getState();
      const survivingRecords: AutoJunctionRecord[] = [];

      for (const record of autoJunctionsRef.current) {
        const newHit = currentHitsByPairKey.get(record.pairKey);
        if (!newHit) {
          // No longer intersecting — remove
          removeAutoJunction(store, record);
        } else {
          const dx = newHit.point.x - record.point.x;
          const dy = newHit.point.y - record.point.y;
          if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD) {
            // Intersection moved — remove (will be recreated below)
            removeAutoJunction(store, record);
          } else {
            // Unchanged — keep
            survivingRecords.push(record);
          }
        }
      }
      autoJunctionsRef.current = survivingRecords;

      // --- Create: add junctions for new or moved intersections ---
      // Build set of pair keys that already have a surviving auto-junction
      const existingAutoKeys = new Set(survivingRecords.map((r) => r.pairKey));

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
        if (existingAutoKeys.has(pairKey) || manualJunctionPairs.has(pairKey)) {
          continue;
        }

        // Plan junction creation
        const currentDoc = store.document;
        const plan = planJunctionCreation(currentDoc, {
          intersection: hit,
          routingConfig,
          evaluateAtS: evaluateReferenceLineAtS,
        });

        if (!plan) continue;

        // Execute: add connecting roads, then junction
        const addedConnRoadIds: string[] = [];
        for (const connRoad of plan.connectingRoads) {
          const added = store.addRoad({
            ...connRoad,
            junction: plan.junction.id,
          });
          addedConnRoadIds.push(added.id);
        }

        const addedJunction = store.addJunction({
          name: plan.junction.name,
          type: 'default',
          connections: plan.junction.connections,
        });

        // Track for cleanup
        autoJunctionsRef.current.push({
          junctionId: addedJunction.id,
          connectingRoadIds: addedConnRoadIds,
          pairKey,
          point: { x: hit.point.x, y: hit.point.y },
        });
      }
    },
    [enabled, odrStoreApi],
  );

  const resetAutoJunctions = useCallback(() => {
    autoJunctionsRef.current = [];
  }, []);

  return { checkForIntersections, resetAutoJunctions };
}

function makePairKey(hit: IntersectionResult): string {
  const a = hit.roadIdA;
  const b = hit.roadIdB;
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}
