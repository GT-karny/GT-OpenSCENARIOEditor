/**
 * Computes the driving direction heading for a vehicle on a specific lane.
 * Accounts for road rule (RHT/LHT) and lane side (left/right of center).
 */

import type { OdrRoad } from '@osce/shared';
import { evaluateReferenceLineAtS } from './reference-line.js';

/**
 * Normalize an angle to the range (-π, π].
 */
function normalizeAngle(angle: number): number {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a <= -Math.PI) a += 2 * Math.PI;
  return a;
}

/**
 * Compute the driving direction heading for a vehicle placed on a lane.
 *
 * In OpenDRIVE:
 * - Positive lane IDs = left of center line
 * - Negative lane IDs = right of center line
 * - RHT (Right-Hand Traffic): right lanes (negative IDs) travel with the reference line direction,
 *   left lanes (positive IDs) travel against the reference line direction.
 * - LHT (Left-Hand Traffic): left lanes (positive IDs) travel with the reference line direction,
 *   right lanes (negative IDs) travel against the reference line direction.
 *
 * @param road - The OpenDRIVE road
 * @param laneId - Lane ID (positive = left, negative = right, 0 = center)
 * @param s - S coordinate along the road
 * @param reverse - If true, flip the heading by π (reverse driving)
 * @returns Heading in radians
 */
export function computeDrivingHeading(
  road: OdrRoad,
  laneId: number,
  s: number,
  reverse = false,
): number {
  const pose = evaluateReferenceLineAtS(road.planView, s);
  const refHeading = pose.hdg;

  // Lane 0 (center) has no driving direction
  if (laneId === 0) return normalizeAngle(refHeading + (reverse ? Math.PI : 0));

  const isLeftLane = laneId > 0;
  const isRHT = road.rule !== 'LHT'; // Default to RHT if rule is undefined

  // In RHT: left lanes face against reference line (+π), right lanes face with (0)
  // In LHT: left lanes face with (0), right lanes face against (+π)
  // This is equivalent to: if (isLeftLane XOR isRHT) face against, else face with
  const needsFlip = isLeftLane === isRHT;
  const directionOffset = needsFlip ? Math.PI : 0;

  const heading = refHeading + directionOffset + (reverse ? Math.PI : 0);
  return normalizeAngle(heading);
}
