import { create } from 'zustand';
import type { Route, Position, RouteStrategy, Waypoint } from '@osce/shared';
import type { LaneChangeMarker } from '../lib/route-path-computation';
import {
  cloneDraft,
  createDraftEditActions,
  type DraftEditConfig,
  type DraftHistory,
} from './draft-edit-store-factory';

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
  pathSegments: Array<Array<{ x: number; y: number; z: number; h?: number }>>;

  // --- Lane-change-aware routing (GT_esmini) ---
  /** When true, paths between waypoints are computed via GTRouteJS (allows mid-road lane changes). */
  laneChangeAware: boolean;
  /** Routing strategy passed to GTRouteJS: 0 = SHORTEST, 1 = FASTEST, 2 = MIN_INTERSECTIONS. */
  routeCalcStrategy: number;
  /** Lane changes required along the lane-change-aware route, resolved to world coords. */
  laneChangeMarkers: LaneChangeMarker[];

  // --- Validation ---
  warnings: string[];

  // --- Internal undo/redo history ---
  history: DraftHistory<Route>;
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

  // --- Lane-change-aware routing ---
  setLaneChangeAware: (on: boolean) => void;
  setRouteCalcStrategy: (strategy: number) => void;
  setLaneChangeMarkers: (markers: LaneChangeMarker[]) => void;

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

const DEFAULT_ROUTE_STRATEGY: RouteStrategy = 'shortest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

type RouteStore = RouteEditState & RouteEditActions;

const initialState: RouteEditState = {
  active: false,
  source: null,
  editingRoute: null,
  originalRoute: null,
  selectedWaypointIndex: null,
  waypointWorldPositions: [],
  pathSegments: [],
  laneChangeAware: false,
  routeCalcStrategy: 0,
  laneChangeMarkers: [],
  warnings: [],
  history: { past: [], future: [] },
};

const config: DraftEditConfig<Route, RouteStore> = {
  getDraft: (s) => s.editingRoute,
  setDraft: (draft) => ({ editingRoute: draft }),
  getSelectedIndex: (s) => s.selectedWaypointIndex,
  setSelectedIndex: (index) => ({ selectedWaypointIndex: index }),
  getHistory: (s) => s.history,
  validate: validateRoute,
  pointCount: (route) => route.waypoints.length,
};

export const useRouteEditStore = create<RouteStore>((set, get) => {
  const core = createDraftEditActions<Route, RouteStore>(set, get, config);

  return {
    ...initialState,

    // -----------------------------------------------------------------------
    // Mode control
    // -----------------------------------------------------------------------

    enterRouteEditMode: (source, route) => {
      const copy = cloneDraft(route);
      set({
        active: true,
        source,
        editingRoute: copy,
        originalRoute: cloneDraft(route),
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
      core.commitDraftChange((route) => {
        const waypoint: Waypoint = { position, routeStrategy };
        return {
          draft: { ...route, waypoints: [...route.waypoints, waypoint] },
          selectedIndex: route.waypoints.length,
        };
      });
    },

    insertWaypoint: (afterIndex, position, routeStrategy = DEFAULT_ROUTE_STRATEGY) => {
      core.commitDraftChange((route) => {
        const waypoint: Waypoint = { position, routeStrategy };
        const waypoints = [...route.waypoints];
        waypoints.splice(afterIndex + 1, 0, waypoint);
        return { draft: { ...route, waypoints }, selectedIndex: afterIndex + 1 };
      });
    },

    removeWaypoint: (index) => {
      core.commitDraftChange((route) => {
        if (index < 0 || index >= route.waypoints.length) return null;
        const waypoints = route.waypoints.filter((_, i) => i !== index);
        let selectedIndex = get().selectedWaypointIndex;
        if (selectedIndex !== null) {
          if (selectedIndex === index) {
            selectedIndex = waypoints.length > 0 ? Math.min(index, waypoints.length - 1) : null;
          } else if (selectedIndex > index) {
            selectedIndex--;
          }
        }
        return { draft: { ...route, waypoints }, selectedIndex };
      });
    },

    updateWaypointPosition: (index, position) => {
      core.commitDraftChange((route) => {
        if (index < 0 || index >= route.waypoints.length) return null;
        const waypoints = route.waypoints.map((wp, i) => (i === index ? { ...wp, position } : wp));
        return { draft: { ...route, waypoints } };
      });
    },

    updateWaypointStrategy: (index, strategy) => {
      core.commitDraftChange(
        (route) => {
          if (index < 0 || index >= route.waypoints.length) return null;
          const waypoints = route.waypoints.map((wp, i) =>
            i === index ? { ...wp, routeStrategy: strategy } : wp,
          );
          return { draft: { ...route, waypoints } };
        },
        { revalidate: false },
      );
    },

    // -----------------------------------------------------------------------
    // Route properties
    // -----------------------------------------------------------------------

    updateRouteName: (name) => {
      core.commitDraftChange((route) => ({ draft: { ...route, name } }), { revalidate: false });
    },

    updateRouteClosed: (closed) => {
      core.commitDraftChange((route) => ({ draft: { ...route, closed } }), { revalidate: false });
    },

    // -----------------------------------------------------------------------
    // Selection
    // -----------------------------------------------------------------------

    selectWaypoint: (index) => {
      core.selectIndex(index);
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
    // Lane-change-aware routing
    // -----------------------------------------------------------------------

    setLaneChangeAware: (on) => {
      // Clear stale markers when turning the mode off.
      set(on ? { laneChangeAware: true } : { laneChangeAware: false, laneChangeMarkers: [] });
    },

    setRouteCalcStrategy: (strategy) => {
      set({ routeCalcStrategy: strategy });
    },

    setLaneChangeMarkers: (markers) => {
      set({ laneChangeMarkers: markers });
    },

    // -----------------------------------------------------------------------
    // Undo / Redo / Commit (shared infrastructure)
    // -----------------------------------------------------------------------

    undoRouteEdit: core.undo,
    redoRouteEdit: core.redo,
    canUndo: core.canUndo,
    canRedo: core.canRedo,
    commitRoute: core.commit,
  };
});
