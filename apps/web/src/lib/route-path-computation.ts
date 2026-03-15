/**
 * Shared route path computation logic.
 *
 * Used by both the route editor (use-route-edit) and the route preview (use-route-preview)
 * to resolve waypoints to world coordinates and compute road-following path segments.
 */

import type { Route, OpenDriveDocument, LanePosition, Position } from '@osce/shared';
import { resolvePositionToWorld, roadCoordsToWorld } from '@osce/3d-viewer';
import { generateCurvatureAdaptiveSamples } from '@osce/opendrive';
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

/** Sample interval for cross-road WASM path calculation. */
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
    if (pathPoints.length < 2) return null;

    // Extract unique road sequence (collapse consecutive same-road points)
    const roadSeq: Array<{
      roadId: number;
      laneId: number;
      wasmS: number;
      wx: number;
      wy: number;
      wz: number;
    }> = [];
    for (const p of pathPoints) {
      if (roadSeq.length === 0 || roadSeq[roadSeq.length - 1].roadId !== p.road_id) {
        roadSeq.push({
          roadId: p.road_id,
          laneId: p.lane_id,
          wasmS: p.s,
          wx: p.x,
          wy: p.y,
          wz: p.z,
        });
      } else {
        const last = roadSeq[roadSeq.length - 1];
        last.wasmS = p.s;
        last.wx = p.x;
        last.wy = p.y;
        last.wz = p.z;
      }
    }

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
        entryS = parseFloat(String(from.s));
        // Use WASM-computed exit s value instead of assuming road.length.
        // For roads whose junction is at s=0 (predecessor=junction), the exit
        // is toward s=0, not road.length. seg.wasmS holds the last s value
        // esmini sampled on this road, which is the correct exit point.
        exitS = seg.wasmS;
        if (Math.abs(exitS - entryS) < 0.1) {
          const p = roadCoordsToWorld(odrDoc, roadIdStr, seg.laneId, entryS);
          if (p) {
            allPoints.push({ x: p.x, y: p.y, z: p.z });
            prevWorldPt = allPoints[allPoints.length - 1];
          }
          continue;
        }
      } else if (i === roadSeq.length - 1) {
        entryS = prevWorldPt
          ? determineEntryS(odrDoc, roadIdStr, seg.laneId, prevWorldPt)
          : 0;
        exitS = parseFloat(String(to.s));
      } else {
        if (prevWorldPt) {
          entryS = determineEntryS(odrDoc, roadIdStr, seg.laneId, prevWorldPt);
          exitS = road ? (entryS === 0 ? road.length : 0) : seg.wasmS;
        } else {
          entryS = 0;
          exitS = road ? road.length : seg.wasmS;
        }
      }

      const segment = interpolateRoadSegment(odrDoc, roadIdStr, seg.laneId, entryS, exitS);
      if (segment && segment.length >= 2) {
        const startIdx = allPoints.length > 0 ? 1 : 0;
        for (let j = startIdx; j < segment.length; j++) {
          allPoints.push(segment[j]);
        }
        prevWorldPt = allPoints[allPoints.length - 1];
      } else {
        if (allPoints.length === 0) {
          allPoints.push({ x: seg.wx, y: seg.wy, z: seg.wz });
        }
        allPoints.push({ x: seg.wx, y: seg.wy, z: seg.wz });
        prevWorldPt = { x: seg.wx, y: seg.wy, z: seg.wz };
      }
    }

    return allPoints.length >= 2 ? allPoints : null;
  } catch (err) {
    console.warn('[Route] calculatePath failed:', err);
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
  fromPos: Position,
  toPos: Position,
  fromWorld: WaypointWorldPos,
  toWorld: WaypointWorldPos,
  odrDoc: OpenDriveDocument,
  rmClient: RoadManagerClient | null,
): Promise<Point3[]> {
  if (fromPos.type === 'lanePosition' && toPos.type === 'lanePosition') {
    if (fromPos.roadId === toPos.roadId) {
      const points = interpolateRoadSegment(
        odrDoc,
        fromPos.roadId,
        parseInt(fromPos.laneId, 10),
        fromPos.s,
        toPos.s,
      );
      if (points) return points;
    } else if (rmClient) {
      const points = await computeCrossRoadSegment(rmClient, fromPos, toPos, odrDoc);
      if (points) return points;
    }
  }

  return straightLine(fromWorld, toWorld);
}

/**
 * Compute road-following segments for all waypoint pairs in a route.
 * Uses JS interpolation for same-road pairs and WASM path calculation for cross-road pairs.
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
