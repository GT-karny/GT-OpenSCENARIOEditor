/**
 * Resolves OpenDRIVE signal positions (s, t, zOffset) to world coordinates.
 */

import type { OdrSignal, OdrRoad } from '@osce/shared';
import {
  evaluateReferenceLineAtS,
  evaluateElevation,
  evaluateElevationGradient,
} from '@osce/opendrive';
import type { WorldCoords } from './position-resolver.js';
import { bankedSurfacePoint } from './banked-surface.js';
import { DEFAULT_SIGNAL_HEIGHT } from './signal-geometry.js';

/**
 * Convert an OdrSignal's road-relative position to world coordinates.
 *
 * @param signal - Signal definition from OpenDRIVE
 * @param road - The road the signal belongs to
 * @returns World coordinates or null if position cannot be resolved
 */
export function resolveSignalPosition(
  signal: OdrSignal,
  road: OdrRoad,
): WorldCoords | null {
  if (signal.s < 0 || signal.s > road.length) return null;

  // 1. Evaluate reference line at signal.s
  const pose = evaluateReferenceLineAtS(road.planView, signal.s);
  if (!pose) return null;

  // 2. Evaluate elevation at signal.s
  const zBase = evaluateElevation(road.elevationProfile, signal.s);
  const zOffset = signal.zOffset ?? DEFAULT_SIGNAL_HEIGHT;

  // 3. Convert (s, t) to world XY, seating the base on the banked surface
  //    (zOffset remains a vertical rise above it), matching the road mesh.
  const surf = bankedSurfacePoint(road, pose, signal.s, signal.t, zBase + zOffset);

  // 4. Compute heading: signal faces oncoming traffic.
  //    orientation '+' (default) = applies to +s traffic → face against road direction (+π)
  //    orientation '-' = applies to -s traffic → face with road direction (no flip)
  let h = pose.hdg + (signal.hOffset ?? 0);
  if (signal.orientation !== '-') {
    h += Math.PI;
  }

  // 5. Compute pitch (from road slope); roll comes from the surface (superelevation)
  const gradient = evaluateElevationGradient(road.elevationProfile, signal.s);
  const pitch = Math.atan(gradient);

  return { x: surf.x, y: surf.y, z: surf.z, h, pitch, roll: surf.roll };
}
