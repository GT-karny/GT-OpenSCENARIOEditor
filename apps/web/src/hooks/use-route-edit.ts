import { useCallback, useEffect, useRef } from 'react';
import type { Route, OpenDriveDocument, LanePosition } from '@osce/shared';
import { useRouteEditStore } from '../stores/route-edit-store';
import type { RouteEditSource, WaypointWorldPos } from '../stores/route-edit-store';
import { resolvePositionToWorld, roadCoordsToWorld } from '@osce/3d-viewer';
import { generateCurvatureAdaptiveSamples } from '@osce/opendrive';
import type { RoadManagerClient } from '../lib/wasm/road-manager-client';

type Point3 = { x: number; y: number; z: number };

/** Sampling options for same-road route segments (curvature-adaptive). */
const ROUTE_SAMPLING = { baseStep: 1.0, minStep: 0.3, maxStep: 3.0 };

/** Sample interval for cross-road WASM path calculation. */
const CROSS_ROAD_SAMPLE_INTERVAL = 0.5;

/**
 * Interpolate points along a road lane between two s values using JS geometry.
 * Uses curvature-adaptive sampling for smooth lines on curves.
 */
function interpolateRoadSegment(
  odrDoc: OpenDriveDocument,
  roadId: string,
  laneId: number,
  sFrom: number,
  sTo: number,
): Point3[] | null {
  const sMin = Math.min(sFrom, sTo);
  const sMax = Math.max(sFrom, sTo);
  const dist = sMax - sMin;
  if (dist < 0.01) return null;

  // Find the OdrRoad for curvature-adaptive sampling
  const road = odrDoc.roads.find((r) => r.id === roadId);
  if (!road) return null;

  const sValues = generateCurvatureAdaptiveSamples(road, sMin, sMax, ROUTE_SAMPLING);
  const points: Point3[] = [];

  for (const s of sValues) {
    const result = roadCoordsToWorld(odrDoc, roadId, laneId, s);
    if (result) {
      points.push({ x: result.x, y: result.y, z: result.z });
    }
  }

  console.info(
    `[RouteEdit] interpolateRoadSegment: road=${roadId} lane=${laneId} s=${sFrom.toFixed(1)}→${sTo.toFixed(1)} → ${sValues.length} samples, ${points.length} points`,
    points.length > 0 ? { first: points[0], last: points[points.length - 1] } : 'NO POINTS',
  );

  // Reverse if going from higher s to lower s
  if (sFrom > sTo && points.length >= 2) {
    points.reverse();
  }

  return points.length >= 2 ? points : null;
}

/**
 * Determine the entry s-value for a road by checking which end is closer
 * to the previous path point's world position.
 */
function determineEntryS(
  odrDoc: OpenDriveDocument,
  roadId: string,
  laneId: number,
  prevWorldPt: Point3,
): number {
  const road = odrDoc.roads.find((r) => r.id === roadId);
  if (!road) return 0;

  const startPos = roadCoordsToWorld(odrDoc, roadId, laneId, 0);
  const endPos = roadCoordsToWorld(odrDoc, roadId, laneId, road.length);
  if (!startPos || !endPos) return 0;

  const distToStart =
    (prevWorldPt.x - startPos.x) ** 2 + (prevWorldPt.y - startPos.y) ** 2;
  const distToEnd =
    (prevWorldPt.x - endPos.x) ** 2 + (prevWorldPt.y - endPos.y) ** 2;

  return distToStart < distToEnd ? 0 : road.length;
}

/**
 * Compute a road-following segment between two lane positions on different roads
 * using WASM-based esmini path calculation.
 *
 * The WASM engine returns sparse road-transition waypoints (one per road).
 * We extract the road sequence, determine entry/exit s-values for each road,
 * and densely interpolate each road segment using our own curvature-adaptive sampling.
 */
async function computeCrossRoadSegment(
  rmClient: RoadManagerClient,
  from: LanePosition,
  to: LanePosition,
  odrDoc: OpenDriveDocument,
): Promise<Point3[] | null> {
  try {
    const pathPoints = await rmClient.calculatePath(
      parseInt(from.roadId, 10),
      parseInt(from.laneId, 10),
      from.s,
      parseInt(to.roadId, 10),
      parseInt(to.laneId, 10),
      to.s,
      CROSS_ROAD_SAMPLE_INTERVAL,
    );
    console.info(
      '[RouteEdit] WASM path:',
      pathPoints.map((p) => `R${p.road_id}L${p.lane_id}@s${p.s.toFixed(1)}`).join(' → '),
    );
    if (pathPoints.length < 2) return null;

    // Extract unique road sequence (collapse consecutive same-road points)
    const roadSeq: Array<{ roadId: number; laneId: number; wasmS: number; wx: number; wy: number; wz: number }> = [];
    for (const p of pathPoints) {
      if (roadSeq.length === 0 || roadSeq[roadSeq.length - 1].roadId !== p.road_id) {
        roadSeq.push({ roadId: p.road_id, laneId: p.lane_id, wasmS: p.s, wx: p.x, wy: p.y, wz: p.z });
      } else {
        // Update with latest s for this road
        const last = roadSeq[roadSeq.length - 1];
        last.wasmS = p.s;
        last.wx = p.x;
        last.wy = p.y;
        last.wz = p.z;
      }
    }

    console.info(
      '[RouteEdit] road sequence:',
      roadSeq.map((r) => `R${r.roadId}L${r.laneId}@s${r.wasmS.toFixed(1)}`).join(' → '),
    );

    // Interpolate each road in the sequence
    const allPoints: Point3[] = [];
    let prevWorldPt: Point3 | null = null;

    for (let i = 0; i < roadSeq.length; i++) {
      const seg = roadSeq[i];
      const roadIdStr = String(seg.roadId);
      const road = odrDoc.roads.find((r) => r.id === roadIdStr);

      let entryS: number;
      let exitS: number;

      if (i === 0) {
        // First road: from WP start position toward road boundary
        entryS = parseFloat(String(from.s));
        exitS = road ? road.length : seg.wasmS;
        // Skip if we're already at the road boundary (distance ≈ 0)
        if (Math.abs(exitS - entryS) < 0.1) {
          // Just add the start point
          const p = roadCoordsToWorld(odrDoc, roadIdStr, seg.laneId, entryS);
          if (p) {
            allPoints.push({ x: p.x, y: p.y, z: p.z });
            prevWorldPt = allPoints[allPoints.length - 1];
          }
          continue;
        }
      } else if (i === roadSeq.length - 1) {
        // Last road: from road entry to WP destination
        entryS = prevWorldPt
          ? determineEntryS(odrDoc, roadIdStr, seg.laneId, prevWorldPt)
          : 0;
        exitS = parseFloat(String(to.s));
      } else {
        // Middle road (junction connecting): traverse fully
        if (prevWorldPt) {
          entryS = determineEntryS(odrDoc, roadIdStr, seg.laneId, prevWorldPt);
          exitS = road ? (entryS === 0 ? road.length : 0) : seg.wasmS;
        } else {
          entryS = 0;
          exitS = road ? road.length : seg.wasmS;
        }
      }

      console.info(
        `[RouteEdit] interpolate R${seg.roadId} L${seg.laneId}: s=${entryS.toFixed(1)}→${exitS.toFixed(1)}`,
      );

      const segment = interpolateRoadSegment(odrDoc, roadIdStr, seg.laneId, entryS, exitS);
      if (segment && segment.length >= 2) {
        const startIdx = allPoints.length > 0 ? 1 : 0;
        for (let j = startIdx; j < segment.length; j++) {
          allPoints.push(segment[j]);
        }
        prevWorldPt = allPoints[allPoints.length - 1];
      } else {
        // Fallback: use WASM world coordinates
        if (allPoints.length === 0) {
          allPoints.push({ x: seg.wx, y: seg.wy, z: seg.wz });
        }
        allPoints.push({ x: seg.wx, y: seg.wy, z: seg.wz });
        prevWorldPt = { x: seg.wx, y: seg.wy, z: seg.wz };
      }
    }

    console.info('[RouteEdit] densified cross-road path:', allPoints.length, 'points');
    return allPoints.length >= 2 ? allPoints : null;
  } catch (err) {
    console.warn('[RouteEdit] calculatePath failed:', err);
  }
  return null;
}

/**
 * Straight-line fallback between two world positions.
 */
function straightLine(from: WaypointWorldPos, to: WaypointWorldPos): Point3[] {
  return [
    { x: from.x, y: from.y, z: from.z },
    { x: to.x, y: to.y, z: to.z },
  ];
}

/**
 * Compute a single segment between two consecutive waypoints.
 * Priority: same-road JS interpolation → WASM cross-road path → straight line.
 */
async function computeSegment(
  fromPos: import('@osce/shared').Position,
  toPos: import('@osce/shared').Position,
  fromWorld: WaypointWorldPos,
  toWorld: WaypointWorldPos,
  odrDoc: OpenDriveDocument,
  rmClient: RoadManagerClient | null,
): Promise<Point3[]> {
  console.info('[RouteEdit] computeSegment:', {
    fromType: fromPos.type,
    toType: toPos.type,
    fromRoad: fromPos.type === 'lanePosition' ? fromPos.roadId : '?',
    toRoad: toPos.type === 'lanePosition' ? toPos.roadId : '?',
    sameRoad: fromPos.type === 'lanePosition' && toPos.type === 'lanePosition' && fromPos.roadId === toPos.roadId,
    hasRmClient: !!rmClient,
  });

  if (fromPos.type === 'lanePosition' && toPos.type === 'lanePosition') {
    if (fromPos.roadId === toPos.roadId) {
      // Same road: fast JS interpolation
      const points = interpolateRoadSegment(
        odrDoc,
        fromPos.roadId,
        parseInt(fromPos.laneId, 10),
        fromPos.s,
        toPos.s,
      );
      if (points) return points;
    } else if (rmClient) {
      // Different roads: WASM path calculation
      const points = await computeCrossRoadSegment(rmClient, fromPos, toPos, odrDoc);
      if (points) return points;
    } else {
      console.warn(
        '[RouteEdit] Cross-road segment but rmClient is null — falling back to straight line',
        { fromRoad: fromPos.roadId, toRoad: toPos.roadId },
      );
    }
  } else {
    console.warn('[RouteEdit] Non-lanePosition segment — straight line fallback', {
      fromType: fromPos.type,
      toType: toPos.type,
    });
  }

  return straightLine(fromWorld, toWorld);
}

/**
 * Compute road-following segments for all waypoint pairs.
 * Uses JS interpolation for same-road pairs and WASM path calculation for cross-road pairs.
 */
async function computeRoadFollowingSegmentsAsync(
  route: Route,
  positions: WaypointWorldPos[],
  odrDoc: OpenDriveDocument,
  rmClient: RoadManagerClient | null,
): Promise<Array<Point3[]>> {
  const segments: Array<Point3[]> = [];
  const wpCount = route.waypoints.length;

  for (let i = 0; i < wpCount - 1; i++) {
    const seg = await computeSegment(
      route.waypoints[i].position,
      route.waypoints[i + 1].position,
      positions[i],
      positions[i + 1],
      odrDoc,
      rmClient,
    );
    segments.push(seg);
  }

  // Closed route: last → first
  if (route.closed && wpCount >= 2) {
    const seg = await computeSegment(
      route.waypoints[wpCount - 1].position,
      route.waypoints[0].position,
      positions[wpCount - 1],
      positions[0],
      odrDoc,
      rmClient,
    );
    segments.push(seg);
  }

  return segments;
}

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
