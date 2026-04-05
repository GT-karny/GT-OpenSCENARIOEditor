import type { Trajectory } from '@osce/shared';
import type { PointWorldPos } from '../stores/trajectory-edit-store';

interface Point3 {
  x: number;
  y: number;
  z: number;
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
  }
}

/**
 * Polyline: straight lines connecting vertex world positions.
 */
function computePolylinePoints(positions: PointWorldPos[]): Point3[] {
  return positions.map((p) => ({ x: p.x, y: p.y, z: p.z }));
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

  for (let sample = 0; sample <= numSamples; sample++) {
    const ds = (sample / numSamples) * L;

    if (ds < 1e-12) {
      points.push({ x: origin.x, y: origin.y, z: origin.z });
      continue;
    }

    // Simpson's rule for Fresnel-like integral
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

    const localU = (h / 3) * sumCos;
    const localV = (h / 3) * sumSin;

    // Rotate by origin heading and translate
    const cosH = Math.cos(origin.h);
    const sinH = Math.sin(origin.h);
    points.push({
      x: origin.x + localU * cosH - localV * sinH,
      y: origin.y + localU * sinH + localV * cosH,
      z: origin.z,
    });
  }

  return points;
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
