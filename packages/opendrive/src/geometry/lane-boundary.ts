/**
 * Lane boundary coordinate calculator.
 * Computes world-space positions for lane inner/outer edges.
 */
import type { OdrRoad, OdrLaneSection, OdrLane } from '@osce/shared';
import type { Vec3, Pose2D } from './types.js';
import { evaluateReferenceLineAtS } from './reference-line.js';
import { evaluateElevation } from './elevation.js';
import { evalCubic, findRecordAtS } from '../utils/math.js';

export interface LaneBoundaryPoint {
  s: number;
  innerT: number;
  outerT: number;
  innerPos: Vec3;
  outerPos: Vec3;
}

/**
 * Compute lane width at a given local s offset within the lane section.
 */
export function computeLaneWidth(lane: OdrLane, dsFromSectionStart: number): number {
  if (lane.width.length === 0) return 0;

  const wr = findRecordAtS(lane.width, dsFromSectionStart, (w) => w.sOffset);
  if (!wr) return 0;

  const ds = dsFromSectionStart - wr.sOffset;
  return evalCubic(wr.a, wr.b, wr.c, wr.d, ds);
}

/**
 * Compute the cumulative t-offset from the road center to a lane's outer edge.
 * For left lanes (positive ID): positive t direction.
 * For right lanes (negative ID): negative t direction.
 */
export function computeLaneOuterT(
  laneSection: OdrLaneSection,
  lane: OdrLane,
  dsFromSectionStart: number,
): number {
  const laneId = lane.id;

  if (laneId === 0) return 0;

  if (laneId > 0) {
    // Left lane: accumulate widths from lane 1 to laneId
    let t = 0;
    // Sort left lanes by ascending id (1, 2, 3, ...)
    const sorted = [...laneSection.leftLanes].sort((a, b) => a.id - b.id);
    for (const l of sorted) {
      if (l.id <= laneId) {
        t += computeLaneWidth(l, dsFromSectionStart);
      }
    }
    return t;
  } else {
    // Right lane: accumulate widths from lane -1 to laneId (negative direction)
    let t = 0;
    // Sort right lanes by descending id (-1, -2, -3, ...)
    const sorted = [...laneSection.rightLanes].sort((a, b) => b.id - a.id);
    for (const l of sorted) {
      if (l.id >= laneId) {
        t += computeLaneWidth(l, dsFromSectionStart);
      }
    }
    return -t;
  }
}

/**
 * Compute the t-offset for a lane's inner edge.
 */
export function computeLaneInnerT(
  laneSection: OdrLaneSection,
  lane: OdrLane,
  dsFromSectionStart: number,
): number {
  const width = computeLaneWidth(lane, dsFromSectionStart);
  const outerT = computeLaneOuterT(laneSection, lane, dsFromSectionStart);

  if (lane.id > 0) {
    return outerT - width;
  } else {
    return outerT + width;
  }
}

/**
 * Convert (s, t) to world XYZ coordinates.
 */
export function stToXyz(pose: Pose2D, t: number, z: number): Vec3 {
  // Perpendicular direction: left of heading
  const perpX = -Math.sin(pose.hdg);
  const perpY = Math.cos(pose.hdg);

  return {
    x: pose.x + t * perpX,
    y: pose.y + t * perpY,
    z,
  };
}

/**
 * Compute boundary points for a lane at multiple s values.
 */
export function computeLaneBoundaries(
  road: OdrRoad,
  laneSection: OdrLaneSection,
  lane: OdrLane,
  sValues: readonly number[],
): LaneBoundaryPoint[] {
  return sValues.map((s) => {
    const dsFromSectionStart = s - laneSection.s;
    const pose = evaluateReferenceLineAtS(road.planView, s);
    const z = evaluateElevation(road.elevationProfile, s);

    const innerT = computeLaneInnerT(laneSection, lane, dsFromSectionStart);
    const outerT = computeLaneOuterT(laneSection, lane, dsFromSectionStart);

    return {
      s,
      innerT,
      outerT,
      innerPos: stToXyz(pose, innerT, z),
      outerPos: stToXyz(pose, outerT, z),
    };
  });
}
