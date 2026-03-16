/**
 * Junction creation plan validator.
 *
 * Validates a JunctionCreationPlan before execution to catch geometry errors,
 * topology issues, and connecting road problems that would produce invalid junctions.
 *
 * This is a non-destructive validation layer — it never modifies the document.
 */

import type { OdrRoad, OdrGeometry, OpenDriveDocument } from '@osce/shared';
import type { JunctionCreationPlan } from '../operations/junction-operations.js';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ValidationEntry {
  level: 'error' | 'warning';
  code: string;
  message: string;
}

export interface JunctionValidationResult {
  valid: boolean;
  warnings: ValidationEntry[];
  errors: ValidationEntry[];
}

// ---------------------------------------------------------------------------
// Geometry evaluation helpers
// ---------------------------------------------------------------------------

/**
 * Evaluate a single geometry element at a local arc-length offset.
 * Supports line, arc, and paramPoly3 types.
 */
function evaluateGeometryElement(
  geo: OdrGeometry,
  ds: number,
): { x: number; y: number; hdg: number } {
  const cosH = Math.cos(geo.hdg);
  const sinH = Math.sin(geo.hdg);

  if (geo.type === 'line') {
    return {
      x: geo.x + ds * cosH,
      y: geo.y + ds * sinH,
      hdg: geo.hdg,
    };
  }

  if (geo.type === 'arc' && geo.curvature !== undefined) {
    const k = geo.curvature;
    if (Math.abs(k) < 1e-12) {
      return { x: geo.x + ds * cosH, y: geo.y + ds * sinH, hdg: geo.hdg };
    }
    const r = 1 / k;
    const theta = ds * k;
    const cx = geo.x - r * sinH;
    const cy = geo.y + r * cosH;
    return {
      x: cx + r * Math.sin(geo.hdg + theta),
      y: cy - r * Math.cos(geo.hdg + theta),
      hdg: geo.hdg + theta,
    };
  }

  if (geo.type === 'paramPoly3') {
    const { aU = 0, bU = 0, cU = 0, dU = 0, aV = 0, bV = 0, cV = 0, dV = 0 } = geo;
    const len = geo.length;
    const p = geo.pRange === 'normalized' && len > 0 ? ds / len : ds;
    const localX = aU + p * (bU + p * (cU + p * dU));
    const localY = aV + p * (bV + p * (cV + p * dV));
    const rotX = localX * cosH - localY * sinH;
    const rotY = localX * sinH + localY * cosH;
    // Heading from derivative
    const duDp = bU + p * (2 * cU + 3 * dU * p);
    const dvDp = bV + p * (2 * cV + 3 * dV * p);
    const localHdg = Math.atan2(dvDp, duDp);
    return {
      x: geo.x + rotX,
      y: geo.y + rotY,
      hdg: geo.hdg + localHdg,
    };
  }

  // Fallback for unsupported types: straight line approximation
  return { x: geo.x + ds * cosH, y: geo.y + ds * sinH, hdg: geo.hdg };
}

/**
 * Evaluate a road's reference line at a given s-coordinate.
 */
function evaluateRoadAtS(
  planView: readonly OdrGeometry[],
  s: number,
): { x: number; y: number; hdg: number } {
  // Find the geometry element containing s
  let geo = planView[0];
  for (const g of planView) {
    if (g.s <= s) geo = g;
    else break;
  }
  if (!geo) return { x: 0, y: 0, hdg: 0 };
  return evaluateGeometryElement(geo, s - geo.s);
}

/**
 * Sample a road at regular intervals for overlap checking.
 */
function sampleRoad(
  road: OdrRoad,
  interval: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (let s = 0; s <= road.length; s += interval) {
    const pose = evaluateRoadAtS(road.planView, s);
    points.push({ x: pose.x, y: pose.y });
  }
  // Always include the endpoint
  if (road.length > 0) {
    const endPose = evaluateRoadAtS(road.planView, road.length);
    points.push({ x: endPose.x, y: endPose.y });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Individual validators
// ---------------------------------------------------------------------------

/**
 * Check that each connecting road's start/end positions match the expected
 * endpoint positions within tolerance.
 */
function validateConnectingRoadGeometry(
  connectingRoads: OdrRoad[],
  plan: JunctionCreationPlan,
): ValidationEntry[] {
  const entries: ValidationEntry[] = [];
  const POS_TOLERANCE = 1.0; // meters
  const HDG_TOLERANCE = Math.PI / 18; // 10 degrees

  for (const road of connectingRoads) {
    if (road.planView.length === 0) {
      entries.push({
        level: 'error',
        code: 'CONN_NO_GEOMETRY',
        message: `Connecting road ${road.id} has no geometry elements`,
      });
      continue;
    }

    // Verify geometry has non-zero length
    if (road.length < 0.01) {
      entries.push({
        level: 'error',
        code: 'CONN_ZERO_LENGTH',
        message: `Connecting road ${road.id} has near-zero length (${road.length.toFixed(3)}m)`,
      });
      continue;
    }

    // Check start position matches first geometry element
    const startGeo = road.planView[0];
    const startPose = evaluateGeometryElement(startGeo, 0);

    // Check end position: evaluate to the end of the road
    const endPose = evaluateRoadAtS(road.planView, road.length);

    // Verify the connecting road doesn't loop back on itself (self-intersection proxy)
    const dist = Math.sqrt(
      (endPose.x - startPose.x) ** 2 + (endPose.y - startPose.y) ** 2,
    );
    if (dist < 0.1 && road.length > 1) {
      entries.push({
        level: 'error',
        code: 'CONN_SELF_LOOP',
        message: `Connecting road ${road.id} loops back to its start (length=${road.length.toFixed(1)}m, endpoint distance=${dist.toFixed(2)}m)`,
      });
    }

    // Verify predecessor/successor road endpoint alignment
    if (road.link?.predecessor?.elementType === 'road') {
      const predRoadId = road.link.predecessor.elementId;
      const predContactPoint = road.link.predecessor.contactPoint;
      const predRoad = findRoadInPlan(predRoadId, plan);
      if (predRoad) {
        const predS = predContactPoint === 'start' ? 0 : predRoad.length;
        const predPose = evaluateRoadAtS(predRoad.planView, predS);
        const posError = Math.sqrt(
          (startPose.x - predPose.x) ** 2 + (startPose.y - predPose.y) ** 2,
        );
        if (posError > POS_TOLERANCE) {
          entries.push({
            level: 'warning',
            code: 'CONN_START_POS_MISMATCH',
            message: `Connecting road ${road.id} start position deviates ${posError.toFixed(2)}m from predecessor road ${predRoadId}`,
          });
        }

        // Heading check
        const expectedHdg = predContactPoint === 'end' ? predPose.hdg : predPose.hdg + Math.PI;
        const hdgError = Math.abs(normalizeAngle(startPose.hdg - expectedHdg));
        if (hdgError > HDG_TOLERANCE) {
          entries.push({
            level: 'warning',
            code: 'CONN_START_HDG_MISMATCH',
            message: `Connecting road ${road.id} start heading deviates ${(hdgError * 180 / Math.PI).toFixed(1)}° from predecessor road ${predRoadId}`,
          });
        }
      }
    }
  }

  return entries;
}

/**
 * Verify that the expected number of connecting roads was generated.
 * For an N-arm junction, we expect N*(N-1) directions minus same-road pairs.
 */
function validateConnectionCount(
  plan: JunctionCreationPlan,
): ValidationEntry[] {
  const entries: ValidationEntry[] = [];

  // Count distinct road arms
  const armIds = new Set(plan.incomingEndpoints.map((ep) => ep.roadId));
  const armCount = armIds.size;

  if (armCount < 2) {
    entries.push({
      level: 'error',
      code: 'INSUFFICIENT_ARMS',
      message: `Junction has only ${armCount} arm(s), need at least 2`,
    });
    return entries;
  }

  // Minimum expected connections: at least armCount connections
  // (each arm should connect to at least one other arm)
  const connectionCount = plan.junction.connections.length;
  if (connectionCount === 0) {
    entries.push({
      level: 'error',
      code: 'NO_CONNECTIONS',
      message: `Junction has ${armCount} arms but no connections were generated`,
    });
  } else if (connectionCount < armCount) {
    entries.push({
      level: 'warning',
      code: 'FEW_CONNECTIONS',
      message: `Junction has ${armCount} arms but only ${connectionCount} connections (expected at least ${armCount})`,
    });
  }

  return entries;
}

/**
 * Check that segment roads have valid geometry (non-zero length, valid planView).
 */
function validateSegments(
  plan: JunctionCreationPlan,
): ValidationEntry[] {
  const entries: ValidationEntry[] = [];

  for (const split of plan.roadSplits) {
    for (const [label, segment] of [
      ['before', split.beforeSegment],
      ['after', split.afterSegment],
    ] as const) {
      if (segment.length < 0.5) {
        entries.push({
          level: 'warning',
          code: 'SHORT_SEGMENT',
          message: `${label} segment of road ${split.originalRoadId} is very short (${segment.length.toFixed(2)}m)`,
        });
      }

      if (segment.planView.length === 0) {
        entries.push({
          level: 'error',
          code: 'SEGMENT_NO_GEOMETRY',
          message: `${label} segment of road ${split.originalRoadId} has no geometry`,
        });
      }

      if (segment.lanes.length === 0) {
        entries.push({
          level: 'error',
          code: 'SEGMENT_NO_LANES',
          message: `${label} segment of road ${split.originalRoadId} has no lane sections`,
        });
      }
    }
  }

  return entries;
}

/**
 * Check for connecting road overlaps using sampled point proximity.
 * Two connecting roads should not cross or run on top of each other.
 */
function validateNoConnectingRoadOverlap(
  connectingRoads: OdrRoad[],
): ValidationEntry[] {
  const entries: ValidationEntry[] = [];
  const SAMPLE_INTERVAL = 1.0; // meters
  const MIN_SEPARATION = 0.3; // meters — minimum distance between non-related connecting road centers

  if (connectingRoads.length < 2) return entries;

  // Sample all connecting roads
  const roadSamples = connectingRoads.map((road) => ({
    roadId: road.id,
    road,
    points: sampleRoad(road, SAMPLE_INTERVAL),
  }));

  // Check pairwise: do any two connecting roads with DIFFERENT incoming/outgoing
  // road combinations run too close together in the middle?
  for (let i = 0; i < roadSamples.length; i++) {
    for (let j = i + 1; j < roadSamples.length; j++) {
      const a = roadSamples[i];
      const b = roadSamples[j];

      // Skip overlap check for roads serving the same incoming road
      // (parallel lane connections are expected to be close)
      if (
        a.road.link?.predecessor?.elementId === b.road.link?.predecessor?.elementId &&
        a.road.link?.successor?.elementId === b.road.link?.successor?.elementId
      ) {
        continue;
      }

      // Check midpoints only (endpoints will naturally be close at junction)
      const aMid = a.points.slice(
        Math.floor(a.points.length * 0.25),
        Math.ceil(a.points.length * 0.75),
      );
      const bMid = b.points.slice(
        Math.floor(b.points.length * 0.25),
        Math.ceil(b.points.length * 0.75),
      );

      for (const pa of aMid) {
        for (const pb of bMid) {
          const dist = Math.sqrt((pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2);
          if (dist < MIN_SEPARATION) {
            entries.push({
              level: 'warning',
              code: 'CONN_ROAD_OVERLAP',
              message: `Connecting roads ${a.roadId} and ${b.roadId} are within ${dist.toFixed(2)}m at their midpoints`,
            });
            // Only report once per pair
            break;
          }
        }
        if (entries.length > 0 && entries[entries.length - 1].code === 'CONN_ROAD_OVERLAP') {
          break;
        }
      }
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a <= -Math.PI) a += 2 * Math.PI;
  return a;
}

/**
 * Find a road in the plan's segments or connecting roads.
 */
function findRoadInPlan(roadId: string, plan: JunctionCreationPlan): OdrRoad | undefined {
  for (const split of plan.roadSplits) {
    if (split.beforeSegment.id === roadId) return split.beforeSegment;
    if (split.afterSegment.id === roadId) return split.afterSegment;
  }
  return plan.connectingRoads.find((r) => r.id === roadId);
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * Validate a JunctionCreationPlan before execution.
 *
 * Returns a result with `valid=true` if no errors were found.
 * Warnings are informational and do not block execution.
 * Errors indicate the plan should NOT be executed.
 */
export function validateJunctionPlan(
  plan: JunctionCreationPlan,
  _doc: OpenDriveDocument,
): JunctionValidationResult {
  const allEntries: ValidationEntry[] = [
    ...validateSegments(plan),
    ...validateConnectionCount(plan),
    ...validateConnectingRoadGeometry(plan.connectingRoads, plan),
    ...validateNoConnectingRoadOverlap(plan.connectingRoads),
  ];

  const errors = allEntries.filter((e) => e.level === 'error');
  const warnings = allEntries.filter((e) => e.level === 'warning');

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
