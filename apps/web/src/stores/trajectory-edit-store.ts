import { create } from 'zustand';
import type {
  Trajectory,
  TrajectoryShape,
  TrajectoryVertex,
  NurbsControlPoint,
  Position,
} from '@osce/shared';
import { generateClampedUniformKnots } from '../lib/nurbs-knot-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrajectoryEditSource {
  type: 'action' | 'catalog';
  /** For action source: scenario action id */
  actionId?: string;
  /** For catalog source: catalog document name */
  catalogName?: string;
  /** For catalog source: entry index within catalog */
  entryIndex?: number;
}

export interface PointWorldPos {
  x: number;
  y: number;
  z: number;
  h: number;
}

export interface TrajectoryEditState {
  // --- Mode ---
  active: boolean;
  source: TrajectoryEditSource | null;

  // --- Working copy ---
  editingTrajectory: Trajectory | null;
  /** Original trajectory snapshot at edit start (for cancel) */
  originalTrajectory: Trajectory | null;

  // --- Selection ---
  selectedPointIndex: number | null;

  // --- Computed visualization data (set externally by hooks) ---
  pointWorldPositions: PointWorldPos[];
  /** Evaluated curve sample points for 3D rendering */
  curvePoints: Array<{ x: number; y: number; z: number }>;

  // --- Validation ---
  warnings: string[];

  // --- Internal undo/redo history ---
  history: {
    past: Trajectory[];
    future: Trajectory[];
  };
}

export interface TrajectoryEditActions {
  // --- Mode control ---
  enterTrajectoryEditMode: (source: TrajectoryEditSource, trajectory: Trajectory) => void;
  exitTrajectoryEditMode: () => void;

  // --- Polyline CRUD ---
  addVertex: (position: Position) => void;
  insertVertex: (afterIndex: number, position: Position) => void;
  removeVertex: (index: number) => void;
  updateVertexPosition: (index: number, position: Position) => void;
  updateVertexTime: (index: number, time: number | undefined) => void;

  // --- Clothoid ---
  updateClothoidParams: (params: Partial<Extract<TrajectoryShape, { type: 'clothoid' }>>) => void;
  updateClothoidPosition: (position: Position) => void;

  // --- NURBS ---
  addControlPoint: (position: Position) => void;
  insertControlPoint: (afterIndex: number, position: Position) => void;
  removeControlPoint: (index: number) => void;
  updateControlPointPosition: (index: number, position: Position) => void;
  updateControlPointWeight: (index: number, weight: number | undefined) => void;
  updateControlPointTime: (index: number, time: number | undefined) => void;
  updateKnots: (knots: number[]) => void;
  updateOrder: (order: number) => void;

  // --- Trajectory properties ---
  updateTrajectoryName: (name: string) => void;
  updateTrajectoryClosed: (closed: boolean) => void;

  // --- Selection ---
  selectPoint: (index: number | null) => void;

  // --- Visualization data (set externally by hooks) ---
  setPointWorldPositions: (positions: PointWorldPos[]) => void;
  setCurvePoints: (points: Array<{ x: number; y: number; z: number }>) => void;

  // --- Undo/Redo ---
  undoTrajectoryEdit: () => void;
  redoTrajectoryEdit: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // --- Commit ---
  commitTrajectory: () => Trajectory | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_HISTORY = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cloneTrajectory(t: Trajectory): Trajectory {
  return JSON.parse(JSON.stringify(t));
}

function validateTrajectory(t: Trajectory): string[] {
  const warnings: string[] = [];
  const shape = t.shape;
  switch (shape.type) {
    case 'polyline':
      if (shape.vertices.length < 2) {
        warnings.push('Polyline requires at least 2 vertices');
      }
      break;
    case 'clothoid':
      if (shape.length <= 0) {
        warnings.push('Clothoid length must be > 0');
      }
      break;
    case 'nurbs': {
      if (shape.controlPoints.length < 2) {
        warnings.push('NURBS requires at least 2 control points');
      }
      const expectedKnots = shape.controlPoints.length + shape.order;
      if (shape.knots.length !== expectedKnots && shape.controlPoints.length > 0) {
        warnings.push(
          `Knot vector length should be ${expectedKnots} (controlPoints + order), got ${shape.knots.length}`,
        );
      }
      break;
    }
  }
  return warnings;
}

function pushHistory(past: Trajectory[], trajectory: Trajectory): Trajectory[] {
  const newPast = [...past, cloneTrajectory(trajectory)];
  if (newPast.length > MAX_HISTORY) {
    newPast.shift();
  }
  return newPast;
}

// Helper to get the count of editable points for the current shape
function getPointCount(t: Trajectory): number {
  switch (t.shape.type) {
    case 'polyline':
      return t.shape.vertices.length;
    case 'clothoid':
      return t.shape.position ? 1 : 0;
    case 'nurbs':
      return t.shape.controlPoints.length;
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const initialState: TrajectoryEditState = {
  active: false,
  source: null,
  editingTrajectory: null,
  originalTrajectory: null,
  selectedPointIndex: null,
  pointWorldPositions: [],
  curvePoints: [],
  warnings: [],
  history: { past: [], future: [] },
};

export const useTrajectoryEditStore = create<TrajectoryEditState & TrajectoryEditActions>(
  (set, get) => ({
    ...initialState,

    // -----------------------------------------------------------------------
    // Mode control
    // -----------------------------------------------------------------------

    enterTrajectoryEditMode: (source, trajectory) => {
      const copy = cloneTrajectory(trajectory);
      set({
        active: true,
        source,
        editingTrajectory: copy,
        originalTrajectory: cloneTrajectory(trajectory),
        selectedPointIndex: null,
        pointWorldPositions: [],
        curvePoints: [],
        warnings: validateTrajectory(copy),
        history: { past: [], future: [] },
      });
    },

    exitTrajectoryEditMode: () => {
      set(initialState);
    },

    // -----------------------------------------------------------------------
    // Polyline CRUD
    // -----------------------------------------------------------------------

    addVertex: (position) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'polyline')
          return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const shape = state.editingTrajectory.shape;
        const vertex: TrajectoryVertex = { position };
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { type: 'polyline', vertices: [...shape.vertices, vertex] },
        };
        return {
          editingTrajectory: updated,
          warnings: validateTrajectory(updated),
          selectedPointIndex: shape.vertices.length,
          history: { past, future: [] },
        };
      });
    },

    insertVertex: (afterIndex, position) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'polyline')
          return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const vertices = [...state.editingTrajectory.shape.vertices];
        vertices.splice(afterIndex + 1, 0, { position });
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { type: 'polyline', vertices },
        };
        return {
          editingTrajectory: updated,
          warnings: validateTrajectory(updated),
          selectedPointIndex: afterIndex + 1,
          history: { past, future: [] },
        };
      });
    },

    removeVertex: (index) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'polyline')
          return state;
        const shape = state.editingTrajectory.shape;
        if (index < 0 || index >= shape.vertices.length) return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const vertices = shape.vertices.filter((_, i) => i !== index);
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { type: 'polyline', vertices },
        };
        let selectedPointIndex = state.selectedPointIndex;
        if (selectedPointIndex !== null) {
          if (selectedPointIndex === index) {
            selectedPointIndex =
              vertices.length > 0 ? Math.min(index, vertices.length - 1) : null;
          } else if (selectedPointIndex > index) {
            selectedPointIndex--;
          }
        }
        return {
          editingTrajectory: updated,
          warnings: validateTrajectory(updated),
          selectedPointIndex,
          history: { past, future: [] },
        };
      });
    },

    updateVertexPosition: (index, position) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'polyline')
          return state;
        const shape = state.editingTrajectory.shape;
        if (index < 0 || index >= shape.vertices.length) return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const vertices = shape.vertices.map((v, i) => (i === index ? { ...v, position } : v));
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { type: 'polyline', vertices },
        };
        return {
          editingTrajectory: updated,
          warnings: validateTrajectory(updated),
          history: { past, future: [] },
        };
      });
    },

    updateVertexTime: (index, time) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'polyline')
          return state;
        const shape = state.editingTrajectory.shape;
        if (index < 0 || index >= shape.vertices.length) return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const vertices = shape.vertices.map((v, i) => (i === index ? { ...v, time } : v));
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { type: 'polyline', vertices },
        };
        return {
          editingTrajectory: updated,
          history: { past, future: [] },
        };
      });
    },

    // -----------------------------------------------------------------------
    // Clothoid
    // -----------------------------------------------------------------------

    updateClothoidParams: (params) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'clothoid')
          return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { ...state.editingTrajectory.shape, ...params, type: 'clothoid' },
        };
        return {
          editingTrajectory: updated,
          warnings: validateTrajectory(updated),
          history: { past, future: [] },
        };
      });
    },

    updateClothoidPosition: (position) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'clothoid')
          return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { ...state.editingTrajectory.shape, position },
        };
        return {
          editingTrajectory: updated,
          warnings: validateTrajectory(updated),
          history: { past, future: [] },
        };
      });
    },

    // -----------------------------------------------------------------------
    // NURBS
    // -----------------------------------------------------------------------

    addControlPoint: (position) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'nurbs')
          return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const shape = state.editingTrajectory.shape;
        const cp: NurbsControlPoint = { position, weight: 1.0 };
        const newCps = [...shape.controlPoints, cp];
        const knots = newCps.length >= 2
          ? generateClampedUniformKnots(newCps.length, shape.order)
          : shape.knots;
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { ...shape, controlPoints: newCps, knots },
        };
        return {
          editingTrajectory: updated,
          warnings: validateTrajectory(updated),
          selectedPointIndex: shape.controlPoints.length,
          history: { past, future: [] },
        };
      });
    },

    insertControlPoint: (afterIndex, position) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'nurbs')
          return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const shape = state.editingTrajectory.shape;
        const controlPoints = [...shape.controlPoints];
        controlPoints.splice(afterIndex + 1, 0, { position, weight: 1.0 });
        const knots = controlPoints.length >= 2
          ? generateClampedUniformKnots(controlPoints.length, shape.order)
          : shape.knots;
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { ...shape, controlPoints, knots },
        };
        return {
          editingTrajectory: updated,
          warnings: validateTrajectory(updated),
          selectedPointIndex: afterIndex + 1,
          history: { past, future: [] },
        };
      });
    },

    removeControlPoint: (index) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'nurbs')
          return state;
        const shape = state.editingTrajectory.shape;
        if (index < 0 || index >= shape.controlPoints.length) return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const controlPoints = shape.controlPoints.filter((_, i) => i !== index);
        const knots = controlPoints.length >= 2
          ? generateClampedUniformKnots(controlPoints.length, shape.order)
          : [];
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { ...shape, controlPoints, knots },
        };
        let selectedPointIndex = state.selectedPointIndex;
        if (selectedPointIndex !== null) {
          if (selectedPointIndex === index) {
            selectedPointIndex =
              controlPoints.length > 0 ? Math.min(index, controlPoints.length - 1) : null;
          } else if (selectedPointIndex > index) {
            selectedPointIndex--;
          }
        }
        return {
          editingTrajectory: updated,
          warnings: validateTrajectory(updated),
          selectedPointIndex,
          history: { past, future: [] },
        };
      });
    },

    updateControlPointPosition: (index, position) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'nurbs')
          return state;
        const shape = state.editingTrajectory.shape;
        if (index < 0 || index >= shape.controlPoints.length) return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const controlPoints = shape.controlPoints.map((cp, i) =>
          i === index ? { ...cp, position } : cp,
        );
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { ...shape, controlPoints },
        };
        return {
          editingTrajectory: updated,
          warnings: validateTrajectory(updated),
          history: { past, future: [] },
        };
      });
    },

    updateControlPointWeight: (index, weight) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'nurbs')
          return state;
        const shape = state.editingTrajectory.shape;
        if (index < 0 || index >= shape.controlPoints.length) return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const controlPoints = shape.controlPoints.map((cp, i) =>
          i === index ? { ...cp, weight } : cp,
        );
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { ...shape, controlPoints },
        };
        return {
          editingTrajectory: updated,
          history: { past, future: [] },
        };
      });
    },

    updateControlPointTime: (index, time) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'nurbs')
          return state;
        const shape = state.editingTrajectory.shape;
        if (index < 0 || index >= shape.controlPoints.length) return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const controlPoints = shape.controlPoints.map((cp, i) =>
          i === index ? { ...cp, time } : cp,
        );
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { ...shape, controlPoints },
        };
        return {
          editingTrajectory: updated,
          history: { past, future: [] },
        };
      });
    },

    updateKnots: (knots) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'nurbs')
          return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { ...state.editingTrajectory.shape, knots },
        };
        return {
          editingTrajectory: updated,
          warnings: validateTrajectory(updated),
          history: { past, future: [] },
        };
      });
    },

    updateOrder: (order) => {
      set((state) => {
        if (!state.editingTrajectory || state.editingTrajectory.shape.type !== 'nurbs')
          return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const updated: Trajectory = {
          ...state.editingTrajectory,
          shape: { ...state.editingTrajectory.shape, order },
        };
        return {
          editingTrajectory: updated,
          warnings: validateTrajectory(updated),
          history: { past, future: [] },
        };
      });
    },

    // -----------------------------------------------------------------------
    // Trajectory properties
    // -----------------------------------------------------------------------

    updateTrajectoryName: (name) => {
      set((state) => {
        if (!state.editingTrajectory) return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const updated: Trajectory = { ...state.editingTrajectory, name };
        return {
          editingTrajectory: updated,
          history: { past, future: [] },
        };
      });
    },

    updateTrajectoryClosed: (closed) => {
      set((state) => {
        if (!state.editingTrajectory) return state;
        const past = pushHistory(state.history.past, state.editingTrajectory);
        const updated: Trajectory = { ...state.editingTrajectory, closed };
        return {
          editingTrajectory: updated,
          history: { past, future: [] },
        };
      });
    },

    // -----------------------------------------------------------------------
    // Selection
    // -----------------------------------------------------------------------

    selectPoint: (index) => {
      set({ selectedPointIndex: index });
    },

    // -----------------------------------------------------------------------
    // Visualization data (set externally)
    // -----------------------------------------------------------------------

    setPointWorldPositions: (positions) => {
      set({ pointWorldPositions: positions });
    },

    setCurvePoints: (points) => {
      set({ curvePoints: points });
    },

    // -----------------------------------------------------------------------
    // Undo / Redo
    // -----------------------------------------------------------------------

    undoTrajectoryEdit: () => {
      set((state) => {
        if (state.history.past.length === 0 || !state.editingTrajectory) return state;
        const past = [...state.history.past];
        const previous = past.pop()!;
        const future = [cloneTrajectory(state.editingTrajectory), ...state.history.future];
        const pointCount = getPointCount(previous);
        return {
          editingTrajectory: previous,
          warnings: validateTrajectory(previous),
          selectedPointIndex:
            state.selectedPointIndex !== null && state.selectedPointIndex < pointCount
              ? state.selectedPointIndex
              : null,
          history: { past, future },
        };
      });
    },

    redoTrajectoryEdit: () => {
      set((state) => {
        if (state.history.future.length === 0 || !state.editingTrajectory) return state;
        const future = [...state.history.future];
        const next = future.shift()!;
        const past = [...state.history.past, cloneTrajectory(state.editingTrajectory)];
        const pointCount = getPointCount(next);
        return {
          editingTrajectory: next,
          warnings: validateTrajectory(next),
          selectedPointIndex:
            state.selectedPointIndex !== null && state.selectedPointIndex < pointCount
              ? state.selectedPointIndex
              : null,
          history: { past, future },
        };
      });
    },

    canUndo: () => get().history.past.length > 0,
    canRedo: () => get().history.future.length > 0,

    // -----------------------------------------------------------------------
    // Commit
    // -----------------------------------------------------------------------

    commitTrajectory: () => {
      const { editingTrajectory } = get();
      if (!editingTrajectory) return null;
      return cloneTrajectory(editingTrajectory);
    },
  }),
);
