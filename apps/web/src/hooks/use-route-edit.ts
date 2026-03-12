import { useCallback, useEffect, useRef } from 'react';
import type { Route, OpenDriveDocument } from '@osce/shared';
import { useRouteEditStore } from '../stores/route-edit-store';
import type { RouteEditSource } from '../stores/route-edit-store';
import { resolvePositionToWorld } from '@osce/3d-viewer';
import { computeRoadFollowingSegmentsAsync } from '../lib/route-path-computation';
import type { WaypointWorldPos } from '../lib/route-path-computation';
import type { RoadManagerClient } from '../lib/wasm/road-manager-client';

/**
 * Hook that bridges the route-edit-store with the scenario/catalog stores
 * and computes visualization data (world positions, path segments).
 *
 * @param rmClient - Optional WASM-based RoadManagerClient for cross-road path calculation.
 *                   When provided, waypoints on different roads will be connected along the road network.
 *                   When null, cross-road segments fall back to straight lines.
 */
export function useRouteEdit(
  odrDoc: OpenDriveDocument | null,
  rmClient: RoadManagerClient | null = null,
) {
  const store = useRouteEditStore();
  const odrDocRef = useRef(odrDoc);
  odrDocRef.current = odrDoc;

  // ---------------------------------------------------------------------------
  // Resolve waypoint positions to world coordinates whenever route changes.
  // Then compute path segments (async when WASM cross-road paths are needed).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!store.active || !store.editingRoute || !odrDoc) return;

    let cancelled = false;

    const positions: WaypointWorldPos[] = [];
    for (const wp of store.editingRoute.waypoints) {
      const world = resolvePositionToWorld(wp.position, odrDoc);
      if (world) {
        positions.push({ x: world.x, y: world.y, z: world.z, h: world.h });
      } else {
        positions.push({ x: 0, y: 0, z: 0, h: 0 });
      }
    }
    store.setWaypointWorldPositions(positions);

    const route = store.editingRoute;
    if (positions.length >= 2) {
      computeRoadFollowingSegmentsAsync(route, positions, odrDoc, rmClient).then(
        (segments) => {
          if (!cancelled) store.setPathSegments(segments);
        },
      );
    } else {
      store.setPathSegments([]);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.editingRoute, odrDoc, store.active, rmClient]);

  // ---------------------------------------------------------------------------
  // Start route editing
  // ---------------------------------------------------------------------------
  const startRouteEdit = useCallback(
    (source: RouteEditSource, route: Route) => {
      store.enterRouteEditMode(source, route);
    },
    [store],
  );

  // ---------------------------------------------------------------------------
  // Save route back to source
  // ---------------------------------------------------------------------------
  const saveRoute = useCallback(
    (
      updateAction?: (actionId: string, updates: Record<string, unknown>) => void,
      updateCatalogEntry?: (catalogName: string, index: number, route: Route) => void,
    ): Route | null => {
      const route = store.commitRoute();
      if (!route || !store.source) return null;

      if (store.source.type === 'action' && store.source.actionId && updateAction) {
        // Update the RoutingAction in the scenario store
        updateAction(store.source.actionId, {
          action: {
            type: 'routingAction' as const,
            routeAction: 'assignRoute' as const,
            route: {
              name: route.name,
              closed: route.closed,
              waypoints: route.waypoints.map((wp) => ({
                position: wp.position,
                routeStrategy: wp.routeStrategy,
              })),
            },
          },
        });
      } else if (
        store.source.type === 'catalog' &&
        store.source.catalogName != null &&
        store.source.entryIndex != null &&
        updateCatalogEntry
      ) {
        updateCatalogEntry(store.source.catalogName, store.source.entryIndex, route);
      }

      store.exitRouteEditMode();
      return route;
    },
    [store],
  );

  // ---------------------------------------------------------------------------
  // Cancel route editing
  // ---------------------------------------------------------------------------
  const cancelRoute = useCallback(() => {
    store.exitRouteEditMode();
  }, [store]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts (Ctrl+Z / Ctrl+Y for undo/redo, Escape to exit)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!store.active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.undoRouteEdit();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        store.redoRouteEdit();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete selected waypoint
        if (store.selectedWaypointIndex !== null) {
          e.preventDefault();
          store.removeWaypoint(store.selectedWaypointIndex);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        store.exitRouteEditMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store.active, store]);

  return {
    // State
    active: store.active,
    source: store.source,
    editingRoute: store.editingRoute,
    originalRoute: store.originalRoute,
    selectedWaypointIndex: store.selectedWaypointIndex,
    waypointWorldPositions: store.waypointWorldPositions,
    pathSegments: store.pathSegments,
    warnings: store.warnings,
    hasChanges:
      store.editingRoute !== null &&
      store.originalRoute !== null &&
      JSON.stringify(store.editingRoute) !== JSON.stringify(store.originalRoute),

    // Actions
    startRouteEdit,
    saveRoute,
    cancelRoute,
    addWaypoint: store.addWaypoint,
    insertWaypoint: store.insertWaypoint,
    removeWaypoint: store.removeWaypoint,
    updateWaypointPosition: store.updateWaypointPosition,
    updateWaypointStrategy: store.updateWaypointStrategy,
    updateRouteName: store.updateRouteName,
    updateRouteClosed: store.updateRouteClosed,
    selectWaypoint: store.selectWaypoint,
    canUndo: store.canUndo,
    canRedo: store.canRedo,
    undoRouteEdit: store.undoRouteEdit,
    redoRouteEdit: store.redoRouteEdit,
  };
}
