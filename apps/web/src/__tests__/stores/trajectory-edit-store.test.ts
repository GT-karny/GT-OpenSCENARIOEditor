import { describe, it, expect, beforeEach } from 'vitest';
import type { Trajectory, Position } from '@osce/shared';
import { useTrajectoryEditStore } from '../../stores/trajectory-edit-store';

function worldPos(x: number, y: number): Position {
  return { type: 'worldPosition', x, y };
}

function polyline(): Trajectory {
  return {
    name: 'Traj Polyline',
    closed: false,
    shape: {
      type: 'polyline',
      vertices: [{ position: worldPos(0, 0) }, { position: worldPos(10, 0) }],
    },
  };
}

function nurbs(order = 3): Trajectory {
  return {
    name: 'Traj NURBS',
    closed: false,
    shape: { type: 'nurbs', order, controlPoints: [], knots: [] },
  };
}

const store = useTrajectoryEditStore;

beforeEach(() => {
  store.getState().exitTrajectoryEditMode();
});

describe('trajectory-edit-store polyline CRUD', () => {
  it('addVertex appends and selects', () => {
    store.getState().enterTrajectoryEditMode({ type: 'action' }, polyline());
    store.getState().addVertex(worldPos(20, 0));
    const shape = store.getState().editingTrajectory?.shape;
    expect(shape?.type).toBe('polyline');
    if (shape?.type === 'polyline') expect(shape.vertices.length).toBe(3);
    expect(store.getState().selectedPointIndex).toBe(2);
  });

  it('addVertex is a no-op on non-polyline shapes', () => {
    store.getState().enterTrajectoryEditMode({ type: 'action' }, nurbs());
    const before = store.getState().history.past.length;
    store.getState().addVertex(worldPos(1, 1));
    expect(store.getState().history.past.length).toBe(before);
  });

  it('removeVertex adjusts selection', () => {
    store.getState().enterTrajectoryEditMode({ type: 'action' }, polyline());
    store.getState().selectPoint(1);
    store.getState().removeVertex(0);
    const shape = store.getState().editingTrajectory?.shape;
    if (shape?.type === 'polyline') expect(shape.vertices.length).toBe(1);
    expect(store.getState().selectedPointIndex).toBe(0);
  });

  it('warns when polyline has fewer than 2 vertices', () => {
    store.getState().enterTrajectoryEditMode({ type: 'action' }, polyline());
    store.getState().removeVertex(0);
    expect(store.getState().warnings).toContain('Polyline requires at least 2 vertices');
  });
});

describe('trajectory-edit-store NURBS knot auto-generation', () => {
  it('addControlPoint auto-generates the clamped knot vector once >= 2 points', () => {
    store.getState().enterTrajectoryEditMode({ type: 'action' }, nurbs(3));

    // First control point: not enough to generate knots yet.
    store.getState().addControlPoint(worldPos(0, 0));
    let shape = store.getState().editingTrajectory?.shape;
    if (shape?.type === 'nurbs') expect(shape.knots.length).toBe(0);

    // Second control point: clamped-uniform knots are generated (>= 2 points).
    // For 2 control points with order 3 the vector is [0,0,0,1,1,1] (length 6).
    store.getState().addControlPoint(worldPos(10, 0));
    shape = store.getState().editingTrajectory?.shape;
    if (shape?.type === 'nurbs') {
      expect(shape.controlPoints.length).toBe(2);
      expect(shape.knots).toEqual([0, 0, 0, 1, 1, 1]);
    }

    // Third control point: knots regenerate for the new point count.
    store.getState().addControlPoint(worldPos(20, 0));
    shape = store.getState().editingTrajectory?.shape;
    if (shape?.type === 'nurbs') {
      expect(shape.controlPoints.length).toBe(3);
      expect(shape.knots.length).toBeGreaterThan(0);
    }
  });

  it('insertControlPoint regenerates knots', () => {
    store.getState().enterTrajectoryEditMode({ type: 'action' }, nurbs(3));
    store.getState().addControlPoint(worldPos(0, 0));
    store.getState().addControlPoint(worldPos(10, 0));
    store.getState().insertControlPoint(0, worldPos(5, 0));
    const shape = store.getState().editingTrajectory?.shape;
    if (shape?.type === 'nurbs') {
      expect(shape.controlPoints.length).toBe(3);
      expect(shape.knots.length).toBe(3 + 3);
    }
    expect(store.getState().selectedPointIndex).toBe(1);
  });

  it('removeControlPoint regenerates knots and clears them below 2 points', () => {
    store.getState().enterTrajectoryEditMode({ type: 'action' }, nurbs(3));
    store.getState().addControlPoint(worldPos(0, 0));
    store.getState().addControlPoint(worldPos(10, 0));
    store.getState().removeControlPoint(0);
    const shape = store.getState().editingTrajectory?.shape;
    if (shape?.type === 'nurbs') {
      expect(shape.controlPoints.length).toBe(1);
      expect(shape.knots).toEqual([]);
    }
  });
});

describe('trajectory-edit-store shared infra', () => {
  it('undo/redo restore trajectory edits', () => {
    store.getState().enterTrajectoryEditMode({ type: 'action' }, polyline());
    store.getState().addVertex(worldPos(20, 0));
    store.getState().undoTrajectoryEdit();
    let shape = store.getState().editingTrajectory?.shape;
    if (shape?.type === 'polyline') expect(shape.vertices.length).toBe(2);
    store.getState().redoTrajectoryEdit();
    shape = store.getState().editingTrajectory?.shape;
    if (shape?.type === 'polyline') expect(shape.vertices.length).toBe(3);
  });

  it('commitTrajectory returns a deep clone', () => {
    store.getState().enterTrajectoryEditMode({ type: 'action' }, polyline());
    const committed = store.getState().commitTrajectory();
    expect(committed?.name).toBe('Traj Polyline');
    if (committed?.shape.type === 'polyline') committed.shape.vertices.push({ position: worldPos(1, 1) });
    const shape = store.getState().editingTrajectory?.shape;
    if (shape?.type === 'polyline') expect(shape.vertices.length).toBe(2);
  });

  it('updateClothoidParams only applies to clothoid shapes', () => {
    store.getState().enterTrajectoryEditMode({ type: 'action' }, polyline());
    const before = store.getState().history.past.length;
    store.getState().updateClothoidParams({ length: 5 });
    expect(store.getState().history.past.length).toBe(before);
  });
});
