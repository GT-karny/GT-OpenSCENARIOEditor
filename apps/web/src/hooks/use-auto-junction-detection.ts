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
 * Iteratively detect new intersections and create junctions.
 *
 * Re-detects after each junction creation because road IDs change
 * after splitting — old intersection hits would reference stale IDs.
 * Processes one junction per iteration for correctness.
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

    // Find and process the first valid unhandled intersection
    let processedOne = false;
    for (const hit of freshIntersections) {
      const pairKey = makePairKey(hit);
      if (autoKeys.has(pairKey) || manualKeys.has(pairKey)) continue;

      // Plan junction creation with fresh document
      const currentDoc = odrStoreApi.getState().document;
      const plan = planJunctionCreation(currentDoc, {
        intersection: hit,
        routingConfig,
        evaluateAtS: evaluateReferenceLineAtS,
      });

      if (!plan) continue;

      // Execute the plan as a single undo step
      store.beginBatch(`Create junction at intersection`);
      executeJunctionCreationPlan(store, metaStore, plan);
      store.endBatch();

      processedOne = true;
      break;
    }

    if (!processedOne) break;
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
