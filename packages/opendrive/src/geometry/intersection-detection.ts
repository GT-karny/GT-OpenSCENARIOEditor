/**
 * Sampling-based road intersection (crossing) detection.
 *
 * Uses a spatial hash grid for efficient broad-phase,
 * then line-segment intersection for narrow-phase.
 */

import type { OdrRoad, OdrLaneSection } from '@osce/shared';
import { evaluateReferenceLineAtS } from './reference-line.js';
import { computeLaneOuterT } from './lane-boundary.js';

/**
 * Result of detecting an intersection between two roads.
 */
export interface IntersectionResult {
  /** First road ID. */
  roadIdA: string;
  /** Second road ID. */
  roadIdB: string;
  /** s-coordinate on road A where intersection occurs. */
  sA: number;
  /** s-coordinate on road B where intersection occurs. */
  sB: number;
  /** World-space intersection point. */
  point: { x: number; y: number };
  /** Intersection angle in radians (0 to PI). */
  angle: number;
}

interface SamplePoint {
  roadId: string;
  s: number;
  x: number;
  y: number;
  hdg: number;
  halfWidth: number;
}

interface SpatialCell {
  points: SamplePoint[];
}

/**
 * Compute the total road half-width (from center to outermost lane edge)
 * at a given s-coordinate.
 */
function computeRoadHalfWidth(road: OdrRoad, s: number): number {
  const section = findLaneSectionAtS(road.lanes, s);
  if (!section) return 3.5; // default single-lane width

  const dsFromSection = s - section.s;
  let maxLeft = 0;
  let maxRight = 0;

  if (section.leftLanes.length > 0) {
    const outermostLeft = section.leftLanes.reduce((prev, curr) =>
      curr.id > prev.id ? curr : prev,
    );
    maxLeft = Math.abs(computeLaneOuterT(section, outermostLeft, dsFromSection));
  }

  if (section.rightLanes.length > 0) {
    const outermostRight = section.rightLanes.reduce((prev, curr) =>
      curr.id < prev.id ? curr : prev,
    );
    maxRight = Math.abs(computeLaneOuterT(section, outermostRight, dsFromSection));
  }

  return Math.max(maxLeft, maxRight, 1.75); // minimum half-width of 1.75m
}

function findLaneSectionAtS(
  lanes: readonly OdrLaneSection[],
  s: number,
): OdrLaneSection | undefined {
  if (lanes.length === 0) return undefined;

  let result = lanes[0];
  for (const ls of lanes) {
    if (ls.s <= s) result = ls;
    else break;
  }
  return result;
}

/**
 * Sample a road into discrete points at a given interval.
 */
function sampleRoad(road: OdrRoad, interval: number): SamplePoint[] {
  const points: SamplePoint[] = [];
  const numSamples = Math.max(2, Math.ceil(road.length / interval) + 1);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.min(i * interval, road.length);
    const pose = evaluateReferenceLineAtS(road.planView, s);
    const halfWidth = computeRoadHalfWidth(road, s);

    points.push({
      roadId: road.id,
      s,
      x: pose.x,
      y: pose.y,
      hdg: pose.hdg,
      halfWidth,
    });
  }

  return points;
}

/**
 * Check if two line segments intersect, returning the intersection parameter.
 *
 * Segments: (p1 -> p2) and (p3 -> p4).
 * Returns { t, u } where t is the parameter on segment 1, u on segment 2.
 * Both in [0, 1] means intersection.
 */
function segmentIntersection(
  p1x: number, p1y: number, p2x: number, p2y: number,
  p3x: number, p3y: number, p4x: number, p4y: number,
): { t: number; u: number; x: number; y: number } | null {
  const d1x = p2x - p1x;
  const d1y = p2y - p1y;
  const d2x = p4x - p3x;
  const d2y = p4y - p3y;

  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-10) return null; // parallel

  const dx = p3x - p1x;
  const dy = p3y - p1y;

  const t = (dx * d2y - dy * d2x) / denom;
  const u = (dx * d1y - dy * d1x) / denom;

  if (t < 0 || t > 1 || u < 0 || u > 1) return null;

  return {
    t,
    u,
    x: p1x + t * d1x,
    y: p1y + t * d1y,
  };
}

/**
 * Check if two road segments (with width) intersect.
 * Tests the centerline plus offset lines (left edge, right edge).
 */
function checkBandIntersection(
  a1: SamplePoint, a2: SamplePoint,
  b1: SamplePoint, b2: SamplePoint,
): { sA: number; sB: number; x: number; y: number } | null {
  // Test centerline-to-centerline first
  const center = segmentIntersection(
    a1.x, a1.y, a2.x, a2.y,
    b1.x, b1.y, b2.x, b2.y,
  );

  if (center) {
    return {
      sA: a1.s + center.t * (a2.s - a1.s),
      sB: b1.s + center.u * (b2.s - b1.s),
      x: center.x,
      y: center.y,
    };
  }

  // Test edge lines if centerlines don't cross
  // Check if the bands overlap by testing edge-to-edge
  const avgWidthA = (a1.halfWidth + a2.halfWidth) / 2;
  const avgWidthB = (b1.halfWidth + b2.halfWidth) / 2;
  const avgHdgA = (a1.hdg + a2.hdg) / 2;
  const avgHdgB = (b1.hdg + b2.hdg) / 2;

  // Perpendicular offsets for road A edges
  const perpAx = -Math.sin(avgHdgA);
  const perpAy = Math.cos(avgHdgA);
  // Perpendicular offsets for road B edges
  const perpBx = -Math.sin(avgHdgB);
  const perpBy = Math.cos(avgHdgB);

  // Test left edge of A vs centerline of B
  const edgeTests = [
    // A left edge vs B centerline
    segmentIntersection(
      a1.x + perpAx * avgWidthA, a1.y + perpAy * avgWidthA,
      a2.x + perpAx * avgWidthA, a2.y + perpAy * avgWidthA,
      b1.x, b1.y, b2.x, b2.y,
    ),
    // A right edge vs B centerline
    segmentIntersection(
      a1.x - perpAx * avgWidthA, a1.y - perpAy * avgWidthA,
      a2.x - perpAx * avgWidthA, a2.y - perpAy * avgWidthA,
      b1.x, b1.y, b2.x, b2.y,
    ),
    // A centerline vs B left edge
    segmentIntersection(
      a1.x, a1.y, a2.x, a2.y,
      b1.x + perpBx * avgWidthB, b1.y + perpBy * avgWidthB,
      b2.x + perpBx * avgWidthB, b2.y + perpBy * avgWidthB,
    ),
    // A centerline vs B right edge
    segmentIntersection(
      a1.x, a1.y, a2.x, a2.y,
      b1.x - perpBx * avgWidthB, b1.y - perpBy * avgWidthB,
      b2.x - perpBx * avgWidthB, b2.y - perpBy * avgWidthB,
    ),
  ];

  for (const result of edgeTests) {
    if (result) {
      return {
        sA: a1.s + result.t * (a2.s - a1.s),
        sB: b1.s + result.u * (b2.s - b1.s),
        x: result.x,
        y: result.y,
      };
    }
  }

  return null;
}

/**
 * Normalize an angle to [-PI, PI).
 */
function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle <= -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * Detect intersections between roads using sampling and spatial hashing.
 *
 * @param roads Roads to check for intersections
 * @param options Configuration options
 * @returns List of detected intersections
 */
export function detectRoadIntersections(
  roads: readonly OdrRoad[],
  options?: {
    /** Sampling interval in meters (default: 2). */
    sampleInterval?: number;
    /** Spatial hash cell size in meters (default: 10). */
    cellSize?: number;
    /** Road IDs to exclude from detection (e.g., connecting roads). */
    excludeRoadIds?: Set<string>;
  },
): IntersectionResult[] {
  const sampleInterval = options?.sampleInterval ?? 2;
  const cellSize = options?.cellSize ?? 10;
  const excludeIds = options?.excludeRoadIds ?? new Set<string>();

  // Filter roads: exclude connecting roads (junction != '-1') and explicitly excluded
  const candidateRoads = roads.filter(
    (r) => r.junction === '-1' && !excludeIds.has(r.id),
  );

  if (candidateRoads.length < 2) return [];

  // Sample all roads
  const roadSamples = new Map<string, SamplePoint[]>();
  for (const road of candidateRoads) {
    roadSamples.set(road.id, sampleRoad(road, sampleInterval));
  }

  // Build spatial hash
  const grid = new Map<string, SpatialCell>();

  function cellKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  for (const [, samples] of roadSamples) {
    for (const pt of samples) {
      const cx = Math.floor(pt.x / cellSize);
      const cy = Math.floor(pt.y / cellSize);

      // Insert into the cell and its 8 neighbors for overlap safety
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = cellKey(cx + dx, cy + dy);
          let cell = grid.get(key);
          if (!cell) {
            cell = { points: [] };
            grid.set(key, cell);
          }
          cell.points.push(pt);
        }
      }
    }
  }

  // Find candidate road pairs from spatial hash
  const candidatePairs = new Set<string>();
  for (const [, cell] of grid) {
    const roadIdsInCell = new Set(cell.points.map((p) => p.roadId));
    const roadIdArray = [...roadIdsInCell];

    for (let i = 0; i < roadIdArray.length; i++) {
      for (let j = i + 1; j < roadIdArray.length; j++) {
        const pairKey =
          roadIdArray[i] < roadIdArray[j]
            ? `${roadIdArray[i]}|${roadIdArray[j]}`
            : `${roadIdArray[j]}|${roadIdArray[i]}`;
        candidatePairs.add(pairKey);
      }
    }
  }

  // Narrow-phase: check each candidate pair for actual intersections
  const results: IntersectionResult[] = [];
  const foundPairs = new Set<string>(); // Avoid duplicate detections

  for (const pairKey of candidatePairs) {
    if (foundPairs.has(pairKey)) continue;

    const [idA, idB] = pairKey.split('|');
    const samplesA = roadSamples.get(idA);
    const samplesB = roadSamples.get(idB);
    if (!samplesA || !samplesB) continue;

    // Check all segment pairs between the two roads
    for (let i = 0; i < samplesA.length - 1; i++) {
      for (let j = 0; j < samplesB.length - 1; j++) {
        const hit = checkBandIntersection(
          samplesA[i], samplesA[i + 1],
          samplesB[j], samplesB[j + 1],
        );

        if (hit) {
          // Compute intersection angle
          const poseA = evaluateReferenceLineAtS(
            roads.find((r) => r.id === idA)!.planView,
            hit.sA,
          );
          const poseB = evaluateReferenceLineAtS(
            roads.find((r) => r.id === idB)!.planView,
            hit.sB,
          );
          const angleDiff = Math.abs(normalizeAngle(poseA.hdg - poseB.hdg));
          const angle = angleDiff > Math.PI / 2 ? Math.PI - angleDiff : angleDiff;

          results.push({
            roadIdA: idA,
            roadIdB: idB,
            sA: hit.sA,
            sB: hit.sB,
            point: { x: hit.x, y: hit.y },
            angle,
          });
          foundPairs.add(pairKey);
          break; // One intersection per road pair is enough
        }
      }
      if (foundPairs.has(pairKey)) break;
    }
  }

  return results;
}

/**
 * Incrementally detect intersections for a set of changed roads.
 * Only checks the changed roads against all other roads, not all-vs-all.
 */
export function detectIntersectionsIncremental(
  roads: readonly OdrRoad[],
  changedRoadIds: Set<string>,
  options?: {
    sampleInterval?: number;
    cellSize?: number;
    excludeRoadIds?: Set<string>;
  },
): IntersectionResult[] {
  if (changedRoadIds.size === 0) return [];

  // Only test changed roads against all other non-excluded roads
  const excludeIds = options?.excludeRoadIds ?? new Set<string>();
  const candidateRoads = roads.filter(
    (r) => r.junction === '-1' && !excludeIds.has(r.id),
  );

  const changedRoads = candidateRoads.filter((r) => changedRoadIds.has(r.id));
  const otherRoads = candidateRoads.filter((r) => !changedRoadIds.has(r.id));

  if (changedRoads.length === 0) return [];

  const results: IntersectionResult[] = [];
  const sampleInterval = options?.sampleInterval ?? 2;

  // Check changed roads against each other
  if (changedRoads.length >= 2) {
    const subResults = detectRoadIntersections(changedRoads, options);
    results.push(...subResults);
  }

  // Check changed roads against unchanged roads
  for (const changed of changedRoads) {
    const changedSamples = sampleRoad(changed, sampleInterval);

    for (const other of otherRoads) {
      const otherSamples = sampleRoad(other, sampleInterval);

      for (let i = 0; i < changedSamples.length - 1; i++) {
        let found = false;
        for (let j = 0; j < otherSamples.length - 1; j++) {
          const hit = checkBandIntersection(
            changedSamples[i], changedSamples[i + 1],
            otherSamples[j], otherSamples[j + 1],
          );

          if (hit) {
            const poseA = evaluateReferenceLineAtS(changed.planView, hit.sA);
            const poseB = evaluateReferenceLineAtS(other.planView, hit.sB);
            const angleDiff = Math.abs(normalizeAngle(poseA.hdg - poseB.hdg));
            const angle = angleDiff > Math.PI / 2 ? Math.PI - angleDiff : angleDiff;

            results.push({
              roadIdA: changed.id,
              roadIdB: other.id,
              sA: hit.sA,
              sB: hit.sB,
              point: { x: hit.x, y: hit.y },
              angle,
            });
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }
  }

  return results;
}
