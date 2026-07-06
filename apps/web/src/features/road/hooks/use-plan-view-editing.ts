/**
 * Plan-view (reference-line geometry) editing for the road-network editor.
 *
 * Owns geometry selection (single + multi), the drag-end handlers for every
 * plan-view manipulation (move, heading, curvature, endpoint, startpoint), and
 * multi-segment deletion. All cumulative-s rewalks and per-geometry patches go
 * through the plan-view engine helpers; each mutating handler re-runs auto
 * junction detection afterwards.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StoreApi } from 'zustand';
import type { OdrRoad, OpenDriveDocument, OdrGeometryUpdate } from '@osce/shared';
import type { OpenDriveStore } from '@osce/opendrive-engine';
import {
  recalculatePlanViewS,
  computePlanViewLength,
  patchPlanViewGeometry,
} from '@osce/opendrive-engine';

interface UsePlanViewEditingParams {
  odrStoreApi: StoreApi<OpenDriveStore>;
  roads: readonly OdrRoad[];
  /** Reset trigger: geometry selection clears when the selected road changes. */
  selectedRoadId: string | null;
  /** Re-run auto junction detection after any geometry mutation. */
  checkForIntersections: (document: OpenDriveDocument) => void;
}

export interface UsePlanViewEditingResult {
  selectedGeometryIndex: number | null;
  selectedGeometryIndices: Set<number>;
  handleGeometrySelect: (roadId: string, geometryIndex: number) => void;
  handleGeometryShiftClick: (roadId: string, geometryIndex: number) => void;
  handleDeleteSelectedGeometry: () => void;
  handleGeometryDragEnd: (
    roadId: string,
    geometryIndex: number,
    newX: number,
    newY: number,
  ) => void;
  handleHeadingDragEnd: (roadId: string, geometryIndex: number, newHdg: number) => void;
  handleCurvatureDragEnd: (roadId: string, geometryIndex: number, newCurvature: number) => void;
  handleEndpointDragEnd: (
    roadId: string,
    geometryIndex: number,
    updates: { hdg?: number; length: number; curvature?: number; type?: 'line' | 'arc' },
  ) => void;
  handleStartpointDragEnd: (
    roadId: string,
    geometryIndex: number,
    updates: {
      x: number;
      y: number;
      hdg: number;
      length: number;
      curvature?: number;
      type?: 'line' | 'arc';
    },
  ) => void;
}

export function usePlanViewEditing({
  odrStoreApi,
  roads,
  selectedRoadId,
  checkForIntersections,
}: UsePlanViewEditingParams): UsePlanViewEditingResult {
  const [selectedGeometryIndex, setSelectedGeometryIndex] = useState<number | null>(null);
  const [selectedGeometryIndices, setSelectedGeometryIndices] = useState<Set<number>>(new Set());

  // Reset geometry selection when road changes
  useEffect(() => {
    setSelectedGeometryIndex(null);
    setSelectedGeometryIndices(new Set());
  }, [selectedRoadId]);

  const handleGeometrySelect = useCallback((_roadId: string, geometryIndex: number) => {
    setSelectedGeometryIndex(geometryIndex);
    setSelectedGeometryIndices(new Set([geometryIndex]));
  }, []);

  const handleGeometryShiftClick = useCallback((_roadId: string, geometryIndex: number) => {
    setSelectedGeometryIndices((prev) => {
      const next = new Set(prev);
      if (next.has(geometryIndex)) {
        next.delete(geometryIndex);
      } else {
        next.add(geometryIndex);
      }
      // Update primary selection to the last toggled item
      if (next.size > 0) {
        setSelectedGeometryIndex(geometryIndex);
      } else {
        setSelectedGeometryIndex(null);
      }
      return next;
    });
  }, []);

  const handleDeleteSelectedGeometry = useCallback(() => {
    if (!selectedRoadId || selectedGeometryIndices.size === 0) return;
    const road = roads.find((r) => r.id === selectedRoadId);
    if (!road || road.planView.length <= 1) return;

    // Filter out selected indices, preserving at least one geometry
    const remaining = road.planView.filter((_, i) => !selectedGeometryIndices.has(i));
    if (remaining.length === 0) return;

    // Recalculate s values
    const updatedPlanView = recalculatePlanViewS(remaining);

    odrStoreApi.getState().updateRoad(selectedRoadId, { planView: updatedPlanView });
    setSelectedGeometryIndex(null);
    setSelectedGeometryIndices(new Set());
  }, [selectedRoadId, selectedGeometryIndices, roads, odrStoreApi]);

  const handleGeometryDragEnd = useCallback(
    (roadId: string, geometryIndex: number, newX: number, newY: number) => {
      const road = roads.find((r) => r.id === roadId);
      if (!road) return;
      if (!road.planView[geometryIndex]) return;
      const updatedPlanView = patchPlanViewGeometry(road.planView, geometryIndex, {
        x: newX,
        y: newY,
      });
      odrStoreApi.getState().updateRoad(roadId, { planView: updatedPlanView });
      checkForIntersections(odrStoreApi.getState().document);
    },
    [roads, odrStoreApi, checkForIntersections],
  );

  const handleHeadingDragEnd = useCallback(
    (roadId: string, geometryIndex: number, newHdg: number) => {
      const road = roads.find((r) => r.id === roadId);
      if (!road) return;
      if (!road.planView[geometryIndex]) return;
      const updatedPlanView = patchPlanViewGeometry(road.planView, geometryIndex, { hdg: newHdg });
      odrStoreApi.getState().updateRoad(roadId, { planView: updatedPlanView });
      checkForIntersections(odrStoreApi.getState().document);
    },
    [roads, odrStoreApi, checkForIntersections],
  );

  const handleCurvatureDragEnd = useCallback(
    (roadId: string, geometryIndex: number, newCurvature: number) => {
      const road = roads.find((r) => r.id === roadId);
      if (!road) return;
      const geo = road.planView[geometryIndex];
      // Curvature only applies to arc segments (the drag handle only renders on arcs).
      if (geo && geo.type === 'arc') {
        const updatedPlanView = patchPlanViewGeometry(road.planView, geometryIndex, {
          curvature: newCurvature,
        });
        odrStoreApi.getState().updateRoad(roadId, { planView: updatedPlanView });
        checkForIntersections(odrStoreApi.getState().document);
      }
    },
    [roads, odrStoreApi, checkForIntersections],
  );

  const handleEndpointDragEnd = useCallback(
    (
      roadId: string,
      geometryIndex: number,
      updates: { hdg?: number; length: number; curvature?: number; type?: 'line' | 'arc' },
    ) => {
      const road = roads.find((r) => r.id === roadId);
      if (!road) return;
      if (!road.planView[geometryIndex]) return;

      const patch: OdrGeometryUpdate = { length: updates.length };
      if (updates.hdg !== undefined) patch.hdg = updates.hdg;
      if (updates.curvature !== undefined) patch.curvature = updates.curvature;
      if (updates.type !== undefined) patch.type = updates.type;
      const patched = patchPlanViewGeometry(road.planView, geometryIndex, patch);

      // Recalculate s values after length change
      const recalculated = recalculatePlanViewS(patched);
      const totalLength = computePlanViewLength(recalculated);
      odrStoreApi
        .getState()
        .updateRoad(roadId, { planView: recalculated, length: totalLength });
      checkForIntersections(odrStoreApi.getState().document);
    },
    [roads, odrStoreApi, checkForIntersections],
  );

  const handleStartpointDragEnd = useCallback(
    (
      roadId: string,
      geometryIndex: number,
      updates: {
        x: number;
        y: number;
        hdg: number;
        length: number;
        curvature?: number;
        type?: 'line' | 'arc';
      },
    ) => {
      const road = roads.find((r) => r.id === roadId);
      if (!road) return;
      if (!road.planView[geometryIndex]) return;

      const patch: OdrGeometryUpdate = {
        x: updates.x,
        y: updates.y,
        hdg: updates.hdg,
        length: updates.length,
      };
      if (updates.curvature !== undefined) patch.curvature = updates.curvature;
      if (updates.type !== undefined) patch.type = updates.type;
      const patched = patchPlanViewGeometry(road.planView, geometryIndex, patch);

      // Recalculate s values after length change
      const recalculated = recalculatePlanViewS(patched);
      const totalLength = computePlanViewLength(recalculated);
      odrStoreApi
        .getState()
        .updateRoad(roadId, { planView: recalculated, length: totalLength });
      checkForIntersections(odrStoreApi.getState().document);
    },
    [roads, odrStoreApi, checkForIntersections],
  );

  return useMemo(
    () => ({
      selectedGeometryIndex,
      selectedGeometryIndices,
      handleGeometrySelect,
      handleGeometryShiftClick,
      handleDeleteSelectedGeometry,
      handleGeometryDragEnd,
      handleHeadingDragEnd,
      handleCurvatureDragEnd,
      handleEndpointDragEnd,
      handleStartpointDragEnd,
    }),
    [
      selectedGeometryIndex,
      selectedGeometryIndices,
      handleGeometrySelect,
      handleGeometryShiftClick,
      handleDeleteSelectedGeometry,
      handleGeometryDragEnd,
      handleHeadingDragEnd,
      handleCurvatureDragEnd,
      handleEndpointDragEnd,
      handleStartpointDragEnd,
    ],
  );
}
