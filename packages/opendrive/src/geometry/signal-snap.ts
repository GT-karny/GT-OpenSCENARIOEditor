/**
 * Signal placement snap utilities.
 * Compute t-offset and heading for signal placement on a road.
 */

import type { OdrRoad, OdrLane, OdrLaneSection } from '@osce/shared';
import { evaluateReferenceLineAtS } from './reference-line.js';
import { computeLaneWidth, computeLaneOuterT, computeLaneInnerT } from './lane-boundary.js';
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
 * Lane types that indicate "outside the roadway" — pole placement candidates.
 * Ordered by preference: sidewalk is best, then shoulder, curb, border, etc.
 */
const POLE_LANE_TYPES = ['sidewalk', 'shoulder', 'curb', 'border', 'parking', 'biking', 'median'];

/**
 * Compute the t-value for pole placement at the road's outermost non-driving area.
 *
 * Priority: sidewalk lane center > shoulder center > other non-driving > road edge + offset.
 *
 * @param road - The road to place the pole on
 * @param s - The s-coordinate along the road
 * @param side - Which side of the road: 'right' (t < 0) or 'left' (t > 0)
 * @returns The t-offset for the pole base
 */
export function computePolePlacementT(
  road: OdrRoad,
  s: number,
  side: 'right' | 'left',
): number {
  const section = findRecordAtS(road.lanes, s, (ls) => ls.s) as OdrLaneSection | undefined;
  if (!section) return 0;

  const ds = s - section.s;
  const laneOff = evaluateLaneOffset(road.laneOffset, s);
  const lanes = side === 'right' ? section.rightLanes : section.leftLanes;

  if (lanes.length === 0) return laneOff;

  // Sort lanes from innermost (closest to center) to outermost
  const sorted =
    side === 'right'
      ? [...lanes].sort((a, b) => b.id - a.id) // -1, -2, -3... (right: more negative = outer)
      : [...lanes].sort((a, b) => a.id - b.id); // 1, 2, 3... (left: more positive = outer)

  // Find the best pole candidate lane (outermost non-driving lane by type priority)
  let bestLane: typeof sorted[0] | null = null;
  let bestPriority = POLE_LANE_TYPES.length + 1;

  for (const lane of sorted) {
    const priority = POLE_LANE_TYPES.indexOf(lane.type);
    if (priority >= 0 && priority < bestPriority) {
      bestLane = lane;
      bestPriority = priority;
    }
  }

  if (bestLane) {
    // Place pole at the center of the best non-driving lane
    const outerT = computeLaneOuterT(section, bestLane, ds) + laneOff;
    const width = computeLaneWidth(bestLane, ds);
    const sign = side === 'right' ? 1 : -1; // move inward (toward center)
    return outerT + sign * (width / 2);
  }

  // Fallback: road edge + 0.8m outward offset
  const outerLane =
    side === 'right'
      ? sorted[sorted.length - 1] // most negative id
      : sorted[sorted.length - 1]; // most positive id
  if (!outerLane) return laneOff;

  const outerT = computeLaneOuterT(section, outerLane, ds) + laneOff;
  const sign = side === 'right' ? -1 : 1; // outward
  return outerT + sign * 0.8;
}

/**
 * Compute the center t-value of the driving lane closest to rawT.
 * Used to snap the signal head to the lane the cursor is hovering over.
 */
function computeNearestLaneCenterT(
  road: OdrRoad,
  s: number,
  rawT: number,
  side: 'right' | 'left',
): number {
  const section = findRecordAtS(road.lanes, s, (ls) => ls.s) as OdrLaneSection | undefined;
  if (!section) return rawT;

  const ds = s - section.s;
  const laneOff = evaluateLaneOffset(road.laneOffset, s);
  const lanes = side === 'right' ? section.rightLanes : section.leftLanes;

  // Filter to driving lanes only
  const drivingLanes = lanes.filter((l) => l.type === 'driving');
  if (drivingLanes.length === 0) {
    // Fallback to outermost lane snap
    return computeSignalSnapT(road, s, 'lane-above', side);
  }

  // Find the lane whose center is closest to rawT
  let bestLane: OdrLane = drivingLanes[0];
  let bestDist = Infinity;

  for (const lane of drivingLanes) {
    const inner = computeLaneInnerT(section, lane, ds) + laneOff;
    const outer = computeLaneOuterT(section, lane, ds) + laneOff;
    const center = (inner + outer) / 2;
    const dist = Math.abs(center - rawT);
    if (dist < bestDist) {
      bestDist = dist;
      bestLane = lane;
    }
  }

  const inner = computeLaneInnerT(section, bestLane, ds) + laneOff;
  const outer = computeLaneOuterT(section, bestLane, ds) + laneOff;
  return (inner + outer) / 2;
}

/**
 * Compute arm placement parameters for natural signal placement.
 *
 * The pole is placed at the road's outermost area (sidewalk, shoulder, etc.)
 * and the signal head extends over the driving lane closest to rawT.
 *
 * @param road - The road
 * @param s - s-coordinate
 * @param side - Which side of the road
 * @param rawT - Raw cursor t-position (used to determine which lane the head snaps to)
 * @returns poleT, headT, armLength
 */
export function computeArmPlacement(
  road: OdrRoad,
  s: number,
  side: 'right' | 'left',
  rawT: number,
): { poleT: number; headT: number; armLength: number } {
  const poleT = computePolePlacementT(road, s, side);
  const headT = computeNearestLaneCenterT(road, s, rawT, side);
  const armLength = Math.abs(poleT - headT);

  return { poleT, headT, armLength };
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
