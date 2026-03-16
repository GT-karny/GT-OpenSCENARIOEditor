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
  executeJunctionCreationPlan,
  executeJunctionRemoval,
  validateJunctionPlan,
} from '@osce/opendrive-engine';
import type {
  OpenDriveStore,
  EditorMetadataStore,
  JunctionCreationPlan,
} from '@osce/opendrive-engine';
import type { StoreApi } from 'zustand';

interface UseAutoJunctionDetectionOptions {
  /** Whether auto-detection is enabled. */
  enabled: boolean;
  /** Store API for reading/writing OpenDRIVE data. */
  odrStoreApi: StoreApi<OpenDriveStore>;
  /** Store API for editor metadata (virtual roads, junction metadata). */
  editorMetadataStoreApi: StoreApi<EditorMetadataStore>;
}

// ---------------------------------------------------------------------------
// Pair key helpers
// ---------------------------------------------------------------------------

function makePairKey(hit: IntersectionResult): string {
  const a = hit.roadIdA;
  const b = hit.roadIdB;
  return a < b ? `${a}:${b}` : `${b}:${a}`;
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

// ---------------------------------------------------------------------------
// Phase 1: Cleanup stale auto-junctions
// ---------------------------------------------------------------------------

/**
 * Validate existing auto-junctions and remove any whose segment roads
 * no longer exist in the document.
 */
function cleanupStaleJunctions(
  odrStoreApi: StoreApi<OpenDriveStore>,
  metaStoreApi: StoreApi<EditorMetadataStore>,
): void {
  const metaStore = metaStoreApi.getState();
  const autoJunctionMetas = metaStore.metadata.junctionMetadata.filter((m) => m.autoCreated);

  for (const meta of autoJunctionMetas) {
    // Always read fresh document after potential mutations
    const store = odrStoreApi.getState();
    const freshDoc = store.document;

    // Check if the junction itself still exists in the document
    const junctionExists = freshDoc.junctions.some((j) => j.id === meta.junctionId);
    if (!junctionExists) {
      // Junction was removed externally (e.g., manual delete) — clean up metadata only
      metaStore.removeJunctionMetadata(meta.junctionId);
      for (const vrId of meta.intersectingVirtualRoadIds) {
        metaStore.removeVirtualRoad(vrId);
      }
      continue;
    }

    // Check if segment roads still exist
    const segmentRoadIds = getSegmentRoadIdsForJunction(
      metaStore,
      meta.intersectingVirtualRoadIds,
    );
    const segmentsExist =
      segmentRoadIds.length > 0 &&
      segmentRoadIds.some((id) => freshDoc.roads.some((r) => r.id === id));

    if (!segmentsExist) {
      // No segment roads found — remove the junction and metadata
      store.beginBatch(`Remove stale junction ${meta.junctionId}`);
      executeJunctionRemoval(store, metaStore, meta.junctionId, meta);
      store.endBatch();
    }
  }
}

// ---------------------------------------------------------------------------
// Phase 2: Build handled pair keys
// ---------------------------------------------------------------------------

/**
 * Build sets of pair keys for intersections already handled by existing junctions.
 * Returns both auto-junction pairs and manual-junction pairs.
 */
function buildHandledPairKeys(
  doc: OpenDriveDocument,
  metaStore: EditorMetadataStore,
): { autoKeys: Set<string>; manualKeys: Set<string>; autoJunctionIds: Set<string> } {
  const autoKeys = new Set<string>();
  const manualKeys = new Set<string>();
  const autoJunctionIds = new Set<string>();

  for (const meta of metaStore.metadata.junctionMetadata.filter((m) => m.autoCreated)) {
    autoJunctionIds.add(meta.junctionId);
    const junc = doc.junctions.find((j) => j.id === meta.junctionId);
    if (junc) {
      addPairKeysFromConnections(junc.connections, autoKeys);
    }
  }

  for (const junc of doc.junctions) {
    if (autoJunctionIds.has(junc.id)) continue;
    addPairKeysFromConnections(junc.connections, manualKeys);
  }

  return { autoKeys, manualKeys, autoJunctionIds };
}

function addPairKeysFromConnections(
  connections: { incomingRoad: string }[],
  keys: Set<string>,
): void {
  const ids = [...new Set(connections.map((c) => c.incomingRoad))];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      keys.add(ids[i] < ids[j] ? `${ids[i]}:${ids[j]}` : `${ids[j]}:${ids[i]}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Phase 3: Detect and process new intersections
// ---------------------------------------------------------------------------

/**
 * Build the set of road IDs that should be excluded from intersection detection
 * (connecting roads and roads already belonging to a junction).
 */
function buildExcludeIds(doc: OpenDriveDocument): Set<string> {
  const excludeIds = new Set<string>();
  for (const junction of doc.junctions) {
    for (const conn of junction.connections) {
      excludeIds.add(conn.connectingRoad);
    }
  }
  for (const road of doc.roads) {
    if (road.junction !== '-1') {
      excludeIds.add(road.id);
    }
  }
  return excludeIds;
}

/** Maximum iterations to prevent infinite loops in junction creation. */
const MAX_JUNCTION_ITERATIONS = 10;

/**
 * Check if two junction creation plans conflict (share a road that would be split).
 * Conflicting plans cannot be executed in the same iteration because
 * the first split changes road IDs, invalidating the second plan.
 */
function plansConflict(
  planA: JunctionCreationPlan,
  planB: JunctionCreationPlan,
): boolean {
  const roadsA = new Set(planA.roadSplits.map((s) => s.originalRoadId));
  for (const split of planB.roadSplits) {
    if (roadsA.has(split.originalRoadId)) return true;
  }
  return false;
}

/**
 * Select non-conflicting plans from a set of candidates.
 *
 * Uses a greedy approach: sort plans by the earliest split s-coordinate
 * (process "earlier" junctions first), then greedily add plans that don't
 * conflict with already-selected ones.
 */
function selectNonConflictingPlans(
  candidates: Array<{ plan: JunctionCreationPlan; hit: IntersectionResult }>,
): JunctionCreationPlan[] {
  if (candidates.length <= 1) {
    return candidates.map((c) => c.plan);
  }

  // Sort by minimum s-coordinate (process early intersections first)
  const sorted = [...candidates].sort((a, b) => {
    const minSA = Math.min(a.hit.sA, a.hit.sB);
    const minSB = Math.min(b.hit.sA, b.hit.sB);
    return minSA - minSB;
  });

  const selected: JunctionCreationPlan[] = [];
  for (const candidate of sorted) {
    const hasConflict = selected.some((sel) => plansConflict(sel, candidate.plan));
    if (!hasConflict) {
      selected.push(candidate.plan);
    }
  }

  return selected;
}

/**
 * Iteratively detect new intersections and create junctions.
 *
 * Improved approach:
 * 1. Detect all intersections
 * 2. Plan all unhandled junctions
 * 3. Detect conflicts between plans (shared roads)
 * 4. Select non-conflicting subset
 * 5. Execute selected plans sequentially (s-order for shared roads)
 * 6. Re-detect for remaining intersections (new road IDs after splitting)
 */
function processNewIntersections(
  odrStoreApi: StoreApi<OpenDriveStore>,
  metaStoreApi: StoreApi<EditorMetadataStore>,
): void {
  const routingConfig = createDefaultLaneRoutingConfig();
  let iterationCount = 0;

  while (iterationCount < MAX_JUNCTION_ITERATIONS) {
    iterationCount++;

    const store = odrStoreApi.getState();
    const freshDoc = store.document;
    const metaStore = metaStoreApi.getState();

    // Detect intersections, excluding connecting/junction roads
    const excludeIds = buildExcludeIds(freshDoc);
    const freshIntersections = detectRoadIntersections(freshDoc.roads, {
      excludeRoadIds: excludeIds,
    });

    if (freshIntersections.length === 0) break;

    // Build handled keys from current state
    const { autoKeys, manualKeys } = buildHandledPairKeys(freshDoc, metaStore);

    // Phase A: Plan all unhandled intersections
    const candidates: Array<{ plan: JunctionCreationPlan; hit: IntersectionResult }> = [];
    for (const hit of freshIntersections) {
      const pairKey = makePairKey(hit);
      if (autoKeys.has(pairKey) || manualKeys.has(pairKey)) continue;

      const currentDoc = odrStoreApi.getState().document;
      const plan = planJunctionCreation(currentDoc, {
        intersection: hit,
        routingConfig,
        evaluateAtS: evaluateReferenceLineAtS,
      });

      if (!plan) continue;

      // Validate the plan
      const validation = validateJunctionPlan(plan, currentDoc);
      if (!validation.valid) {
        console.warn(
          `[auto-junction] Skipping invalid junction plan:`,
          validation.errors.map((e) => e.message),
        );
        continue;
      }
      if (validation.warnings.length > 0) {
        console.debug(
          `[auto-junction] Plan warnings:`,
          validation.warnings.map((w) => w.message),
        );
      }

      candidates.push({ plan, hit });
    }

    if (candidates.length === 0) break;

    // Phase B: Select non-conflicting plans
    const plansToExecute = selectNonConflictingPlans(candidates);

    // Phase C: Execute selected plans sequentially
    let executedAny = false;
    for (const plan of plansToExecute) {
      // Re-read fresh store state (previous execution may have changed it)
      const currentStore = odrStoreApi.getState();
      const currentMeta = metaStoreApi.getState();

      currentStore.beginBatch(`Create junction at intersection`);
      executeJunctionCreationPlan(currentStore, currentMeta, plan);
      currentStore.endBatch();
      executedAny = true;
    }

    if (!executedAny) break;

    // If we only executed one plan and there were more candidates,
    // continue to re-detect (road IDs changed). If we executed all
    // candidates, we still re-detect in case splitting created new crossings.
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

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
    (_document: OpenDriveDocument) => {
      if (!enabled) return;

      // Phase 1: Validate and clean up stale auto-junctions
      cleanupStaleJunctions(odrStoreApi, editorMetadataStoreApi);

      // Phase 2 & 3: Detect new intersections and create junctions
      processNewIntersections(odrStoreApi, editorMetadataStoreApi);
    },
    [enabled, odrStoreApi, editorMetadataStoreApi],
  );

  const resetAutoJunctions = useCallback(() => {
    editorMetadataStoreApi.getState().resetMetadata();
  }, [editorMetadataStoreApi]);

  return { checkForIntersections, resetAutoJunctions };
}
