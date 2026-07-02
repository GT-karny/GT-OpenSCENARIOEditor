import type { Trajectory, ClothoidSplineSegment } from '@osce/shared';
import type { PointWorldPos } from '../stores/trajectory-edit-store';

interface Point3 {
  x: number;
  y: number;
  z: number;
}

/** Local pose accumulated while integrating a clothoid segment chain. */
interface LocalPose {
  x: number;
  y: number;
  z: number;
  /** Heading in radians */
  h: number;
}

/**
 * Compute curve sample points for 3D rendering based on trajectory shape type.
 */
export function computeTrajectoryVisualPoints(
  trajectory: Trajectory,
  pointWorldPositions: PointWorldPos[],
): Point3[] {
  switch (trajectory.shape.type) {
    case 'polyline':
      return computePolylinePoints(pointWorldPositions);
    case 'clothoid':
      return computeClothoidPoints(trajectory.shape, pointWorldPositions);
    case 'nurbs':
      return computeNurbsPoints(trajectory.shape, pointWorldPositions);
    case 'clothoidSpline':
      return computeClothoidSplinePoints(trajectory.shape, pointWorldPositions);
  }
}

/**
 * Polyline: straight lines connecting vertex world positions.
 */
function computePolylinePoints(positions: PointWorldPos[]): Point3[] {
  return positions.map((p) => ({ x: p.x, y: p.y, z: p.z }));
}

/**
 * Integrate the local displacement of a clothoid arc of length `ds` whose
 * curvature varies linearly from `k0` at the arc start: k(t) = k0 + dk * t.
 * Returns the offset (u, v) in the arc-start local frame (start heading = 0)
 * together with the heading turned over the arc. Uses Simpson's rule for the
 * Fresnel-like integral (same integrator as the standalone clothoid shape and
 * packages/opendrive/src/geometry/spiral.ts).
 */
function integrateClothoidLocal(
  k0: number,
  dk: number,
  ds: number,
): { u: number; v: number; dh: number } {
  if (ds < 1e-12) return { u: 0, v: 0, dh: 0 };

  const rawN = Math.max(8, Math.ceil(ds / 0.5));
  const n = rawN % 2 === 1 ? rawN + 1 : rawN;
  const h = ds / n;

  let sumCos = 0;
  let sumSin = 0;
  for (let i = 0; i <= n; i++) {
    const t = i * h;
    const theta = k0 * t + 0.5 * dk * t * t;
    const w = i === 0 || i === n ? 1 : i % 2 === 1 ? 4 : 2;
    sumCos += w * Math.cos(theta);
    sumSin += w * Math.sin(theta);
  }

  return {
    u: (h / 3) * sumCos,
    v: (h / 3) * sumSin,
    dh: k0 * ds + 0.5 * dk * ds * ds,
  };
}

/**
 * Clothoid (Euler spiral) via Simpson's rule numerical integration.
 * Curvature varies linearly: k(s) = curvature + curvatureDot * s
 * Based on packages/opendrive/src/geometry/spiral.ts.
 */
function computeClothoidPoints(
  shape: Extract<Trajectory['shape'], { type: 'clothoid' }>,
  positions: PointWorldPos[],
): Point3[] {
  if (positions.length === 0 || shape.length <= 0) return [];

  const origin = positions[0];
  const k0 = shape.curvature;
  const dk = shape.curvatureDot;
  const L = shape.length;
  const numSamples = 100;
  const points: Point3[] = [];

  const cosH = Math.cos(origin.h);
  const sinH = Math.sin(origin.h);

  for (let sample = 0; sample <= numSamples; sample++) {
    const ds = (sample / numSamples) * L;
    const { u, v } = integrateClothoidLocal(k0, dk, ds);

    // Rotate by origin heading and translate
    points.push({
      x: origin.x + u * cosH - v * sinH,
      y: origin.y + u * sinH + v * cosH,
      z: origin.z,
    });
  }

  return points;
}

/**
 * ClothoidSpline (OpenSCENARIO v1.3 ClothoidSpline): a chain of clothoid
 * segments where curvature varies linearly from `curvatureStart` to
 * `curvatureEnd` across each segment's `length`.
 *
 * The chain is C0- and heading-continuous: the end pose of segment N is the
 * start pose of segment N+1, unless the next segment provides an explicit
 * `positionStart` (resolved to world coords upstream and supplied here via
 * `segmentStartPositions`), which overrides the accumulated pose. `hOffset`
 * rotates the segment's local frame by an additional heading offset.
 *
 * @param positions - Resolved world poses for segments that declare a
 *   `positionStart`, index-aligned with `shape.segments`. Segments without an
 *   explicit start map to `null` (they chain from the previous segment end).
 */
function computeClothoidSplinePoints(
  shape: Extract<Trajectory['shape'], { type: 'clothoidSpline' }>,
  positions: PointWorldPos[],
): Point3[] {
  const segments = shape.segments;
  if (segments.length === 0) return [];

  const points: Point3[] = [];
  // Running pose in world coordinates (start of the current segment).
  let pose: LocalPose | null = null;
  const SAMPLES_PER_SEGMENT = 40;

  for (let segIdx = 0; segIdx < segments.length; segIdx++) {
    const segment = segments[segIdx];
    const startPose = resolveSegmentStartPose(segment, positions[segIdx], pose);
    if (!startPose) return points; // cannot anchor the chain — stop

    // Base heading for this segment (chain heading + optional hOffset).
    const baseH = startPose.h + (segment.hOffset ?? 0);
    const cosH = Math.cos(baseH);
    const sinH = Math.sin(baseH);

    const k0 = segment.curvatureStart;
    // Linear curvature ramp across the segment length.
    const dk = segment.length > 1e-9 ? (segment.curvatureEnd - k0) / segment.length : 0;

    // Sample the segment. Skip the first sample on chained segments to avoid a
    // duplicate vertex at the shared junction.
    const startSample = segIdx === 0 ? 0 : 1;
    for (let sample = startSample; sample <= SAMPLES_PER_SEGMENT; sample++) {
      const ds = (sample / SAMPLES_PER_SEGMENT) * segment.length;
      const { u, v } = integrateClothoidLocal(k0, dk, ds);
      points.push({
        x: startPose.x + u * cosH - v * sinH,
        y: startPose.y + u * sinH + v * cosH,
        z: startPose.z,
      });
    }

    // Advance the running pose to this segment's end for the next segment.
    // Preserve z across the chain (segments carry no elevation of their own).
    const end = integrateClothoidLocal(k0, dk, segment.length);
    pose = {
      x: startPose.x + end.u * cosH - end.v * sinH,
      y: startPose.y + end.u * sinH + end.v * cosH,
      z: startPose.z,
      h: baseH + end.dh,
    };
  }

  return points;
}

/**
 * Resolve the world start pose of a clothoid-spline segment: prefer the
 * segment's explicit resolved `positionStart`, otherwise chain from the
 * previous segment's end pose. Returns null only for the first segment when it
 * has no resolvable start.
 */
function resolveSegmentStartPose(
  segment: ClothoidSplineSegment,
  resolved: PointWorldPos | null | undefined,
  chained: LocalPose | null,
): LocalPose | null {
  if (segment.positionStart && resolved) {
    return { x: resolved.x, y: resolved.y, z: resolved.z, h: resolved.h };
  }
  return chained;
}

/**
 * NURBS: Rational B-spline curve evaluation via De Boor's algorithm.
 * Evaluates the curve at numSamples+1 evenly spaced parameter values.
 */
function computeNurbsPoints(
  shape: Extract<Trajectory['shape'], { type: 'nurbs' }>,
  positions: PointWorldPos[],
): Point3[] {
  if (positions.length < 2 || shape.knots.length === 0) {
    return positions.map((p) => ({ x: p.x, y: p.y, z: p.z }));
  }

  const degree = shape.order - 1;
  const n = positions.length;
  const knots = shape.knots;

  // Validate knot vector length
  if (knots.length !== n + shape.order) {
    // Invalid knot vector — fall back to polyline
    return positions.map((p) => ({ x: p.x, y: p.y, z: p.z }));
  }

  // Weights (default 1.0)
  const weights = shape.controlPoints.map((cp) => cp.weight ?? 1.0);

  // Parameter range: [knots[degree], knots[n])
  const uMin = knots[degree];
  const uMax = knots[n];
  if (uMax <= uMin) {
    return positions.map((p) => ({ x: p.x, y: p.y, z: p.z }));
  }

  const numSamples = 100;
  const points: Point3[] = [];

  for (let sample = 0; sample <= numSamples; sample++) {
    const u = uMin + (sample / numSamples) * (uMax - uMin);
    const pt = evaluateNurbs(u, degree, knots, positions, weights);
    points.push(pt);
  }

  return points;
}

/**
 * Evaluate a NURBS curve at parameter u using De Boor's algorithm.
 * Uses homogeneous coordinates for rational curves.
 */
function evaluateNurbs(
  u: number,
  degree: number,
  knots: number[],
  controlPoints: PointWorldPos[],
  weights: number[],
): Point3 {
  const n = controlPoints.length;

  // Find knot span: the index k such that knots[k] <= u < knots[k+1]
  let k = degree;
  for (let i = degree; i < n; i++) {
    if (u >= knots[i] && u < knots[i + 1]) {
      k = i;
      break;
    }
  }
  // Clamp to last valid span for u == uMax
  if (u >= knots[n]) k = n - 1;

  // Initialize homogeneous control points for the affected span
  const d: Array<{ wx: number; wy: number; wz: number; w: number }> = [];
  for (let j = 0; j <= degree; j++) {
    const idx = k - degree + j;
    const w = weights[idx];
    d.push({
      wx: controlPoints[idx].x * w,
      wy: controlPoints[idx].y * w,
      wz: controlPoints[idx].z * w,
      w,
    });
  }

  // De Boor recursion
  for (let r = 1; r <= degree; r++) {
    for (let j = degree; j >= r; j--) {
      const i = k - degree + j;
      const denom = knots[i + degree - r + 1] - knots[i];
      if (Math.abs(denom) < 1e-12) continue;
      const alpha = (u - knots[i]) / denom;
      d[j] = {
        wx: (1 - alpha) * d[j - 1].wx + alpha * d[j].wx,
        wy: (1 - alpha) * d[j - 1].wy + alpha * d[j].wy,
        wz: (1 - alpha) * d[j - 1].wz + alpha * d[j].wz,
        w: (1 - alpha) * d[j - 1].w + alpha * d[j].w,
      };
    }
  }

  const result = d[degree];
  const invW = result.w > 1e-12 ? 1 / result.w : 0;
  return {
    x: result.wx * invW,
    y: result.wy * invW,
    z: result.wz * invW,
  };
}
