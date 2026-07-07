/**
 * Resolves OpenDRIVE road-object positions (s, t, zOffset) to world coordinates.
 *
 * Mirrors signal-position-resolver: reference-line + elevation + superelevation
 * roll place the object on the (possibly banked) road surface, and the authored
 * hdg/pitch/roll compose on top of the road-frame orientation.
 */

import type { OdrRoadObject, OdrRoad } from '@osce/shared';
import {
  evaluateReferenceLineAtS,
  evaluateElevation,
  evaluateElevationGradient,
  evaluateSuperelevation,
  stToXyz,
} from '@osce/opendrive';
import type { WorldCoords } from './position-resolver.js';

/**
 * Resolve a road-relative object pose (s, t, zOffset + orientation deltas) to
 * world coordinates. Kept separate from {@link resolveObjectPosition} so that
 * repeat-expanded instances (which override s/t/zOffset) can reuse it.
 *
 * @returns World coordinates, or null when s is outside the road.
 */
export function resolveObjectPose(
  road: OdrRoad,
  s: number,
  t: number,
  zOffset: number,
  hdg = 0,
  pitch = 0,
  roll = 0,
): WorldCoords | null {
  if (s < 0 || s > road.length) return null;

  const pose = evaluateReferenceLineAtS(road.planView, s);
  if (!pose) return null;

  const zBase = evaluateElevation(road.elevationProfile, s);
  const surfaceRoll = evaluateSuperelevation(road.lateralProfile, s);

  // Place on the banked surface: the superelevation roll rotates the lateral
  // offset about the reference line (t·sin(roll) rise), same as the road mesh.
  const worldPos = stToXyz(pose, t, zBase + zOffset, surfaceRoll);

  // Orientation: object hdg/pitch/roll are relative to the road frame.
  const gradient = evaluateElevationGradient(road.elevationProfile, s);
  return {
    x: worldPos.x,
    y: worldPos.y,
    z: worldPos.z,
    h: pose.hdg + hdg,
    pitch: Math.atan(gradient) + pitch,
    roll: surfaceRoll + roll,
  };
}

/**
 * Convert an OdrRoadObject's road-relative position to world coordinates.
 */
export function resolveObjectPosition(
  obj: OdrRoadObject,
  road: OdrRoad,
): WorldCoords | null {
  return resolveObjectPose(
    road,
    obj.s,
    obj.t,
    obj.zOffset ?? 0,
    obj.hdg ?? 0,
    obj.pitch ?? 0,
    obj.roll ?? 0,
  );
}
