import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Route, OpenDriveDocument } from '@osce/shared';
import { useRouteEditStore } from '../stores/route-edit-store';
import type { RouteEditSource } from '../stores/route-edit-store';
import {
  computeRoadFollowingSegmentsAsync,
  computeLaneChangeAwareSegmentsAsync,
  resolveRouteWaypoints,
} from '../lib/route-path-computation';
import type { RoadManagerClient } from '../lib/wasm/road-manager-client';
import { useDraftEditKeyboard } from './use-draft-edit-keyboard';

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
  // Subscribe only to the primitive state slices this hook reads. Zustand action
  // identities are stable, so selecting them individually avoids re-rendering the
  // consumer (EditorLayout) on every unrelated store change (e.g. during drags).
  const active = useRouteEditStore((s) => s.active);
  const source = useRouteEditStore((s) => s.source);
  const editingRoute = useRouteEditStore((s) => s.editingRoute);
  const originalRoute = useRouteEditStore((s) => s.originalRoute);
  const selectedWaypointIndex = useRouteEditStore((s) => s.selectedWaypointIndex);
  const waypointWorldPositions = useRouteEditStore(useShallow((s) => s.waypointWorldPositions));
  const pathSegments = useRouteEditStore(useShallow((s) => s.pathSegments));
  const laneChangeAware = useRouteEditStore((s) => s.laneChangeAware);
  const routeCalcStrategy = useRouteEditStore((s) => s.routeCalcStrategy);
  const laneChangeMarkers = useRouteEditStore(useShallow((s) => s.laneChangeMarkers));
  const warnings = useRouteEditStore(useShallow((s) => s.warnings));

  const enterRouteEditMode = useRouteEditStore((s) => s.enterRouteEditMode);
  const exitRouteEditMode = useRouteEditStore((s) => s.exitRouteEditMode);
  const addWaypoint = useRouteEditStore((s) => s.addWaypoint);
  const insertWaypoint = useRouteEditStore((s) => s.insertWaypoint);
  const removeWaypoint = useRouteEditStore((s) => s.removeWaypoint);
  const updateWaypointPosition = useRouteEditStore((s) => s.updateWaypointPosition);
  const updateWaypointStrategy = useRouteEditStore((s) => s.updateWaypointStrategy);
  const updateRouteName = useRouteEditStore((s) => s.updateRouteName);
  const updateRouteClosed = useRouteEditStore((s) => s.updateRouteClosed);
  const selectWaypoint = useRouteEditStore((s) => s.selectWaypoint);
  const setWaypointWorldPositions = useRouteEditStore((s) => s.setWaypointWorldPositions);
  const setPathSegments = useRouteEditStore((s) => s.setPathSegments);
  const setLaneChangeAware = useRouteEditStore((s) => s.setLaneChangeAware);
  const setRouteCalcStrategy = useRouteEditStore((s) => s.setRouteCalcStrategy);
  const setLaneChangeMarkers = useRouteEditStore((s) => s.setLaneChangeMarkers);
  const commitRoute = useRouteEditStore((s) => s.commitRoute);
  const canUndo = useRouteEditStore((s) => s.canUndo);
  const canRedo = useRouteEditStore((s) => s.canRedo);
  const undoRouteEdit = useRouteEditStore((s) => s.undoRouteEdit);
  const redoRouteEdit = useRouteEditStore((s) => s.redoRouteEdit);

  const odrDocRef = useRef(odrDoc);
  odrDocRef.current = odrDoc;

  // ---------------------------------------------------------------------------
  // Resolve waypoint positions to world coordinates whenever route changes.
  // Then compute path segments (async when WASM cross-road paths are needed).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!active || !editingRoute || !odrDoc) return;

    let cancelled = false;

    const positions = resolveRouteWaypoints(editingRoute, odrDoc);
    setWaypointWorldPositions(positions);

    const route = editingRoute;
    if (positions.length >= 2) {
      if (laneChangeAware && rmClient) {
        computeLaneChangeAwareSegmentsAsync(
          route,
          positions,
          odrDoc,
          rmClient,
          routeCalcStrategy,
        ).then(({ segments, markers }) => {
          if (!cancelled) {
            setPathSegments(segments);
            setLaneChangeMarkers(markers);
          }
        });
      } else {
        computeRoadFollowingSegmentsAsync(route, positions, odrDoc, rmClient).then((segments) => {
          if (!cancelled) {
            setPathSegments(segments);
            setLaneChangeMarkers([]);
          }
        });
      }
    } else {
      setPathSegments([]);
      setLaneChangeMarkers([]);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingRoute, odrDoc, active, rmClient, laneChangeAware, routeCalcStrategy]);

  // ---------------------------------------------------------------------------
  // Start route editing
  // ---------------------------------------------------------------------------
  const startRouteEdit = useCallback(
    (src: RouteEditSource, route: Route) => {
      enterRouteEditMode(src, route);
    },
    [enterRouteEditMode],
  );

  // ---------------------------------------------------------------------------
  // Save route back to source
  // ---------------------------------------------------------------------------
  const saveRoute = useCallback(
    (
      updateAction?: (actionId: string, updates: Record<string, unknown>) => void,
      updateCatalogEntry?: (catalogName: string, index: number, route: Route) => void,
    ): Route | null => {
      const route = commitRoute();
      if (!route || !source) return null;

      if (source.type === 'action' && source.actionId && updateAction) {
        // Update the RoutingAction in the scenario store
        updateAction(source.actionId, {
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
        source.type === 'catalog' &&
        source.catalogName != null &&
        source.entryIndex != null &&
        updateCatalogEntry
      ) {
        updateCatalogEntry(source.catalogName, source.entryIndex, route);
      }

      exitRouteEditMode();
      return route;
    },
    [commitRoute, source, exitRouteEditMode],
  );

  // ---------------------------------------------------------------------------
  // Cancel route editing
  // ---------------------------------------------------------------------------
  const cancelRoute = useCallback(() => {
    exitRouteEditMode();
  }, [exitRouteEditMode]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts (Ctrl+Z / Ctrl+Y for undo/redo, Delete, Escape)
  // ---------------------------------------------------------------------------
  const onDeleteSelected = useCallback(() => {
    if (selectedWaypointIndex !== null) {
      removeWaypoint(selectedWaypointIndex);
      return true;
    }
    return false;
  }, [selectedWaypointIndex, removeWaypoint]);

  useDraftEditKeyboard({
    active,
    onUndo: undoRouteEdit,
    onRedo: redoRouteEdit,
    onDeleteSelected,
    onEscape: exitRouteEditMode,
  });

  return {
    // State
    active,
    source,
    editingRoute,
    originalRoute,
    selectedWaypointIndex,
    waypointWorldPositions,
    pathSegments,
    laneChangeAware,
    routeCalcStrategy,
    laneChangeMarkers,
    warnings,
    hasChanges:
      editingRoute !== null &&
      originalRoute !== null &&
      JSON.stringify(editingRoute) !== JSON.stringify(originalRoute),

    // Actions
    startRouteEdit,
    saveRoute,
    cancelRoute,
    addWaypoint,
    insertWaypoint,
    removeWaypoint,
    updateWaypointPosition,
    updateWaypointStrategy,
    updateRouteName,
    updateRouteClosed,
    selectWaypoint,
    setLaneChangeAware,
    setRouteCalcStrategy,
    canUndo,
    canRedo,
    undoRouteEdit,
    redoRouteEdit,
  };
}
