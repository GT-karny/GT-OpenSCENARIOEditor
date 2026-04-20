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
  resolveRoute,
  type RouteSegment,
} from '@osce/opendrive';
import type { RoadManagerClient } from './wasm/road-manager-client';

export type Point3 = { x: number; y: number; z: number };

export interface WaypointWorldPos {
  x: number;
  y: number;
  z: number;
  h: number;
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

  const sValues = generateCurvatureAdaptiveSamples(road, sMin, sMax, ROUTE_SAMPLING);
  const points: Point3[] = [];

  for (const s of sValues) {
    const result = roadCoordsToWorld(odrDoc, roadId, laneId, s);
    if (result) {
      points.push({ x: result.x, y: result.y, z: result.z });
    }
  }

  if (sFrom > sTo && points.length >= 2) {
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
        const p = { x: anchor.x, y: anchor.y, z: anchor.z };
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
  return [
    { x: from.x, y: from.y, z: from.z },
    { x: to.x, y: to.y, z: to.z },
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
