import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Trajectory, OpenDriveDocument } from '@osce/shared';
import { useTrajectoryEditStore } from '../../../stores/trajectory-edit-store';
import type { TrajectoryEditSource } from '../../../stores/trajectory-edit-store';
import type { WorldCoords } from '@osce/3d-viewer';
import { resolveTrajectoryVisual } from '../../../lib/edit-preview-computation';
import { useDraftEditKeyboard } from './use-draft-edit-keyboard';

/**
 * Hook that bridges the trajectory-edit-store with the scenario/catalog stores
 * and computes visualization data (world positions, curve points).
 */
export function useTrajectoryEdit(
  odrDoc: OpenDriveDocument | null,
  entityPositions?: Map<string, WorldCoords>,
) {
  // Subscribe only to the primitive state slices this hook reads. Zustand action
  // identities are stable, so selecting them individually avoids re-rendering the
  // consumer (EditorLayout) on every unrelated store change (e.g. during drags).
  const active = useTrajectoryEditStore((s) => s.active);
  const source = useTrajectoryEditStore((s) => s.source);
  const editingTrajectory = useTrajectoryEditStore((s) => s.editingTrajectory);
  const originalTrajectory = useTrajectoryEditStore((s) => s.originalTrajectory);
  const selectedPointIndex = useTrajectoryEditStore((s) => s.selectedPointIndex);
  const pointWorldPositions = useTrajectoryEditStore(useShallow((s) => s.pointWorldPositions));
  const curvePoints = useTrajectoryEditStore(useShallow((s) => s.curvePoints));
  const warnings = useTrajectoryEditStore(useShallow((s) => s.warnings));

  const enterTrajectoryEditMode = useTrajectoryEditStore((s) => s.enterTrajectoryEditMode);
  const exitTrajectoryEditMode = useTrajectoryEditStore((s) => s.exitTrajectoryEditMode);
  const addVertex = useTrajectoryEditStore((s) => s.addVertex);
  const insertVertex = useTrajectoryEditStore((s) => s.insertVertex);
  const removeVertex = useTrajectoryEditStore((s) => s.removeVertex);
  const updateVertexPosition = useTrajectoryEditStore((s) => s.updateVertexPosition);
  const updateVertexTime = useTrajectoryEditStore((s) => s.updateVertexTime);
  const updateClothoidParams = useTrajectoryEditStore((s) => s.updateClothoidParams);
  const updateClothoidPosition = useTrajectoryEditStore((s) => s.updateClothoidPosition);
  const addControlPoint = useTrajectoryEditStore((s) => s.addControlPoint);
  const insertControlPoint = useTrajectoryEditStore((s) => s.insertControlPoint);
  const removeControlPoint = useTrajectoryEditStore((s) => s.removeControlPoint);
  const updateControlPointPosition = useTrajectoryEditStore((s) => s.updateControlPointPosition);
  const updateControlPointWeight = useTrajectoryEditStore((s) => s.updateControlPointWeight);
  const updateControlPointTime = useTrajectoryEditStore((s) => s.updateControlPointTime);
  const updateKnots = useTrajectoryEditStore((s) => s.updateKnots);
  const updateOrder = useTrajectoryEditStore((s) => s.updateOrder);
  const updateTrajectoryName = useTrajectoryEditStore((s) => s.updateTrajectoryName);
  const updateTrajectoryClosed = useTrajectoryEditStore((s) => s.updateTrajectoryClosed);
  const selectPoint = useTrajectoryEditStore((s) => s.selectPoint);
  const setPointWorldPositions = useTrajectoryEditStore((s) => s.setPointWorldPositions);
  const setCurvePoints = useTrajectoryEditStore((s) => s.setCurvePoints);
  const commitTrajectory = useTrajectoryEditStore((s) => s.commitTrajectory);
  const canUndo = useTrajectoryEditStore((s) => s.canUndo);
  const canRedo = useTrajectoryEditStore((s) => s.canRedo);
  const undoTrajectoryEdit = useTrajectoryEditStore((s) => s.undoTrajectoryEdit);
  const redoTrajectoryEdit = useTrajectoryEditStore((s) => s.redoTrajectoryEdit);

  // ---------------------------------------------------------------------------
  // Resolve point positions to world coordinates whenever trajectory changes.
  // Then compute curve sample points for rendering.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!active || !editingTrajectory || !odrDoc) return;

    const { points, curvePoints: curve } = resolveTrajectoryVisual(
      editingTrajectory,
      odrDoc,
      entityPositions,
    );
    setPointWorldPositions(points);
    setCurvePoints(curve);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTrajectory, odrDoc, active, entityPositions]);

  // ---------------------------------------------------------------------------
  // Start trajectory editing
  // ---------------------------------------------------------------------------
  const startTrajectoryEdit = useCallback(
    (src: TrajectoryEditSource, trajectory: Trajectory) => {
      enterTrajectoryEditMode(src, trajectory);
    },
    [enterTrajectoryEditMode],
  );

  // ---------------------------------------------------------------------------
  // Save trajectory back to source
  // ---------------------------------------------------------------------------
  const saveTrajectory = useCallback(
    (
      updateAction?: (actionId: string, trajectory: Trajectory) => void,
      updateCatalogEntry?: (catalogName: string, index: number, trajectory: Trajectory) => void,
    ): Trajectory | null => {
      const trajectory = commitTrajectory();
      if (!trajectory || !source) return null;

      if (source.type === 'action' && source.actionId && updateAction) {
        updateAction(source.actionId, trajectory);
      } else if (
        source.type === 'catalog' &&
        source.catalogName != null &&
        source.entryIndex != null &&
        updateCatalogEntry
      ) {
        updateCatalogEntry(source.catalogName, source.entryIndex, trajectory);
      }

      exitTrajectoryEditMode();
      return trajectory;
    },
    [commitTrajectory, source, exitTrajectoryEditMode],
  );

  // ---------------------------------------------------------------------------
  // Cancel trajectory editing
  // ---------------------------------------------------------------------------
  const cancelTrajectory = useCallback(() => {
    exitTrajectoryEditMode();
  }, [exitTrajectoryEditMode]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts (Ctrl+Z / Ctrl+Y for undo/redo, Delete, Escape)
  // ---------------------------------------------------------------------------
  const onDeleteSelected = useCallback(() => {
    if (selectedPointIndex === null) return false;
    const shape = editingTrajectory?.shape;
    if (shape?.type === 'polyline') {
      removeVertex(selectedPointIndex);
      return true;
    }
    if (shape?.type === 'nurbs') {
      removeControlPoint(selectedPointIndex);
      return true;
    }
    return false;
  }, [selectedPointIndex, editingTrajectory, removeVertex, removeControlPoint]);

  useDraftEditKeyboard({
    active,
    onUndo: undoTrajectoryEdit,
    onRedo: redoTrajectoryEdit,
    onDeleteSelected,
    onEscape: exitTrajectoryEditMode,
  });

  return {
    // State
    active,
    source,
    editingTrajectory,
    originalTrajectory,
    selectedPointIndex,
    pointWorldPositions,
    curvePoints,
    warnings,
    hasChanges:
      editingTrajectory !== null &&
      originalTrajectory !== null &&
      JSON.stringify(editingTrajectory) !== JSON.stringify(originalTrajectory),

    // Actions
    startTrajectoryEdit,
    saveTrajectory,
    cancelTrajectory,
    addVertex,
    insertVertex,
    removeVertex,
    updateVertexPosition,
    updateVertexTime,
    updateClothoidParams,
    updateClothoidPosition,
    addControlPoint,
    insertControlPoint,
    removeControlPoint,
    updateControlPointPosition,
    updateControlPointWeight,
    updateControlPointTime,
    updateKnots,
    updateOrder,
    updateTrajectoryName,
    updateTrajectoryClosed,
    selectPoint,
    canUndo,
    canRedo,
    undoTrajectoryEdit,
    redoTrajectoryEdit,
  };
}
