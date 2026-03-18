/**
 * Signal placement snap utilities.
 * Compute t-offset and heading for signal placement on a road.
 */

import type { OdrRoad, OdrLaneSection } from '@osce/shared';
import { evaluateReferenceLineAtS } from './reference-line.js';
import { computeLaneWidth, computeLaneOuterT } from './lane-boundary.js';
import { evaluateLaneOffset } from './lane-offset.js';
import { findRecordAtS } from '../utils/math.js';

/**
 * Compute the t-value for signal placement based on snap mode.
 *
 * @param road - The road to place the signal on
 * @param s - The s-coordinate along the road
 * @param mode - Snap mode: 'lane-above' centers above outermost lane, 'road-edge' places outside
 * @param side - Which side of the road: 'right' (t < 0) or 'left' (t > 0)
 * @returns The t-offset for signal placement
 */
export function computeSignalSnapT(
  road: OdrRoad,
  s: number,
  mode: 'lane-above' | 'road-edge',
  side: 'right' | 'left',
): number {
  const section = findRecordAtS(road.lanes, s, (ls) => ls.s) as OdrLaneSection | undefined;
  if (!section) return 0;

  const ds = s - section.s;
  const laneOff = evaluateLaneOffset(road.laneOffset, s);
  const lanes = side === 'right' ? section.rightLanes : section.leftLanes;

  if (lanes.length === 0) return laneOff;

  // Outermost lane is the one with the largest absolute ID
  const outerLane =
    side === 'right'
      ? [...lanes].sort((a, b) => a.id - b.id)[0] // most negative
      : [...lanes].sort((a, b) => b.id - a.id)[0]; // most positive

  if (!outerLane) return laneOff;

  const outerT = computeLaneOuterT(section, outerLane, ds) + laneOff;

  if (mode === 'lane-above') {
    // Center of the outermost lane
    const width = computeLaneWidth(outerLane, ds);
    const sign = side === 'right' ? 1 : -1; // move inward (toward center)
    return outerT + sign * (width / 2);
  } else {
    // Road edge + 0.5m offset outward
    const sign = side === 'right' ? -1 : 1; // move outward (away from center)
    return outerT + sign * 0.5;
  }
}

/**
 * Compute signal heading from the road reference line direction at s.
 * Returns the heading in radians (OpenDRIVE hOffset convention).
 *
 * @param road - The road
 * @param s - The s-coordinate
 * @param facingTraffic - If true, signal faces oncoming traffic (opposite to road direction)
 */
export function computeSignalHeading(
  road: OdrRoad,
  s: number,
  facingTraffic = true,
): number {
  const pose = evaluateReferenceLineAtS(road.planView, s);
  if (facingTraffic) {
    // Face opposite to road direction (toward oncoming traffic)
    return pose.hdg + Math.PI;
  }
  return pose.hdg;
}
