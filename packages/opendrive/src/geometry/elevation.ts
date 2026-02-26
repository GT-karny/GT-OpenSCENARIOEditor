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
