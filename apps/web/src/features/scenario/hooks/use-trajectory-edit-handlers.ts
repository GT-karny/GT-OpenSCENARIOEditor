import { useCallback, useMemo, useState } from 'react';
import type { CatalogEntry } from '@osce/shared';
import type { TrajectoryEditConfig, WorldCoords } from '@osce/3d-viewer';
import type { useScenarioStoreApi } from '../../../stores/use-scenario-store';
import type { useTrajectoryEdit } from './use-trajectory-edit';

interface TrajectoryContextMenuPosition {
  x: number;
  y: number;
  pointIndex: number;
}

interface UseTrajectoryEditHandlersParams {
  trajectoryEdit: ReturnType<typeof useTrajectoryEdit>;
  entityPositions: Map<string, WorldCoords>;
  scenarioStoreApi: ReturnType<typeof useScenarioStoreApi>;
  updateCatalogEntry: (catalogName: string, entryIndex: number, entry: CatalogEntry) => void;
  trajectoryPreviewData: TrajectoryEditConfig['previewData'];
  laneChangePreviewData: TrajectoryEditConfig['laneChangePreviewData'];
}

interface UseTrajectoryEditHandlersResult {
  config: TrajectoryEditConfig;
  trajectoryContextMenu: TrajectoryContextMenuPosition | null;
  setTrajectoryContextMenu: (menu: TrajectoryContextMenuPosition | null) => void;
}

/**
 * Wraps the trajectory-edit store methods in 3D-viewer callback handlers and builds
 * the referentially stable TrajectoryEditConfig consumed by the viewer. Also owns the
 * trajectory point context-menu state, which is scoped to trajectory editing.
 */
export function useTrajectoryEditHandlers({
  trajectoryEdit,
  entityPositions,
  scenarioStoreApi,
  updateCatalogEntry,
  trajectoryPreviewData,
  laneChangePreviewData,
}: UseTrajectoryEditHandlersParams): UseTrajectoryEditHandlersResult {
  const handleTrajectoryPointAdd = useCallback(
    (
      worldX: number,
      worldY: number,
      worldZ: number,
      heading: number,
      roadId: string,
      laneId: string,
      s: number,
      _offset: number,
      snapped: boolean,
    ) => {
      const shape = trajectoryEdit.editingTrajectory?.shape;
      const pos = snapped
        ? {
            type: 'lanePosition' as const,
            roadId,
            laneId,
            s: Math.round(s * 100) / 100,
            orientation: heading ? { type: 'absolute' as const, h: heading } : undefined,
          }
        : {
            type: 'worldPosition' as const,
            x: Math.round(worldX * 100) / 100,
            y: Math.round(worldY * 100) / 100,
            z: Math.round(worldZ * 100) / 100,
            h: heading || undefined,
          };
      if (shape?.type === 'polyline') {
        trajectoryEdit.addVertex(pos);
      } else if (shape?.type === 'nurbs') {
        trajectoryEdit.addControlPoint(pos);
      }
    },
    [trajectoryEdit],
  );

  const handleTrajectoryPointClick = useCallback(
    (index: number) => {
      trajectoryEdit.selectPoint(index);
    },
    [trajectoryEdit],
  );

  const [trajectoryContextMenu, setTrajectoryContextMenu] =
    useState<TrajectoryContextMenuPosition | null>(null);

  const handleTrajectoryPointContextMenu = useCallback((index: number, event: unknown) => {
    const nativeEvent = (event as { nativeEvent?: MouseEvent })?.nativeEvent;
    if (!nativeEvent) return;
    nativeEvent.preventDefault();
    setTrajectoryContextMenu({
      x: nativeEvent.clientX,
      y: nativeEvent.clientY,
      pointIndex: index,
    });
  }, []);

  const handleTrajectoryPointDragEnd = useCallback(
    (
      index: number,
      worldX: number,
      worldY: number,
      worldZ: number,
      heading: number,
      roadId: string,
      laneId: string,
      s: number,
      _offset: number,
      snapped: boolean,
    ) => {
      const shape = trajectoryEdit.editingTrajectory?.shape;

      // "Start from entity" point: update dx/dy relative to entity instead of replacing position type
      if (shape) {
        const curPos =
          shape.type === 'polyline'
            ? shape.vertices[index]?.position
            : shape.type === 'nurbs'
              ? shape.controlPoints[index]?.position
              : null;
        if (curPos && curPos.type === 'relativeObjectPosition') {
          const ref = entityPositions.get(curPos.entityRef);
          if (ref) {
            // Compute dx/dy in entity-local coordinates (inverse rotation by entity heading)
            const cos = Math.cos(-ref.h);
            const sin = Math.sin(-ref.h);
            const deltaX = worldX - ref.x;
            const deltaY = worldY - ref.y;
            const newPos = {
              ...curPos,
              dx: Math.round((deltaX * cos - deltaY * sin) * 100) / 100,
              dy: Math.round((deltaX * sin + deltaY * cos) * 100) / 100,
              dz: Math.round((worldZ - ref.z) * 100) / 100 || undefined,
            };
            if (shape.type === 'polyline') {
              trajectoryEdit.updateVertexPosition(index, newPos);
            } else if (shape.type === 'nurbs') {
              trajectoryEdit.updateControlPointPosition(index, newPos);
            }
            return;
          }
        }
      }

      const pos = snapped
        ? {
            type: 'lanePosition' as const,
            roadId,
            laneId,
            s: Math.round(s * 100) / 100,
            orientation: heading ? { type: 'absolute' as const, h: heading } : undefined,
          }
        : {
            type: 'worldPosition' as const,
            x: Math.round(worldX * 100) / 100,
            y: Math.round(worldY * 100) / 100,
            z: Math.round(worldZ * 100) / 100,
            h: heading || undefined,
          };
      if (shape?.type === 'polyline') {
        trajectoryEdit.updateVertexPosition(index, pos);
      } else if (shape?.type === 'nurbs') {
        trajectoryEdit.updateControlPointPosition(index, pos);
      } else if (shape?.type === 'clothoid') {
        trajectoryEdit.updateClothoidPosition(pos);
      }
    },
    [trajectoryEdit],
  );

  const handleTrajectoryEditSave = useCallback(() => {
    trajectoryEdit.saveTrajectory(
      (actionId, trajectory) => {
        // Read the existing action from the store to preserve timeReference, followingMode, etc.
        const doc = scenarioStoreApi.getState().document;
        if (!doc) return;
        // Search storyboard actions
        for (const story of doc.storyboard.stories) {
          for (const act of story.acts) {
            for (const group of act.maneuverGroups) {
              for (const maneuver of group.maneuvers) {
                for (const event of maneuver.events) {
                  const existing = event.actions.find((a) => a.id === actionId);
                  if (existing && existing.action?.type === 'followTrajectoryAction') {
                    scenarioStoreApi.getState().updateAction(actionId, {
                      action: { ...existing.action, trajectory },
                    });
                    return;
                  }
                }
              }
            }
          }
        }
      },
      (catalogName, entryIndex, trajectory) => {
        updateCatalogEntry(catalogName, entryIndex, {
          catalogType: 'trajectory',
          definition: trajectory,
        });
      },
    );
  }, [trajectoryEdit, scenarioStoreApi, updateCatalogEntry]);

  const handleTrajectoryEditCancel = useCallback(() => {
    trajectoryEdit.cancelTrajectory();
  }, [trajectoryEdit]);

  // Compute time values for trajectory point markers
  const trajectoryPointTimes = useMemo(() => {
    const t = trajectoryEdit.editingTrajectory;
    if (!t) return undefined;
    if (t.shape.type === 'polyline') {
      return t.shape.vertices.map((v) => v.time);
    }
    if (t.shape.type === 'nurbs') {
      return t.shape.controlPoints.map((cp) => cp.time);
    }
    return undefined;
  }, [trajectoryEdit.editingTrajectory]);

  // Compute indices of relative-positioned points (for dashed line rendering)
  const trajectoryRelativePointIndices = useMemo(() => {
    const t = trajectoryEdit.editingTrajectory;
    if (!t) return undefined;

    const isRelative = (posType: string) =>
      posType === 'relativeObjectPosition' ||
      posType === 'relativeWorldPosition' ||
      posType === 'relativeLanePosition' ||
      posType === 'relativeRoadPosition';

    const indices: number[] = [];
    if (t.shape.type === 'polyline') {
      for (let i = 0; i < t.shape.vertices.length; i++) {
        if (isRelative(t.shape.vertices[i].position.type)) indices.push(i);
      }
    } else if (t.shape.type === 'nurbs') {
      for (let i = 0; i < t.shape.controlPoints.length; i++) {
        if (isRelative(t.shape.controlPoints[i].position.type)) indices.push(i);
      }
    }
    return indices.length > 0 ? indices : undefined;
  }, [trajectoryEdit.editingTrajectory]);

  // Compute point count for trajectory
  const trajectoryPointCount = useMemo(() => {
    const t = trajectoryEdit.editingTrajectory;
    if (!t) return 0;
    if (t.shape.type === 'polyline') return t.shape.vertices.length;
    if (t.shape.type === 'clothoid') return t.shape.position ? 1 : 0;
    if (t.shape.type === 'nurbs') return t.shape.controlPoints.length;
    return 0;
  }, [trajectoryEdit.editingTrajectory]);

  // Grouped viewer config object.
  // Referentially stable via useMemo so the memo()'d SimulationViewerBridge and the
  // 30fps-rerendering ScenarioViewer do not re-render from new object identities each frame.
  const config = useMemo<TrajectoryEditConfig>(
    () => ({
      active: trajectoryEdit.active,
      shapeType: trajectoryEdit.editingTrajectory?.shape.type,
      points: trajectoryEdit.pointWorldPositions,
      curvePoints: trajectoryEdit.curvePoints,
      pointTimes: trajectoryPointTimes,
      selectedPointIndex: trajectoryEdit.selectedPointIndex,
      onPointClick: handleTrajectoryPointClick,
      onPointContextMenu: handleTrajectoryPointContextMenu,
      onPointAdd: handleTrajectoryPointAdd,
      onPointDragEnd: handleTrajectoryPointDragEnd,
      onEditSave: handleTrajectoryEditSave,
      onEditCancel: handleTrajectoryEditCancel,
      relativePointIndices: trajectoryRelativePointIndices,
      warnings: trajectoryEdit.warnings,
      pointCount: trajectoryPointCount,
      previewData: trajectoryPreviewData,
      laneChangePreviewData,
    }),
    [
      trajectoryEdit.active,
      trajectoryEdit.editingTrajectory?.shape.type,
      trajectoryEdit.pointWorldPositions,
      trajectoryEdit.curvePoints,
      trajectoryPointTimes,
      trajectoryEdit.selectedPointIndex,
      handleTrajectoryPointClick,
      handleTrajectoryPointContextMenu,
      handleTrajectoryPointAdd,
      handleTrajectoryPointDragEnd,
      handleTrajectoryEditSave,
      handleTrajectoryEditCancel,
      trajectoryRelativePointIndices,
      trajectoryEdit.warnings,
      trajectoryPointCount,
      trajectoryPreviewData,
      laneChangePreviewData,
    ],
  );

  return { config, trajectoryContextMenu, setTrajectoryContextMenu };
}
