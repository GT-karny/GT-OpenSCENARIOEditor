/**
 * Signal orientation and head-layout helpers.
 *
 * Pure functions extracted from RoadNetworkEditorLayout's handleSignalPlace so
 * that RHT/LHT orientation resolution, orientation-aware head mirroring, and
 * head z-offset selection live in the engine (no React / store deps).
 */

import type { OdrRoad } from '@osce/shared';
import type { AssemblyPreset, AssemblyHeadPlacement } from './signal-preset-store.js';
import type { SignalHeadPreset } from './signal-presets.js';

/** Road-absolute signal orientation: '+' faces +s traffic, '-' faces -s traffic. */
export type SignalOrientation = '+' | '-';

/**
 * Resolve a user's lane-relative orientation choice to a road-absolute
 * OpenDRIVE orientation, honouring the road's driving rule (RHT/LHT).
 *
 * In OpenDRIVE, orientation '+' = for +s traffic, '-' = for -s traffic. The
 * user's choice is lane-relative ('+' = face oncoming, '-' = face away), so it
 * must be flipped whenever the lane travels against the road reference line.
 *
 * Replicates the inline derivation in handleSignalPlace:
 *   isLeftLane = t > 0
 *   isRHT = !road || road.rule !== 'LHT'
 *   laneAgainstRoad = isLeftLane === isRHT
 *   → flip userOrientation when laneAgainstRoad
 *
 * @param road            The road the signal is placed on (may be undefined).
 * @param t               The lateral t-offset of the signal head.
 * @param userOrientation The user's lane-relative orientation choice.
 * @returns The road-absolute orientation.
 */
export function resolveSignalOrientation(
  road: OdrRoad | undefined,
  t: number,
  userOrientation: SignalOrientation,
): SignalOrientation {
  const isLeftLane = t > 0;
  const isRHT = !road || road.rule !== 'LHT';
  const laneAgainstRoad = isLeftLane === isRHT; // true if lane travels in -s direction
  return laneAgainstRoad ? (userOrientation === '+' ? '-' : '+') : userOrientation;
}

/**
 * Resolve the assembly's head list for placement, mirroring head X offsets so
 * the layout stays correct from the viewer's perspective for the given
 * orientation.
 *
 * When `orientation` is '-', head X offsets are mirrored (multiplied by +1;
 * '+' multiplies by -1) to match the source's `xMirror` logic. When no
 * assembly preset with heads is supplied, a single head is returned using
 * `fallbackPresetId` at the origin.
 *
 * Replicates the inline derivation in handleSignalPlace:
 *   xMirror = orientation === '+' ? -1 : 1
 *   assemblyPreset && heads.length > 0
 *     ? heads.map((h) => ({ ...h, x: h.x * xMirror }))
 *     : [{ presetId: fallbackPresetId, x: 0, y: 0 }]
 *
 * @param assemblyPreset   The assembly preset (undefined for a single head).
 * @param fallbackPresetId Preset ID for the single-head fallback.
 * @param orientation      The road-absolute orientation.
 * @returns The mirrored head placements.
 */
export function mirrorAssemblyHeadsForOrientation(
  assemblyPreset: AssemblyPreset | undefined,
  fallbackPresetId: string,
  orientation: SignalOrientation,
): AssemblyHeadPlacement[] {
  const xMirror = orientation === '+' ? -1 : 1;
  return assemblyPreset && assemblyPreset.heads.length > 0
    ? assemblyPreset.heads.map((h) => ({ ...h, x: h.x * xMirror }))
    : [{ presetId: fallbackPresetId, x: 0, y: 0 }];
}

/** Z-offset (meters) for pedestrian signal heads. */
export const PEDESTRIAN_HEAD_Z_OFFSET = 2.5;
/** Z-offset (meters) for non-pedestrian signal heads. */
export const DEFAULT_HEAD_Z_OFFSET = 5.0;

/**
 * Select the head z-offset based on the first head's category: pedestrian
 * heads sit lower (2.5m) than standard vehicle/arrow heads (5.0m).
 *
 * Replicates the inline derivation in handleSignalPlace:
 *   isPedestrian = firstHeadPreset?.category === 'pedestrian'
 *   zOffset = isPedestrian ? 2.5 : 5.0
 *
 * @param firstHeadPreset The first head's preset (undefined → non-pedestrian).
 * @returns The z-offset in meters.
 */
export function resolveHeadZOffset(firstHeadPreset: SignalHeadPreset | undefined): number {
  const isPedestrian = firstHeadPreset?.category === 'pedestrian';
  return isPedestrian ? PEDESTRIAN_HEAD_Z_OFFSET : DEFAULT_HEAD_Z_OFFSET;
}
