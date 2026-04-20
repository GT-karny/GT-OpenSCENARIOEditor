import { useCallback, useEffect } from 'react';
import type { Trajectory, OpenDriveDocument } from '@osce/shared';
import { useTrajectoryEditStore } from '../stores/trajectory-edit-store';
import type { TrajectoryEditSource, PointWorldPos } from '../stores/trajectory-edit-store';
import { resolvePositionToWorld } from '@osce/3d-viewer';
import type { WorldCoords } from '@osce/3d-viewer';
import { computeTrajectoryVisualPoints } from '../lib/trajectory-curve-computation';

/**
 * Hook that bridges the trajectory-edit-store with the scenario/catalog stores
 * and computes visualization data (world positions, curve points).
 */
export function useTrajectoryEdit(
  odrDoc: OpenDriveDocument | null,
  entityPositions?: Map<string, WorldCoords>,
) {
  const store = useTrajectoryEditStore();

  // ---------------------------------------------------------------------------
  // Resolve point positions to world coordinates whenever trajectory changes.
  // Then compute curve sample points for rendering.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!store.active || !store.editingTrajectory || !odrDoc) return;

    const trajectory = store.editingTrajectory;
    const positions: PointWorldPos[] = [];
    const resolveOpts = entityPositions ? { entityPositions } : undefined;

    // Collect positions based on shape type
    switch (trajectory.shape.type) {
      case 'polyline':
        for (const vertex of trajectory.shape.vertices) {
          const world = resolvePositionToWorld(vertex.position, odrDoc, resolveOpts);
          positions.push(world ?? { x: 0, y: 0, z: 0, h: 0 });
        }
        break;
      case 'clothoid':
        if (trajectory.shape.position) {
          const world = resolvePositionToWorld(trajectory.shape.position, odrDoc, resolveOpts);
          positions.push(world ?? { x: 0, y: 0, z: 0, h: 0 });
        }
        break;
      case 'nurbs':
        for (const cp of trajectory.shape.controlPoints) {
          const world = resolvePositionToWorld(cp.position, odrDoc, resolveOpts);
          positions.push(world ?? { x: 0, y: 0, z: 0, h: 0 });
        }
        break;
    }

    store.setPointWorldPositions(positions);

    // Compute curve visualization points
    const curvePoints = computeTrajectoryVisualPoints(trajectory, positions);
    store.setCurvePoints(curvePoints);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.editingTrajectory, odrDoc, store.active, entityPositions]);

  // ---------------------------------------------------------------------------
  // Start trajectory editing
  // ---------------------------------------------------------------------------
  const startTrajectoryEdit = useCallback(
    (source: TrajectoryEditSource, trajectory: Trajectory) => {
      store.enterTrajectoryEditMode(source, trajectory);
    },
    [store],
  );

  // ---------------------------------------------------------------------------
  // Save trajectory back to source
  // ---------------------------------------------------------------------------
  const saveTrajectory = useCallback(
    (
      updateAction?: (actionId: string, trajectory: Trajectory) => void,
      updateCatalogEntry?: (catalogName: string, index: number, trajectory: Trajectory) => void,
    ): Trajectory | null => {
      const trajectory = store.commitTrajectory();
      if (!trajectory || !store.source) return null;

      if (store.source.type === 'action' && store.source.actionId && updateAction) {
        updateAction(store.source.actionId, trajectory);
      } else if (
        store.source.type === 'catalog' &&
        store.source.catalogName != null &&
        store.source.entryIndex != null &&
        updateCatalogEntry
      ) {
        updateCatalogEntry(store.source.catalogName, store.source.entryIndex, trajectory);
      }

      store.exitTrajectoryEditMode();
      return trajectory;
    },
    [store],
  );

  // ---------------------------------------------------------------------------
  // Cancel trajectory editing
  // ---------------------------------------------------------------------------
  const cancelTrajectory = useCallback(() => {
    store.exitTrajectoryEditMode();
  }, [store]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts (Ctrl+Z / Ctrl+Y for undo/redo, Delete, Escape)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!store.active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.undoTrajectoryEdit();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        store.redoTrajectoryEdit();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedPointIndex !== null) {
          e.preventDefault();
          const shape = store.editingTrajectory?.shape;
          if (shape?.type === 'polyline') {
            store.removeVertex(store.selectedPointIndex);
          } else if (shape?.type === 'nurbs') {
            store.removeControlPoint(store.selectedPointIndex);
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        store.exitTrajectoryEditMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store.active, store]);

  return {
    // State
    active: store.active,
    source: store.source,
    editingTrajectory: store.editingTrajectory,
    originalTrajectory: store.originalTrajectory,
    selectedPointIndex: store.selectedPointIndex,
    pointWorldPositions: store.pointWorldPositions,
    curvePoints: store.curvePoints,
    warnings: store.warnings,
    hasChanges:
      store.editingTrajectory !== null &&
      store.originalTrajectory !== null &&
      JSON.stringify(store.editingTrajectory) !== JSON.stringify(store.originalTrajectory),

    // Actions
    startTrajectoryEdit,
    saveTrajectory,
    cancelTrajectory,
    addVertex: store.addVertex,
    insertVertex: store.insertVertex,
    removeVertex: store.removeVertex,
    updateVertexPosition: store.updateVertexPosition,
    updateVertexTime: store.updateVertexTime,
    updateClothoidParams: store.updateClothoidParams,
    updateClothoidPosition: store.updateClothoidPosition,
    addControlPoint: store.addControlPoint,
    insertControlPoint: store.insertControlPoint,
    removeControlPoint: store.removeControlPoint,
    updateControlPointPosition: store.updateControlPointPosition,
    updateControlPointWeight: store.updateControlPointWeight,
    updateControlPointTime: store.updateControlPointTime,
    updateKnots: store.updateKnots,
    updateOrder: store.updateOrder,
    updateTrajectoryName: store.updateTrajectoryName,
    updateTrajectoryClosed: store.updateTrajectoryClosed,
    selectPoint: store.selectPoint,
    canUndo: store.canUndo,
    canRedo: store.canRedo,
    undoTrajectoryEdit: store.undoTrajectoryEdit,
    redoTrajectoryEdit: store.redoTrajectoryEdit,
  };
}
