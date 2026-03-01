/**
 * Lane offset evaluator.
 * Computes the lateral shift of the lane reference line from the road reference line.
 * offset(ds) = a + b*ds + c*ds^2 + d*ds^3
 */
import type { OdrLaneOffset } from '@osce/shared';
import { evalCubic, findRecordAtS } from '../utils/math.js';

export function evaluateLaneOffset(laneOffsets: readonly OdrLaneOffset[], s: number): number {
  if (laneOffsets.length === 0) return 0;

  const record = findRecordAtS(laneOffsets, s, (lo) => lo.s);
  if (!record) return 0;

  const ds = s - record.s;
  return evalCubic(record.a, record.b, record.c, record.d, ds);
}
