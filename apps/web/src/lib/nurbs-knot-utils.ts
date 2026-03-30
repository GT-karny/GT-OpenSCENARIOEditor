/**
 * NURBS knot vector generation utilities.
 *
 * Two generation strategies:
 * 1. generateClampedUniformKnots — standard clamped B-spline (for auto-generation in store)
 * 2. generateKnots — bias/spread model (for slider UI)
 */

/**
 * Generate a standard clamped uniform knot vector.
 *
 *   [0, ..., 0, uniform_internal, ..., 1, ..., 1]
 *    ╰─order─╯                         ╰─order─╯
 *
 * Used by the trajectory store for default knot generation.
 */
export function generateClampedUniformKnots(
  controlPointCount: number,
  order: number,
): number[] {
  const totalKnots = controlPointCount + order;
  const internalCount = totalKnots - 2 * order;

  const knots: number[] = [];
  for (let i = 0; i < order; i++) knots.push(0);
  for (let i = 0; i < internalCount; i++) {
    knots.push(Math.round(((i + 1) / (internalCount + 1)) * 10000) / 10000);
  }
  for (let i = 0; i < order; i++) knots.push(1);

  return knots;
}

/**
 * Generate a knot vector using the bias/spread distribution model.
 *
 *   bias   (0–1): where the 0→1 transition center is (0.5 = middle)
 *   spread (0–1): how gradual the transition is (0 = sharp step, 1 = linear ramp)
 *
 * The knot values follow a piecewise linear function:
 *   - Below the transition zone: 0
 *   - In the transition zone: linear ramp from 0 to 1
 *   - Above the transition zone: 1
 *
 * Transition zone: [max(0, bias - spread/2), min(1, bias + spread/2)]
 *
 * Examples (6 knots):
 *   bias=0.0, spread=0 → [0, 1, 1, 1, 1, 1]
 *   bias=0.5, spread=0 → [0, 0, 0, 1, 1, 1]
 *   bias=1.0, spread=0 → [0, 0, 0, 0, 0, 1]
 *   bias=0.5, spread=1 → [0, 0.2, 0.4, 0.6, 0.8, 1]
 */
export function generateKnots(
  controlPointCount: number,
  order: number,
  bias: number,
  spread: number,
): number[] {
  const n = controlPointCount + order;
  if (n < 2) return [0];

  const lower = Math.max(0, bias - spread / 2);
  const upper = Math.min(1, bias + spread / 2);
  const range = upper - lower;

  const knots: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    let value: number;
    if (range < 1e-12) {
      // Sharp step
      value = t <= bias ? 0 : 1;
    } else if (t <= lower) {
      value = 0;
    } else if (t >= upper) {
      value = 1;
    } else {
      value = (t - lower) / range;
    }
    knots.push(Math.round(value * 10000) / 10000);
  }

  // Ensure endpoints
  knots[0] = 0;
  knots[n - 1] = 1;

  return knots;
}

/**
 * Try to recover bias/spread from an existing knot vector.
 * Returns null if the vector doesn't match the model.
 */
export function inferBiasSpread(
  knots: number[],
  controlPointCount: number,
  order: number,
): { bias: number; spread: number } | null {
  const n = controlPointCount + order;
  if (knots.length !== n || n < 2) return null;
  if (knots[0] !== 0 || knots[n - 1] !== 1) return null;

  // Check if it's a pure step (spread=0): all 0s then all 1s
  let firstOneIndex = -1;
  for (let i = 1; i < n; i++) {
    if (knots[i] > 0 && knots[i] < 1) {
      // Has intermediate values → not a pure step
      firstOneIndex = -1;
      break;
    }
    if (knots[i] === 1 && firstOneIndex === -1) {
      firstOneIndex = i;
    }
  }

  if (firstOneIndex !== -1) {
    // Pure step: bias is where the 0→1 boundary is
    // Boundary is between index (firstOneIndex-1) and firstOneIndex
    // Map to 0–1: bias = boundary midpoint in normalized space
    const bias = (firstOneIndex - 0.5) / (n - 1);
    return { bias: Math.max(0, Math.min(1, bias)), spread: 0 };
  }

  // Has intermediate values → try to find spread and bias
  // Find the transition zone boundaries
  let lowerIdx = 0;
  let upperIdx = n - 1;
  for (let i = 0; i < n; i++) {
    if (knots[i] > 0) { lowerIdx = i; break; }
  }
  for (let i = n - 1; i >= 0; i--) {
    if (knots[i] < 1) { upperIdx = i; break; }
  }

  const lower = lowerIdx / (n - 1);
  const upper = upperIdx / (n - 1);
  const bias = (lower + upper) / 2;
  const spread = upper - lower;

  if (spread < 0 || spread > 1) return null;

  // Verify round-trip
  const test = generateKnots(controlPointCount, order, bias, spread);
  const match = test.every((t, i) => Math.abs(t - knots[i]) < 1e-3);
  if (!match) return null;

  return { bias: Math.max(0, Math.min(1, bias)), spread: Math.max(0, Math.min(1, spread)) };
}
