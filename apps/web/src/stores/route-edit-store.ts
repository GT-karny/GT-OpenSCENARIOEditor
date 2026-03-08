import { create } from 'zustand';
import type { Route, Position, RouteStrategy, Waypoint } from '@osce/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RouteEditSource {
  type: 'action' | 'catalog';
  /** For action source: scenario action id */
  actionId?: string;
  /** For action source: entity reference name */
  entityRef?: string;
  /** For catalog source: catalog document name */
  catalogName?: string;
  /** For catalog source: entry index within catalog */
  entryIndex?: number;
}

export interface WaypointWorldPos {
  x: number;
  y: number;
  z: number;
  h: number;
}

export interface RouteEditState {
  // --- Mode ---
  active: boolean;
  source: RouteEditSource | null;

  // --- Working copy ---
  editingRoute: Route | null;
  /** Original route snapshot at edit start (for cancel) */
  originalRoute: Route | null;

  // --- Selection ---
  selectedWaypointIndex: number | null;

  // --- Computed visualization data ---
  waypointWorldPositions: WaypointWorldPos[];
  pathSegments: Array<Array<{ x: number; y: number; z: number }>>;

  // --- Validation ---
  warnings: string[];

  // --- Internal undo/redo history ---
  history: {
    past: Route[];
    future: Route[];
  };
}

export interface RouteEditActions {
  // --- Mode control ---
  enterRouteEditMode: (source: RouteEditSource, route: Route) => void;
  exitRouteEditMode: () => void;

  // --- Waypoint CRUD ---
  addWaypoint: (position: Position, routeStrategy?: RouteStrategy) => void;
  insertWaypoint: (afterIndex: number, position: Position, routeStrategy?: RouteStrategy) => void;
  removeWaypoint: (index: number) => void;
  updateWaypointPosition: (index: number, position: Position) => void;
  updateWaypointStrategy: (index: number, strategy: RouteStrategy) => void;

  // --- Route properties ---
  updateRouteName: (name: string) => void;
  updateRouteClosed: (closed: boolean) => void;

  // --- Selection ---
  selectWaypoint: (index: number | null) => void;

  // --- Visualization data (set externally by hooks) ---
  setWaypointWorldPositions: (positions: WaypointWorldPos[]) => void;
  setPathSegments: (segments: Array<Array<{ x: number; y: number; z: number }>>) => void;

  // --- Undo/Redo ---
  undoRouteEdit: () => void;
  redoRouteEdit: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // --- Commit ---
  commitRoute: () => Route | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_HISTORY = 50;
const DEFAULT_ROUTE_STRATEGY: RouteStrategy = 'shortest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cloneRoute(route: Route): Route {
  return JSON.parse(JSON.stringify(route));
}

function validateRoute(route: Route): string[] {
  const warnings: string[] = [];
  if (route.waypoints.length < 2) {
    warnings.push('Route requires at least 2 waypoints');
  }
  // Check for duplicate consecutive waypoints (same road + lane + s)
  for (let i = 1; i < route.waypoints.length; i++) {
    const prev = route.waypoints[i - 1].position;
    const curr = route.waypoints[i].position;
    if (
      prev.type === 'lanePosition' &&
      curr.type === 'lanePosition' &&
      prev.roadId === curr.roadId &&
      prev.laneId === curr.laneId &&
      Math.abs(prev.s - curr.s) < 0.01
    ) {
      warnings.push(`Waypoints ${i} and ${i + 1} are at the same position`);
    }
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const initialState: RouteEditState = {
  active: false,
  source: null,
  editingRoute: null,
  originalRoute: null,
  selectedWaypointIndex: null,
  waypointWorldPositions: [],
  pathSegments: [],
  warnings: [],
  history: { past: [], future: [] },
};

export const useRouteEditStore = create<RouteEditState & RouteEditActions>((set, get) => ({
  ...initialState,

  // -----------------------------------------------------------------------
  // Mode control
  // -----------------------------------------------------------------------

  enterRouteEditMode: (source, route) => {
    const copy = cloneRoute(route);
    set({
      active: true,
      source,
      editingRoute: copy,
      originalRoute: cloneRoute(route),
      selectedWaypointIndex: null,
      waypointWorldPositions: [],
      pathSegments: [],
      warnings: validateRoute(copy),
      history: { past: [], future: [] },
    });
  },

  exitRouteEditMode: () => {
    set(initialState);
  },

  // -----------------------------------------------------------------------
  // Waypoint CRUD
  // -----------------------------------------------------------------------

  addWaypoint: (position, routeStrategy = DEFAULT_ROUTE_STRATEGY) => {
    set((state) => {
      if (!state.editingRoute) return state;
      const past = pushHistory(state.history.past, state.editingRoute);
      const waypoint: Waypoint = { position, routeStrategy };
      const updated: Route = {
        ...state.editingRoute,
        waypoints: [...state.editingRoute.waypoints, waypoint],
      };
      return {
        editingRoute: updated,
        warnings: validateRoute(updated),
        selectedWaypointIndex: updated.waypoints.length - 1,
        history: { past, future: [] },
      };
    });
  },

  insertWaypoint: (afterIndex, position, routeStrategy = DEFAULT_ROUTE_STRATEGY) => {
    set((state) => {
      if (!state.editingRoute) return state;
      const past = pushHistory(state.history.past, state.editingRoute);
      const waypoint: Waypoint = { position, routeStrategy };
      const waypoints = [...state.editingRoute.waypoints];
      waypoints.splice(afterIndex + 1, 0, waypoint);
      const updated: Route = { ...state.editingRoute, waypoints };
      return {
        editingRoute: updated,
        warnings: validateRoute(updated),
        selectedWaypointIndex: afterIndex + 1,
        history: { past, future: [] },
      };
    });
  },

  removeWaypoint: (index) => {
    set((state) => {
      if (!state.editingRoute) return state;
      if (index < 0 || index >= state.editingRoute.waypoints.length) return state;
      const past = pushHistory(state.history.past, state.editingRoute);
      const waypoints = state.editingRoute.waypoints.filter((_, i) => i !== index);
      const updated: Route = { ...state.editingRoute, waypoints };
      let selectedWaypointIndex = state.selectedWaypointIndex;
      if (selectedWaypointIndex !== null) {
        if (selectedWaypointIndex === index) {
          selectedWaypointIndex =
            waypoints.length > 0 ? Math.min(index, waypoints.length - 1) : null;
        } else if (selectedWaypointIndex > index) {
          selectedWaypointIndex--;
        }
      }
      return {
        editingRoute: updated,
        warnings: validateRoute(updated),
        selectedWaypointIndex,
        history: { past, future: [] },
      };
    });
  },

  updateWaypointPosition: (index, position) => {
    set((state) => {
      if (!state.editingRoute) return state;
      if (index < 0 || index >= state.editingRoute.waypoints.length) return state;
      const past = pushHistory(state.history.past, state.editingRoute);
      const waypoints = state.editingRoute.waypoints.map((wp, i) =>
        i === index ? { ...wp, position } : wp,
      );
      const updated: Route = { ...state.editingRoute, waypoints };
      return {
        editingRoute: updated,
        warnings: validateRoute(updated),
        history: { past, future: [] },
      };
    });
  },

  updateWaypointStrategy: (index, strategy) => {
    set((state) => {
      if (!state.editingRoute) return state;
      if (index < 0 || index >= state.editingRoute.waypoints.length) return state;
      const past = pushHistory(state.history.past, state.editingRoute);
      const waypoints = state.editingRoute.waypoints.map((wp, i) =>
        i === index ? { ...wp, routeStrategy: strategy } : wp,
      );
      const updated: Route = { ...state.editingRoute, waypoints };
      return {
        editingRoute: updated,
        history: { past, future: [] },
      };
    });
  },

  // -----------------------------------------------------------------------
  // Route properties
  // -----------------------------------------------------------------------

  updateRouteName: (name) => {
    set((state) => {
      if (!state.editingRoute) return state;
      const past = pushHistory(state.history.past, state.editingRoute);
      const updated: Route = { ...state.editingRoute, name };
      return {
        editingRoute: updated,
        history: { past, future: [] },
      };
    });
  },

  updateRouteClosed: (closed) => {
    set((state) => {
      if (!state.editingRoute) return state;
      const past = pushHistory(state.history.past, state.editingRoute);
      const updated: Route = { ...state.editingRoute, closed };
      return {
        editingRoute: updated,
        history: { past, future: [] },
      };
    });
  },

  // -----------------------------------------------------------------------
  // Selection
  // -----------------------------------------------------------------------

  selectWaypoint: (index) => {
    set({ selectedWaypointIndex: index });
  },

  // -----------------------------------------------------------------------
  // Visualization data (set externally)
  // -----------------------------------------------------------------------

  setWaypointWorldPositions: (positions) => {
    set({ waypointWorldPositions: positions });
  },

  setPathSegments: (segments) => {
    set({ pathSegments: segments });
  },

  // -----------------------------------------------------------------------
  // Undo / Redo
  // -----------------------------------------------------------------------

  undoRouteEdit: () => {
    set((state) => {
      if (state.history.past.length === 0 || !state.editingRoute) return state;
      const past = [...state.history.past];
      const previous = past.pop()!;
      const future = [cloneRoute(state.editingRoute), ...state.history.future];
      return {
        editingRoute: previous,
        warnings: validateRoute(previous),
        selectedWaypointIndex:
          state.selectedWaypointIndex !== null &&
          state.selectedWaypointIndex < previous.waypoints.length
            ? state.selectedWaypointIndex
            : null,
        history: { past, future },
      };
    });
  },

  redoRouteEdit: () => {
    set((state) => {
      if (state.history.future.length === 0 || !state.editingRoute) return state;
      const future = [...state.history.future];
      const next = future.shift()!;
      const past = [...state.history.past, cloneRoute(state.editingRoute)];
      return {
        editingRoute: next,
        warnings: validateRoute(next),
        selectedWaypointIndex:
          state.selectedWaypointIndex !== null &&
          state.selectedWaypointIndex < next.waypoints.length
            ? state.selectedWaypointIndex
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

  commitRoute: () => {
    const { editingRoute } = get();
    if (!editingRoute) return null;
    return cloneRoute(editingRoute);
  },
}));

// ---------------------------------------------------------------------------
// History helpers
// ---------------------------------------------------------------------------

function pushHistory(past: Route[], route: Route): Route[] {
  const newPast = [...past, cloneRoute(route)];
  if (newPast.length > MAX_HISTORY) {
    newPast.shift();
  }
  return newPast;
}
