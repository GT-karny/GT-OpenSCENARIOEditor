import { useCallback, useMemo, useState } from 'react';
import type { CatalogEntry, OpenDriveDocument, Route } from '@osce/shared';
import type { RouteEditConfig } from '@osce/3d-viewer';
import { worldToLane } from '@osce/opendrive';
import type { useScenarioStoreApi } from '../stores/use-scenario-store';
import type { RoadManagerClient } from '../features/simulation/lib/wasm/road-manager-client';
import type { useRouteEdit } from './use-route-edit';
import type { WaypointContextMenuPosition } from '../features/scenario/components/route/WaypointContextMenu';

interface UseRouteEditHandlersParams {
  routeEdit: ReturnType<typeof useRouteEdit>;
  roadNetwork: OpenDriveDocument | null;
  roadManagerClient: RoadManagerClient | null;
  scenarioStoreApi: ReturnType<typeof useScenarioStoreApi>;
  updateCatalogEntry: (catalogName: string, entryIndex: number, entry: CatalogEntry) => void;
  resolveCatalogRoute: (ref: { catalogName: string; entryName: string }) => Route | null;
  routePreviewData: RouteEditConfig['previewData'];
}

interface UseRouteEditHandlersResult {
  config: RouteEditConfig;
  waypointContextMenu: WaypointContextMenuPosition | null;
  setWaypointContextMenu: (menu: WaypointContextMenuPosition | null) => void;
}

/**
 * Wraps the route-edit store methods in 3D-viewer callback handlers and builds
 * the referentially stable RouteEditConfig consumed by the viewer. Also owns the
 * waypoint context-menu state, which is scoped to route editing.
 */
export function useRouteEditHandlers({
  routeEdit,
  roadNetwork,
  roadManagerClient,
  scenarioStoreApi,
  updateCatalogEntry,
  resolveCatalogRoute,
  routePreviewData,
}: UseRouteEditHandlersParams): UseRouteEditHandlersResult {
  const handleRouteWaypointAdd = useCallback(
    (
      _worldX: number,
      _worldY: number,
      _worldZ: number,
      _heading: number,
      roadId: string,
      laneId: string,
      s: number,
      _offset: number,
    ) => {
      // Route waypoints always snap to lane center (no lateral offset)
      routeEdit.addWaypoint({
        type: 'lanePosition',
        roadId,
        laneId,
        s: Math.round(s * 100) / 100,
      });
    },
    [routeEdit],
  );

  const handleRouteWaypointClick = useCallback(
    (index: number) => {
      routeEdit.selectWaypoint(index);
    },
    [routeEdit],
  );

  const [waypointContextMenu, setWaypointContextMenu] =
    useState<WaypointContextMenuPosition | null>(null);

  const handleRouteWaypointContextMenu = useCallback((index: number, event: unknown) => {
    const nativeEvent = (event as { nativeEvent?: MouseEvent })?.nativeEvent;
    if (!nativeEvent) return;
    nativeEvent.preventDefault();
    setWaypointContextMenu({
      x: nativeEvent.clientX,
      y: nativeEvent.clientY,
      waypointIndex: index,
    });
  }, []);

  const handleRouteWaypointDragEnd = useCallback(
    (
      index: number,
      _worldX: number,
      _worldY: number,
      _worldZ: number,
      _heading: number,
      roadId: string,
      laneId: string,
      s: number,
      _offset: number,
    ) => {
      // Route waypoints always snap to lane center (no lateral offset)
      routeEdit.updateWaypointPosition(index, {
        type: 'lanePosition',
        roadId,
        laneId,
        s: Math.round(s * 100) / 100,
      });
    },
    [routeEdit],
  );

  const handleRouteLineClick = useCallback(
    (segmentIndex: number, event: unknown) => {
      if (!routeEdit.editingRoute || !roadNetwork) return;

      // Extract click position from ThreeEvent
      const threeEvent = event as { point?: { x: number; y: number; z: number } };
      if (threeEvent?.point) {
        // ThreeEvent point is in Three.js world coords (inside rotation group)
        // Convert to OpenDRIVE: odrX = point.x, odrY = -point.z
        const odrX = threeEvent.point.x;
        const odrY = -threeEvent.point.z;
        const lane = worldToLane(roadNetwork, odrX, odrY, 20);
        if (lane) {
          routeEdit.insertWaypoint(segmentIndex, {
            type: 'lanePosition',
            roadId: lane.roadId,
            laneId: String(lane.laneId),
            s: Math.round(lane.s * 100) / 100,
            offset:
              Math.abs(lane.offset) > 0.01 ? Math.round(lane.offset * 100) / 100 : undefined,
          });
          return;
        }
      }

      // Fallback: duplicate segment start position
      const wp = routeEdit.editingRoute.waypoints[segmentIndex];
      if (!wp) return;
      routeEdit.insertWaypoint(segmentIndex, wp.position);
    },
    [routeEdit, roadNetwork],
  );

  const handleRouteEditSave = useCallback(() => {
    routeEdit.saveRoute(
      // For action source: update via scenario store
      (actionId, updates) => {
        scenarioStoreApi.getState().updateAction(actionId, updates);
      },
      // For catalog source: update via catalog store
      (catalogName, entryIndex, route) => {
        updateCatalogEntry(catalogName, entryIndex, {
          catalogType: 'route',
          definition: route,
        });
      },
    );
  }, [routeEdit, scenarioStoreApi, updateCatalogEntry]);

  const handleRouteEditCancel = useCallback(() => {
    routeEdit.cancelRoute();
  }, [routeEdit]);

  // Grouped viewer config object.
  // Referentially stable via useMemo so the memo()'d SimulationViewerBridge and the
  // 30fps-rerendering ScenarioViewer do not re-render from new object identities each frame.
  const config = useMemo<RouteEditConfig>(
    () => ({
      active: routeEdit.active,
      waypoints: routeEdit.waypointWorldPositions,
      pathSegments: routeEdit.pathSegments,
      selectedWaypointIndex: routeEdit.selectedWaypointIndex,
      onWaypointClick: handleRouteWaypointClick,
      onWaypointContextMenu: handleRouteWaypointContextMenu,
      onLineClick: handleRouteLineClick,
      onWaypointAdd: handleRouteWaypointAdd,
      onWaypointDragEnd: handleRouteWaypointDragEnd,
      onEditSave: handleRouteEditSave,
      onEditCancel: handleRouteEditCancel,
      warnings: routeEdit.warnings,
      waypointCount: routeEdit.editingRoute?.waypoints.length ?? 0,
      laneChangeMarkers: routeEdit.laneChangeMarkers,
      laneChangeAware: routeEdit.laneChangeAware,
      laneChangeAvailable: roadManagerClient !== null,
      onToggleLaneChangeAware: routeEdit.setLaneChangeAware,
      calcStrategy: routeEdit.routeCalcStrategy,
      onCalcStrategyChange: routeEdit.setRouteCalcStrategy,
      resolveCatalogRoute,
      previewData: routePreviewData,
    }),
    [
      routeEdit.active,
      routeEdit.waypointWorldPositions,
      routeEdit.pathSegments,
      routeEdit.selectedWaypointIndex,
      handleRouteWaypointClick,
      handleRouteWaypointContextMenu,
      handleRouteLineClick,
      handleRouteWaypointAdd,
      handleRouteWaypointDragEnd,
      handleRouteEditSave,
      handleRouteEditCancel,
      routeEdit.warnings,
      routeEdit.editingRoute?.waypoints.length,
      routeEdit.laneChangeMarkers,
      routeEdit.laneChangeAware,
      roadManagerClient,
      routeEdit.setLaneChangeAware,
      routeEdit.routeCalcStrategy,
      routeEdit.setRouteCalcStrategy,
      resolveCatalogRoute,
      routePreviewData,
    ],
  );

  return { config, waypointContextMenu, setWaypointContextMenu };
}
