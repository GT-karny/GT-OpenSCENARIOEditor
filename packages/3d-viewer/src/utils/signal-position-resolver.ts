/**
 * Resolves OpenDRIVE signal positions (s, t, zOffset) to world coordinates.
 */

import type { OdrSignal, OdrRoad } from '@osce/shared';
import {
  evaluateReferenceLineAtS,
  evaluateElevation,
  evaluateElevationGradient,
  evaluateSuperelevation,
  stToXyz,
} from '@osce/opendrive';
import type { WorldCoords } from './position-resolver.js';
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

  // 3. Convert (s, t) to world XY, with z = ground elevation + zOffset
  const worldPos = stToXyz(pose, signal.t, zBase + zOffset);

  // 4. Compute heading: road heading + hOffset, flip if orientation == '-'
  let h = pose.hdg + (signal.hOffset ?? 0);
  if (signal.orientation === '-') {
    h += Math.PI;
  }

  // 5. Compute pitch (from road slope) and roll (from superelevation)
  const gradient = evaluateElevationGradient(road.elevationProfile, signal.s);
  const pitch = Math.atan(gradient);
  const roll = evaluateSuperelevation(road.lateralProfile, signal.s);

  return { x: worldPos.x, y: worldPos.y, z: worldPos.z, h, pitch, roll };
}
