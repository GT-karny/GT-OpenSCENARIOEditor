/**
 * Junction surface mesh builder.
 * Computes a fill polygon for the junction area using a
 * "maximum-radius star polygon" approach:
 * 1. Collect ALL boundary points (left+right) from incoming roads
 *    at the junction edge and connecting roads along their length.
 * 2. Convert to polar coordinates from the centroid.
 * 3. Bin by angle into fixed-width bins, keeping only the farthest
 *    point per bin — this traces the outermost boundary at every angle.
 * 4. Fan-triangulate from centroid.
 *
 * Uses driving + border lanes (excludes sidewalk/curb/none).
 */
import type { OdrRoad, OdrJunction } from '@osce/shared';
import { evaluateReferenceLineAtS } from '../geometry/reference-line.js';
import { evaluateElevation } from '../geometry/elevation.js';
import { evaluateLaneOffset } from '../geometry/lane-offset.js';
import { computeLaneOuterT } from '../geometry/lane-boundary.js';
import { stToXyz } from '../geometry/lane-boundary.js';

export interface JunctionSurfaceData {
  junctionId: string;
  vertices: Float32Array;
  indices: Uint32Array;
}

interface Point3 {
  x: number;
  y: number;
  z: number;
}

/** Lane types that form the road surface (excludes sidewalk, curb, none). */
const SURFACE_LANE_TYPES = new Set([
  'driving', 'entry', 'exit', 'onRamp', 'offRamp',
  'connectingRamp', 'bidirectional', 'bus', 'taxi', 'hov',
  'stop', 'shoulder', 'border', 'restricted', 'parking',
  'median',
]);

/** Number of samples along each connecting road (including endpoints). */
const CONNECTING_SAMPLES = 10;

/** Number of fixed-width angular bins (360° / NUM_BINS = bin width). */
const NUM_BINS = 120; // 3-degree bins

/**
 * Build a surface mesh that fills the junction area.
 */
export function buildJunctionSurfaceMesh(
  junction: OdrJunction,
  roads: readonly OdrRoad[],
): JunctionSurfaceData | null {
  const roadMap = new Map(roads.map((r) => [r.id, r]));
  const candidates: Point3[] = [];

  // --- 1. Incoming road boundary points (both left and right) ---
  const visitedIncoming = new Set<string>();
  for (const conn of junction.connections) {
    if (visitedIncoming.has(conn.incomingRoad)) continue;
    visitedIncoming.add(conn.incomingRoad);

    const road = roadMap.get(conn.incomingRoad);
    if (!road || road.lanes.length === 0) continue;

    const s = getJunctionFacingS(road, junction.id);
    const bp = getBoundaryPair(road, s);
    if (bp) {
      candidates.push(bp.left);
      candidates.push(bp.right);
    }
  }

  if (candidates.length < 4) return null; // need ≥ 2 incoming roads

  // --- 2. Connecting road boundary points (both sides, dense sampling) ---
  const visitedConnecting = new Set<string>();
  for (const conn of junction.connections) {
    if (visitedConnecting.has(conn.connectingRoad)) continue;
    visitedConnecting.add(conn.connectingRoad);

    const road = roadMap.get(conn.connectingRoad);
    if (!road || road.lanes.length === 0) continue;

    for (let i = 0; i <= CONNECTING_SAMPLES; i++) {
      const s = (road.length * i) / CONNECTING_SAMPLES;
      const bp = getBoundaryPair(road, s);
      if (!bp) continue;
      // Add BOTH sides — the bin filter will keep only the farthest
      candidates.push(bp.left);
      candidates.push(bp.right);
    }
  }

  // --- 3. Compute centroid ---
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const p of candidates) {
    cx += p.x;
    cy += p.y;
    cz += p.z;
  }
  cx /= candidates.length;
  cy /= candidates.length;
  cz /= candidates.length;

  // --- 4. Fixed-width angular bins: keep farthest point per bin ---
  interface BinEntry {
    radius: number;
    point: Point3;
  }

  const bins: (BinEntry | null)[] = new Array(NUM_BINS).fill(null);

  for (const p of candidates) {
    const angle = Math.atan2(p.y - cy, p.x - cx); // [-π, π]
    const norm = (angle + Math.PI) / (2 * Math.PI); // [0, 1)
    const idx = Math.min(Math.floor(norm * NUM_BINS), NUM_BINS - 1);
    const radius = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);

    if (!bins[idx] || radius > bins[idx].radius) {
      bins[idx] = { radius, point: p };
    }
  }

  // Collect non-empty bins in angle order
  const points: Point3[] = [];
  for (let i = 0; i < NUM_BINS; i++) {
    const bin = bins[i];
    if (bin) points.push(bin.point);
  }

  if (points.length < 3) return null;

  // --- 5. Build vertices: centroid (index 0) + perimeter ---
  const vertCount = points.length + 1;
  const vertices = new Float32Array(vertCount * 3);
  vertices[0] = cx;
  vertices[1] = cy;
  vertices[2] = cz;

  for (let i = 0; i < points.length; i++) {
    vertices[(i + 1) * 3 + 0] = points[i].x;
    vertices[(i + 1) * 3 + 1] = points[i].y;
    vertices[(i + 1) * 3 + 2] = points[i].z;
  }

  // --- 6. Triangulate: fan from centroid ---
  const indices = new Uint32Array(points.length * 3);
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;
    indices[i * 3 + 0] = 0;
    indices[i * 3 + 1] = i + 1;
    indices[i * 3 + 2] = next + 1;
  }

  return { junctionId: junction.id, vertices, indices };
}

/**
 * Determine which s-coordinate of the road faces a junction.
 */
function getJunctionFacingS(road: OdrRoad, junctionId: string): number {
  const link = road.link;
  if (!link) return road.length;

  if (link.successor?.elementId === junctionId && link.successor.elementType === 'junction') {
    return road.length;
  }
  if (link.predecessor?.elementId === junctionId && link.predecessor.elementType === 'junction') {
    return 0;
  }

  return road.length;
}

/**
 * Get left and right outermost surface-lane boundary points at a given s.
 */
function getBoundaryPair(
  road: OdrRoad,
  s: number,
): { left: Point3; right: Point3 } | null {
  let section = road.lanes[0];
  for (const ls of road.lanes) {
    if (ls.s <= s + 1e-6) section = ls;
  }

  const dsFromSectionStart = s - section.s;
  const pose = evaluateReferenceLineAtS(road.planView, s);
  const z = evaluateElevation(road.elevationProfile, s);
  const offset = evaluateLaneOffset(road.laneOffset, s);

  let leftT = offset;
  for (const lane of section.leftLanes) {
    if (!SURFACE_LANE_TYPES.has(lane.type)) continue;
    const outerT = computeLaneOuterT(section, lane, dsFromSectionStart) + offset;
    if (outerT > leftT) leftT = outerT;
  }

  let rightT = offset;
  for (const lane of section.rightLanes) {
    if (!SURFACE_LANE_TYPES.has(lane.type)) continue;
    const outerT = computeLaneOuterT(section, lane, dsFromSectionStart) + offset;
    if (outerT < rightT) rightT = outerT;
  }

  return {
    left: stToXyz(pose, leftT, z),
    right: stToXyz(pose, rightT, z),
  };
}
