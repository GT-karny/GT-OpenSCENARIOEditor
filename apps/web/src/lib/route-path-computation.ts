/**
 * Shared route path computation logic.
 *
 * Used by both the route editor (use-route-edit) and the route preview (use-route-preview)
 * to resolve waypoints to world coordinates and compute road-following path segments.
 *
 * Cross-road route resolution is done in pure JS via `resolveRoute` from
 * `@osce/opendrive`, which follows OpenDRIVE `<link>` / `<laneLink>` /
 * `<connection>` structures directly. WASM is kept only as a last-resort
 * fallback when link-based resolution fails.
 */

import type { Route, OpenDriveDocument, LanePosition, Position } from '@osce/shared';
import { resolvePositionToWorld, roadCoordsToWorld } from '@osce/3d-viewer';
import {
  generateCurvatureAdaptiveSamples,
  laneSpansAcrossSections,
  resolveRoute,
  computeDrivingHeading,
  type RouteSegment,
} from '@osce/opendrive';
import type { RoadManagerClient } from './wasm/road-manager-client';

/**
 * A point on a computed route path.
 *
 * `h` is the driving-direction heading in radians (NaN-safe: consumers should
 * treat `undefined` or non-finite values as "heading unknown"). Populated by
 * link-based interpolation; may be undefined on WASM fallback or straight-line
 * segments where heading cannot be derived from road geometry.
 */
export type Point3 = { x: number; y: number; z: number; h?: number };

export interface WaypointWorldPos {
  x: number;
  y: number;
  z: number;
  h: number;
}

/**
 * A lane change required along a lane-change-aware route, resolved to world
 * coordinates for visualization. `roadId`/`fromLane`/`toLane`/`s` come from the
 * GT_esmini router; `x`/`y`/`z` are the world position of `fromLane` at `s`.
 */
export interface LaneChangeMarker {
  x: number;
  y: number;
  z: number;
  roadId: string;
  fromLane: number;
  toLane: number;
  s: number;
}

/** Sampling options for same-road route segments (curvature-adaptive). */
const ROUTE_SAMPLING = { baseStep: 1.0, minStep: 0.3, maxStep: 3.0 };

/** Sample interval used when falling back to WASM path calculation. */
const CROSS_ROAD_SAMPLE_INTERVAL = 0.5;

/**
 * Resolve all waypoints in a route to world coordinates.
 */
export function resolveRouteWaypoints(
  route: Route,
  odrDoc: OpenDriveDocument,
): WaypointWorldPos[] {
  return route.waypoints.map((wp) => {
    const world = resolvePositionToWorld(wp.position, odrDoc);
    return world
      ? { x: world.x, y: world.y, z: world.z, h: world.h }
      : { x: 0, y: 0, z: 0, h: 0 };
  });
}

/**
 * Interpolate points along a road lane between two s values using JS geometry.
 * Uses curvature-adaptive sampling for smooth lines on curves.
 *
 * `laneId` is the lane at `sFrom`. Spans that cross internal lane-section
 * boundaries follow `<lane><link>` so the physically continuous lane is tracked
 * even when lane IDs shift mid-road (e.g. a lane is added/dropped internally),
 * instead of sticking to the same numeric ID in each section.
 */
export function interpolateRoadSegment(
  odrDoc: OpenDriveDocument,
  roadId: string,
  laneId: number,
  sFrom: number,
  sTo: number,
): Point3[] | null {
  const sMin = Math.min(sFrom, sTo);
  const sMax = Math.max(sFrom, sTo);
  if (sMax - sMin < 0.01) return null;

  const road = odrDoc.roads.find((r) => r.id === roadId);
  if (!road) return null;

  const reverse = sFrom > sTo;
  // Split at lane-section boundaries, remapping laneId via <lane><link>. The
  // input laneId is valid at sFrom, so anchor to the high end when reversed.
  const spans = laneSpansAcrossSections(road, laneId, sMin, sMax, reverse ? 'high' : 'low');

  // Sample each sub-span with its own laneId; concatenate in increasing-s order,
  // dropping the duplicate point shared at each section boundary.
  const points: Point3[] = [];
  for (const span of spans) {
    if (span.sEnd - span.sStart < 1e-6) continue;
    const sValues = generateCurvatureAdaptiveSamples(road, span.sStart, span.sEnd, ROUTE_SAMPLING);
    const dropFirst = points.length > 0;
    for (let i = 0; i < sValues.length; i++) {
      if (i === 0 && dropFirst) continue;
      const s = sValues[i];
      const result = roadCoordsToWorld(odrDoc, roadId, span.laneId, s);
      if (!result) continue;
      const h = computeDrivingHeading(road, span.laneId, s, reverse);
      points.push({ x: result.x, y: result.y, z: result.z, h });
    }
  }

  if (reverse && points.length >= 2) {
    points.reverse();
  }

  return points.length >= 2 ? points : null;
}

/**
 * Walk a resolved RouteSegment list and produce a concatenated world-space
 * polyline by interpolating each segment individually. The first point of
 * each segment (except segment 0) is dropped to avoid duplication at road
 * boundaries.
 */
function interpolateRouteSegments(
  odrDoc: OpenDriveDocument,
  segments: RouteSegment[],
): Point3[] | null {
  const out: Point3[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const pts = interpolateRoadSegment(
      odrDoc,
      seg.roadId,
      seg.laneId,
      seg.entryS,
      seg.exitS,
    );
    if (!pts || pts.length < 2) {
      // Zero-length segment (entryS ≈ exitS). Emit a single anchor point via
      // roadCoordsToWorld so the chain stays continuous.
      const anchor = roadCoordsToWorld(odrDoc, seg.roadId, seg.laneId, seg.entryS);
      if (anchor) {
        const road = odrDoc.roads.find((r) => r.id === seg.roadId);
        const h = road ? computeDrivingHeading(road, seg.laneId, seg.entryS) : undefined;
        const p: Point3 = { x: anchor.x, y: anchor.y, z: anchor.z, h };
        if (out.length === 0) out.push(p);
        else if (
          out[out.length - 1].x !== p.x ||
          out[out.length - 1].y !== p.y ||
          out[out.length - 1].z !== p.z
        ) {
          out.push(p);
        }
      }
      continue;
    }
    const startIdx = out.length === 0 ? 0 : 1;
    for (let j = startIdx; j < pts.length; j++) out.push(pts[j]);
  }
  return out.length >= 2 ? out : null;
}

/**
 * WASM fallback: compute a cross-road segment via esmini's path calculator.
 * Used only when link-based resolution returns null (e.g. incomplete xodr
 * link data, or disconnected network where esmini may still find a path via
 * geometric adjacency).
 */
async function computeCrossRoadSegmentViaWasm(
  rmClient: RoadManagerClient,
  from: LanePosition,
  to: LanePosition,
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
    if (pathPoints.length < 2) return null;
    return pathPoints.map((p) => ({ x: p.x, y: p.y, z: p.z }));
  } catch (err) {
    console.warn('[Route] calculatePath fallback failed:', err);
    return null;
  }
}

/**
 * Straight-line fallback between two world positions.
 */
function straightLine(from: WaypointWorldPos, to: WaypointWorldPos): Point3[] {
  // Derive heading from the segment direction; fall back to waypoint headings
  // if the two points coincide.
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const segH = dx === 0 && dy === 0 ? from.h : Math.atan2(dy, dx);
  return [
    { x: from.x, y: from.y, z: from.z, h: segH },
    { x: to.x, y: to.y, z: to.z, h: segH },
  ];
}

/**
 * Compute a single segment between two consecutive waypoints.
 * Priority:
 *   1. Same-road JS interpolation
 *   2. Link-based pure-JS resolveRoute + interpolation (spec-compliant)
 *   3. WASM esmini calculatePath (fallback for incomplete link data)
 *   4. Straight line (last resort)
 */
async function computeSegment(
  fromPos: Position,
  toPos: Position,
  fromWorld: WaypointWorldPos,
  toWorld: WaypointWorldPos,
  odrDoc: OpenDriveDocument,
  rmClient: RoadManagerClient | null,
): Promise<Point3[]> {
  if (fromPos.type === 'lanePosition' && toPos.type === 'lanePosition') {
    // (1) Same road, same lane — direct interpolation
    if (
      fromPos.roadId === toPos.roadId &&
      parseInt(fromPos.laneId, 10) === parseInt(toPos.laneId, 10)
    ) {
      const points = interpolateRoadSegment(
        odrDoc,
        fromPos.roadId,
        parseInt(fromPos.laneId, 10),
        fromPos.s,
        toPos.s,
      );
      if (points) return points;
    }

    // (2) Link-based resolution
    const resolved = resolveRoute(odrDoc, fromPos, toPos);
    if (resolved) {
      const pts = interpolateRouteSegments(odrDoc, resolved);
      if (pts) return pts;
    }

    // (3) WASM fallback
    if (rmClient) {
      const wasmPts = await computeCrossRoadSegmentViaWasm(rmClient, fromPos, toPos);
      if (wasmPts) return wasmPts;
    }
  }

  // (4) Straight line
  return straightLine(fromWorld, toWorld);
}

/**
 * Compute road-following segments for all waypoint pairs in a route.
 */
export async function computeRoadFollowingSegmentsAsync(
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

// ---------------------------------------------------------------------------
// Lane-change-aware route computation (GT_esmini LaneIndependentRouter)
// ---------------------------------------------------------------------------

/**
 * Compute a single lane-change-aware segment between two lane positions via the
 * GT_esmini router. Returns the route polyline plus the lane changes required
 * along it (resolved to world coordinates). Falls back to a straight line when
 * the router finds no path or either endpoint is not a lane position.
 */
async function computeLaneChangeAwareSegment(
  fromPos: Position,
  toPos: Position,
  fromWorld: WaypointWorldPos,
  toWorld: WaypointWorldPos,
  odrDoc: OpenDriveDocument,
  rmClient: RoadManagerClient,
  strategy: number,
): Promise<{ points: Point3[]; markers: LaneChangeMarker[] }> {
  if (fromPos.type === 'lanePosition' && toPos.type === 'lanePosition') {
    try {
      const result = await rmClient.calculateRoute(
        parseInt(fromPos.roadId, 10),
        parseInt(fromPos.laneId, 10),
        fromPos.s,
        parseInt(toPos.roadId, 10),
        parseInt(toPos.laneId, 10),
        toPos.s,
        strategy,
      );
      if (result.found && result.waypoints.length >= 2) {
        const points: Point3[] = result.waypoints.map((p) => ({
          x: p.x,
          y: p.y,
          z: p.z,
          h: p.h,
        }));
        const markers: LaneChangeMarker[] = [];
        for (const lc of result.laneChanges) {
          const roadId = String(lc.road_id);
          const world = roadCoordsToWorld(odrDoc, roadId, lc.from_lane, lc.s);
          if (!world) continue;
          markers.push({
            x: world.x,
            y: world.y,
            z: world.z,
            roadId,
            fromLane: lc.from_lane,
            toLane: lc.to_lane,
            s: lc.s,
          });
        }
        return { points, markers };
      }
    } catch (err) {
      console.warn('[Route] calculateRoute (lane-change-aware) failed:', err);
    }
  }

  // Fallback: straight line, no lane changes
  return { points: straightLine(fromWorld, toWorld), markers: [] };
}

/**
 * Compute lane-change-aware road-following segments for all waypoint pairs.
 * Mirrors {@link computeRoadFollowingSegmentsAsync} but uses the GT_esmini
 * router so the path may change lanes mid-road; also returns the lane-change
 * markers collected across all segments.
 */
export async function computeLaneChangeAwareSegmentsAsync(
  route: Route,
  positions: WaypointWorldPos[],
  odrDoc: OpenDriveDocument,
  rmClient: RoadManagerClient,
  strategy: number,
): Promise<{ segments: Array<Point3[]>; markers: LaneChangeMarker[] }> {
  const segments: Array<Point3[]> = [];
  const markers: LaneChangeMarker[] = [];
  const wpCount = route.waypoints.length;

  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < wpCount - 1; i++) pairs.push([i, i + 1]);
  if (route.closed && wpCount >= 2) pairs.push([wpCount - 1, 0]);

  for (const [a, b] of pairs) {
    const { points, markers: segMarkers } = await computeLaneChangeAwareSegment(
      route.waypoints[a].position,
      route.waypoints[b].position,
      positions[a],
      positions[b],
      odrDoc,
      rmClient,
      strategy,
    );
    segments.push(points);
    markers.push(...segMarkers);
  }

  return { segments, markers };
}
