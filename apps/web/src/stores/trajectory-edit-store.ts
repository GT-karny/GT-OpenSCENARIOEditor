import { create } from 'zustand';
import type {
  Trajectory,
  TrajectoryShape,
  TrajectoryVertex,
  NurbsControlPoint,
  Position,
} from '@osce/shared';
import { generateClampedUniformKnots } from '../lib/nurbs-knot-utils';
import {
  cloneDraft,
  createDraftEditActions,
  type DraftEditConfig,
  type DraftHistory,
} from './draft-edit-store-factory';

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
  history: DraftHistory<Trajectory>;
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
// Helpers
// ---------------------------------------------------------------------------

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
    case 'clothoidSpline':
      // ClothoidSpline validation not yet implemented
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

// Helper to get the count of editable points for the current shape
function getPointCount(t: Trajectory): number {
  switch (t.shape.type) {
    case 'polyline':
      return t.shape.vertices.length;
    case 'clothoid':
      return t.shape.position ? 1 : 0;
    case 'nurbs':
      return t.shape.controlPoints.length;
    case 'clothoidSpline':
      // ClothoidSpline editing not yet implemented
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type TrajectoryStore = TrajectoryEditState & TrajectoryEditActions;

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

const config: DraftEditConfig<Trajectory, TrajectoryStore> = {
  getDraft: (s) => s.editingTrajectory,
  setDraft: (draft) => ({ editingTrajectory: draft }),
  getSelectedIndex: (s) => s.selectedPointIndex,
  setSelectedIndex: (index) => ({ selectedPointIndex: index }),
  getHistory: (s) => s.history,
  validate: validateTrajectory,
  pointCount: getPointCount,
};

export const useTrajectoryEditStore = create<TrajectoryStore>((set, get) => {
  const core = createDraftEditActions<Trajectory, TrajectoryStore>(set, get, config);

  /** Recompute the clamped-uniform knot vector when control-point count/order changes. */
  function knotsFor(controlPointCount: number, order: number, fallback: number[]): number[] {
    if (controlPointCount >= 2) return generateClampedUniformKnots(controlPointCount, order);
    return fallback;
  }

  return {
    ...initialState,

    // -----------------------------------------------------------------------
    // Mode control
    // -----------------------------------------------------------------------

    enterTrajectoryEditMode: (source, trajectory) => {
      const copy = cloneDraft(trajectory);
      set({
        active: true,
        source,
        editingTrajectory: copy,
        originalTrajectory: cloneDraft(trajectory),
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
      core.commitDraftChange((t) => {
        if (t.shape.type !== 'polyline') return null;
        const vertex: TrajectoryVertex = { position };
        return {
          draft: { ...t, shape: { type: 'polyline', vertices: [...t.shape.vertices, vertex] } },
          selectedIndex: t.shape.vertices.length,
        };
      });
    },

    insertVertex: (afterIndex, position) => {
      core.commitDraftChange((t) => {
        if (t.shape.type !== 'polyline') return null;
        const vertices = [...t.shape.vertices];
        vertices.splice(afterIndex + 1, 0, { position });
        return {
          draft: { ...t, shape: { type: 'polyline', vertices } },
          selectedIndex: afterIndex + 1,
        };
      });
    },

    removeVertex: (index) => {
      core.commitDraftChange((t) => {
        if (t.shape.type !== 'polyline') return null;
        if (index < 0 || index >= t.shape.vertices.length) return null;
        const vertices = t.shape.vertices.filter((_, i) => i !== index);
        let selectedIndex = get().selectedPointIndex;
        if (selectedIndex !== null) {
          if (selectedIndex === index) {
            selectedIndex = vertices.length > 0 ? Math.min(index, vertices.length - 1) : null;
          } else if (selectedIndex > index) {
            selectedIndex--;
          }
        }
        return { draft: { ...t, shape: { type: 'polyline', vertices } }, selectedIndex };
      });
    },

    updateVertexPosition: (index, position) => {
      core.commitDraftChange((t) => {
        if (t.shape.type !== 'polyline') return null;
        if (index < 0 || index >= t.shape.vertices.length) return null;
        const vertices = t.shape.vertices.map((v, i) => (i === index ? { ...v, position } : v));
        return { draft: { ...t, shape: { type: 'polyline', vertices } } };
      });
    },

    updateVertexTime: (index, time) => {
      core.commitDraftChange(
        (t) => {
          if (t.shape.type !== 'polyline') return null;
          if (index < 0 || index >= t.shape.vertices.length) return null;
          const vertices = t.shape.vertices.map((v, i) => (i === index ? { ...v, time } : v));
          return { draft: { ...t, shape: { type: 'polyline', vertices } } };
        },
        { revalidate: false },
      );
    },

    // -----------------------------------------------------------------------
    // Clothoid
    // -----------------------------------------------------------------------

    updateClothoidParams: (params) => {
      core.commitDraftChange((t) => {
        if (t.shape.type !== 'clothoid') return null;
        return { draft: { ...t, shape: { ...t.shape, ...params, type: 'clothoid' } } };
      });
    },

    updateClothoidPosition: (position) => {
      core.commitDraftChange((t) => {
        if (t.shape.type !== 'clothoid') return null;
        return { draft: { ...t, shape: { ...t.shape, position } } };
      });
    },

    // -----------------------------------------------------------------------
    // NURBS
    // -----------------------------------------------------------------------

    addControlPoint: (position) => {
      core.commitDraftChange((t) => {
        if (t.shape.type !== 'nurbs') return null;
        const shape = t.shape;
        const cp: NurbsControlPoint = { position, weight: 1.0 };
        const controlPoints = [...shape.controlPoints, cp];
        const knots = knotsFor(controlPoints.length, shape.order, shape.knots);
        return {
          draft: { ...t, shape: { ...shape, controlPoints, knots } },
          selectedIndex: shape.controlPoints.length,
        };
      });
    },

    insertControlPoint: (afterIndex, position) => {
      core.commitDraftChange((t) => {
        if (t.shape.type !== 'nurbs') return null;
        const shape = t.shape;
        const controlPoints = [...shape.controlPoints];
        controlPoints.splice(afterIndex + 1, 0, { position, weight: 1.0 });
        const knots = knotsFor(controlPoints.length, shape.order, shape.knots);
        return {
          draft: { ...t, shape: { ...shape, controlPoints, knots } },
          selectedIndex: afterIndex + 1,
        };
      });
    },

    removeControlPoint: (index) => {
      core.commitDraftChange((t) => {
        if (t.shape.type !== 'nurbs') return null;
        const shape = t.shape;
        if (index < 0 || index >= shape.controlPoints.length) return null;
        const controlPoints = shape.controlPoints.filter((_, i) => i !== index);
        const knots = knotsFor(controlPoints.length, shape.order, []);
        let selectedIndex = get().selectedPointIndex;
        if (selectedIndex !== null) {
          if (selectedIndex === index) {
            selectedIndex =
              controlPoints.length > 0 ? Math.min(index, controlPoints.length - 1) : null;
          } else if (selectedIndex > index) {
            selectedIndex--;
          }
        }
        return { draft: { ...t, shape: { ...shape, controlPoints, knots } }, selectedIndex };
      });
    },

    updateControlPointPosition: (index, position) => {
      core.commitDraftChange((t) => {
        if (t.shape.type !== 'nurbs') return null;
        const shape = t.shape;
        if (index < 0 || index >= shape.controlPoints.length) return null;
        const controlPoints = shape.controlPoints.map((cp, i) =>
          i === index ? { ...cp, position } : cp,
        );
        return { draft: { ...t, shape: { ...shape, controlPoints } } };
      });
    },

    updateControlPointWeight: (index, weight) => {
      core.commitDraftChange(
        (t) => {
          if (t.shape.type !== 'nurbs') return null;
          const shape = t.shape;
          if (index < 0 || index >= shape.controlPoints.length) return null;
          const controlPoints = shape.controlPoints.map((cp, i) =>
            i === index ? { ...cp, weight } : cp,
          );
          return { draft: { ...t, shape: { ...shape, controlPoints } } };
        },
        { revalidate: false },
      );
    },

    updateControlPointTime: (index, time) => {
      core.commitDraftChange(
        (t) => {
          if (t.shape.type !== 'nurbs') return null;
          const shape = t.shape;
          if (index < 0 || index >= shape.controlPoints.length) return null;
          const controlPoints = shape.controlPoints.map((cp, i) =>
            i === index ? { ...cp, time } : cp,
          );
          return { draft: { ...t, shape: { ...shape, controlPoints } } };
        },
        { revalidate: false },
      );
    },

    updateKnots: (knots) => {
      core.commitDraftChange((t) => {
        if (t.shape.type !== 'nurbs') return null;
        return { draft: { ...t, shape: { ...t.shape, knots } } };
      });
    },

    updateOrder: (order) => {
      core.commitDraftChange((t) => {
        if (t.shape.type !== 'nurbs') return null;
        return { draft: { ...t, shape: { ...t.shape, order } } };
      });
    },

    // -----------------------------------------------------------------------
    // Trajectory properties
    // -----------------------------------------------------------------------

    updateTrajectoryName: (name) => {
      core.commitDraftChange((t) => ({ draft: { ...t, name } }), { revalidate: false });
    },

    updateTrajectoryClosed: (closed) => {
      core.commitDraftChange((t) => ({ draft: { ...t, closed } }), { revalidate: false });
    },

    // -----------------------------------------------------------------------
    // Selection
    // -----------------------------------------------------------------------

    selectPoint: (index) => {
      core.selectIndex(index);
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
    // Undo / Redo / Commit (shared infrastructure)
    // -----------------------------------------------------------------------

    undoTrajectoryEdit: core.undo,
    redoTrajectoryEdit: core.redo,
    canUndo: core.canUndo,
    canRedo: core.canRedo,
    commitTrajectory: core.commit,
  };
});
