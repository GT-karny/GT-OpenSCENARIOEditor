/**
 * Elevation profile evaluator.
 * z(ds) = a + b*ds + c*ds^2 + d*ds^3
 */
import type { OdrElevation } from '@osce/shared';
import { evalCubic, findRecordAtS } from '../utils/math.js';

export function evaluateElevation(elevations: readonly OdrElevation[], s: number): number {
  if (elevations.length === 0) return 0;

  const elev = findRecordAtS(elevations, s, (e) => e.s);
  if (!elev) return 0;

  const ds = s - elev.s;
  return evalCubic(elev.a, elev.b, elev.c, elev.d, ds);
}

/**
 * Evaluate the elevation gradient (dz/ds) at a given s coordinate.
 * Returns the slope of the road at s (derivative of the cubic polynomial).
 */
export function evaluateElevationGradient(
  elevations: readonly OdrElevation[],
  s: number,
): number {
  if (elevations.length === 0) return 0;

  const elev = findRecordAtS(elevations, s, (e) => e.s);
  if (!elev) return 0;

  const ds = s - elev.s;
  // Derivative of a + b*ds + c*ds^2 + d*ds^3
  return elev.b + 2 * elev.c * ds + 3 * elev.d * ds * ds;
}
