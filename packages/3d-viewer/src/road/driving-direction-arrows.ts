/**
 * Pure geometry helpers for the driving-direction arrow overlay.
 *
 * Samples driving lanes of a road at regular s intervals and produces arrow
 * placements (world position + travel heading). Direction math is delegated to
 * computeDrivingHeading (rule-aware), so RHT/LHT and left/right lanes are
 * handled correctly without re-deriving anything here.
 */

import type { OdrRoad } from '@osce/shared';
import {
  evaluateReferenceLineAtS,
  evaluateElevation,
  evaluateLaneOffset,
  computeLaneInnerT,
  computeLaneOuterT,
  computeDrivingHeading,
  findLaneSectionAtS,
} from '@osce/opendrive';
import { bankedSurfacePoint } from '../utils/banked-surface.js';

/** A single arrow placement in OpenDRIVE world coordinates (z-up). */
export interface ArrowPlacement {
  /** World X (OpenDRIVE, z-up frame). */
  x: number;
  /** World Y. */
  y: number;
  /** World Z (elevation). */
  z: number;
  /** Travel heading in radians (rule-aware). */
  heading: number;
  /** Lane ID the arrow belongs to. */
  laneId: number;
  /** S coordinate the arrow was sampled at. */
  s: number;
}

/** Default spacing between consecutive arrows along a lane, in metres. */
export const DEFAULT_ARROW_SPACING = 20;

/**
 * Compute the s-sample positions along a road of the given length.
 *
 * Arrows are placed at half-spacing from each end so short roads still get at
 * least one arrow, and no arrow sits exactly on a lane-section boundary at s=0.
 */
export function computeArrowSampleS(length: number, spacing = DEFAULT_ARROW_SPACING): number[] {
  if (!(length > 0) || !(spacing > 0)) return [];
  const samples: number[] = [];
  // Start half a step in, then step by `spacing`.
  for (let s = spacing / 2; s < length; s += spacing) {
    samples.push(s);
  }
  // Guarantee at least one sample for very short roads.
  if (samples.length === 0) samples.push(length / 2);
  return samples;
}

/**
 * Build all arrow placements for a single road.
 *
 * For every driving lane (`type === 'driving'`) present at each sampled s, the
 * lane-centre world position is computed and the travel heading is taken from
 * computeDrivingHeading (which flips for RHT/LHT and left/right lanes).
 */
export function computeRoadArrowPlacements(
  road: OdrRoad,
  spacing = DEFAULT_ARROW_SPACING,
): ArrowPlacement[] {
  const placements: ArrowPlacement[] = [];
  const sampleS = computeArrowSampleS(road.length, spacing);

  for (const s of sampleS) {
    const laneSection = findLaneSectionAtS(road.lanes, s);
    if (!laneSection) continue;

    const dsFromSection = s - laneSection.s;
    const laneOff = evaluateLaneOffset(road.laneOffset, s);
    const pose = evaluateReferenceLineAtS(road.planView, s);
    const z = evaluateElevation(road.elevationProfile, s);

    // Only driving lanes get direction arrows; centre lane has no direction.
    const sideLanes = [...laneSection.leftLanes, ...laneSection.rightLanes];
    for (const lane of sideLanes) {
      if (lane.type !== 'driving' || lane.id === 0) continue;

      const innerT = computeLaneInnerT(laneSection, lane, dsFromSection) + laneOff;
      const outerT = computeLaneOuterT(laneSection, lane, dsFromSection) + laneOff;
      const t = (innerT + outerT) / 2;

      // Sit on the banked surface (superelevation roll / crossSectionSurface
      // height), same as the road mesh, so arrows aren't buried on a rolled road.
      const worldPos = bankedSurfacePoint(road, pose, s, t, z);
      const heading = computeDrivingHeading(road, lane.id, s);

      placements.push({
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z,
        heading,
        laneId: lane.id,
        s,
      });
    }
  }

  return placements;
}
