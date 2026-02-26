/**
 * Superelevation (lateral profile / crossfall) evaluator.
 * Returns the roll angle in radians at the given s coordinate.
 * angle(ds) = a + b*ds + c*ds^2 + d*ds^3
 */
import type { OdrSuperelevation } from '@osce/shared';
import { evalCubic, findRecordAtS } from '../utils/math.js';

export function evaluateSuperelevation(
  superelevations: readonly OdrSuperelevation[],
  s: number,
): number {
  if (superelevations.length === 0) return 0;

  const se = findRecordAtS(superelevations, s, (e) => e.s);
  if (!se) return 0;

  const ds = s - se.s;
  return evalCubic(se.a, se.b, se.c, se.d, ds);
}
