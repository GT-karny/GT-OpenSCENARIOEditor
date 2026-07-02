/**
 * Lane-change path computation for read-only 3D preview.
 *
 * Given a LaneChangeAction and the acting entity's current world pose, this
 * samples the lateral transition from the entity's current lane centre to the
 * target lane centre along the road. The lateral progress is shaped by
 * `dynamics.dynamicsShape` (linear / cubic / sinusoidal / step) over a
 * longitudinal distance derived from `dynamics.dynamicsDimension`:
 *
 *   - distance: the value is the longitudinal length directly.
 *   - time:     length = value * speed, where speed is the actor's resolved
 *               initial speed (from an Init/Story AbsoluteTargetSpeed) or, when
 *               that cannot be resolved, a nominal fallback (NOMINAL_SPEED_MPS).
 *   - rate:     rate is a lateral velocity/acceleration hint with no lateral
 *               span available statically; we approximate the longitudinal
 *               length as speed / max(rate, epsilon) — i.e. the time to change
 *               one unit at `rate` multiplied by speed — clamped to a sane range.
 *               This is a visual approximation only.
 *
 * All road geometry (lane centre evaluation, world<->lane lookup) is composed
 * from @osce/opendrive evaluators; no road math is reimplemented here.
 */

import type { LaneChangeAction, OpenDriveDocument } from '@osce/shared';
import {
  worldToLane,
  evaluateReferenceLineAtS,
  evaluateElevation,
  evaluateLaneOffset,
  computeLaneInnerT,
  computeLaneOuterT,
  stToXyz,
  computeDrivingHeading,
  findLaneSectionAtS,
} from '@osce/opendrive';

/**
 * Minimal world pose used for lane-change resolution. Structurally compatible
 * with `@osce/3d-viewer`'s `WorldCoords` (the callers pass those directly), but
 * declared locally so this pure math module has no dependency on the Three.js
 * viewer barrel.
 */
export interface WorldPose {
  x: number;
  y: number;
  z: number;
  /** Heading in radians */
  h: number;
  pitch?: number;
  roll?: number;
}

/** Fallback longitudinal speed (m/s ~= 36 km/h) when none can be resolved. */
export const NOMINAL_SPEED_MPS = 10;

/** Number of samples along the lane-change transition. */
const SAMPLES = 40;

/** Minimum longitudinal length so a step/degenerate change is still visible. */
const MIN_LENGTH_M = 2;

/** Clamp for the rate-derived longitudinal length. */
const MAX_LENGTH_M = 200;

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Evaluate a lane centre in world coordinates at (roadId, laneId, s).
 * Composes the same @osce/opendrive evaluators as
 * `@osce/3d-viewer`'s `roadCoordsToWorld` (reference line, elevation, lane
 * inner/outer t, lane offset, driving heading) without depending on the viewer
 * package. Returns null when the road/lane/section is unavailable at `s`.
 */
function laneCentreToWorld(
  odrDoc: OpenDriveDocument,
  roadId: string,
  laneId: number,
  s: number,
): { x: number; y: number; z: number; h: number } | null {
  const road = odrDoc.roads.find((r) => r.id === roadId);
  if (!road) return null;

  const clampedS = Math.max(0, Math.min(s, road.length));
  const laneSection = findLaneSectionAtS(road.lanes, clampedS);
  if (!laneSection) return null;

  const dsFromSection = clampedS - laneSection.s;
  const allLanes = [...laneSection.leftLanes, laneSection.centerLane, ...laneSection.rightLanes];
  const lane = allLanes.find((l) => l.id === laneId);
  if (!lane) return null;

  const laneOff = evaluateLaneOffset(road.laneOffset, clampedS);
  const innerT = computeLaneInnerT(laneSection, lane, dsFromSection) + laneOff;
  const outerT = computeLaneOuterT(laneSection, lane, dsFromSection) + laneOff;
  const t = (innerT + outerT) / 2;

  const pose = evaluateReferenceLineAtS(road.planView, clampedS);
  const z = evaluateElevation(road.elevationProfile, clampedS);
  const world = stToXyz(pose, t, z);
  const h = computeDrivingHeading(road, laneId, clampedS);

  return { x: world.x, y: world.y, z: world.z, h };
}

export interface LaneChangePathResult {
  /** Sampled world path from current lane centre to target lane centre. */
  points: Point3[];
  /** Resolved current lane id (for debugging / callers). */
  fromLaneId: number;
  /** Resolved target lane id. */
  toLaneId: number;
}

/**
 * Resolve the target lane id from a LaneChangeAction target and the actor's
 * current lane, using the reference entity's lane for relative targets.
 */
function resolveTargetLaneId(
  action: LaneChangeAction,
  odrDoc: OpenDriveDocument,
  entityPositions: Map<string, WorldPose>,
): number | null {
  const target = action.target;
  if (target.kind === 'absolute') {
    return Math.trunc(target.value);
  }
  // Relative: reference entity's lane id + value.
  const ref = entityPositions.get(target.entityRef);
  if (!ref) return null;
  const refLane = worldToLane(odrDoc, ref.x, ref.y);
  if (!refLane) return null;
  return refLane.laneId + Math.trunc(target.value);
}

/**
 * Compute the longitudinal length (m) of the lane change from its dynamics.
 * `speed` is the actor's resolved initial speed (m/s).
 */
export function computeLaneChangeLength(
  action: LaneChangeAction,
  speed: number,
): number {
  const { dynamicsShape, dynamicsDimension, value } = action.dynamics;
  let length: number;
  switch (dynamicsDimension) {
    case 'distance':
      length = value;
      break;
    case 'time':
      length = value * speed;
      break;
    case 'rate':
      // `rate` is a lateral change rate; there is no lateral span statically.
      // Approximate the longitudinal span as (speed / rate): the distance
      // travelled while completing one unit of lateral change at `rate`.
      length = Math.abs(value) > 1e-6 ? speed / Math.abs(value) : speed;
      break;
    default:
      length = value;
  }
  // A step change has no transition length; give it a short visible ramp.
  if (dynamicsShape === 'step') length = Math.max(length, MIN_LENGTH_M);
  return Math.min(Math.max(length, MIN_LENGTH_M), MAX_LENGTH_M);
}

/**
 * Lateral progress fraction (0..1) for a given normalized longitudinal
 * fraction `u` (0..1), shaped by the dynamics shape.
 */
function shapeProgress(shape: LaneChangeAction['dynamics']['dynamicsShape'], u: number): number {
  switch (shape) {
    case 'linear':
      return u;
    case 'cubic':
      // Hermite smoothstep with zero slope at both ends: 3u^2 - 2u^3.
      return u * u * (3 - 2 * u);
    case 'sinusoidal':
      // Half-cosine ease: (1 - cos(pi*u)) / 2.
      return (1 - Math.cos(Math.PI * u)) / 2;
    case 'step':
      // Instantaneous change at the start.
      return u <= 0 ? 0 : 1;
    default:
      return u;
  }
}

/**
 * Compute the world-space lane-change preview path for a single
 * LaneChangeAction acting on the entity at `entityPose`.
 *
 * @param action - the lane change action
 * @param entityPose - the acting entity's current world pose (with an optional
 *   resolved speed hint attached)
 * @param odrDoc - parsed OpenDRIVE document
 * @param entityPositions - all entity world poses (for relative-target lookup)
 * @param speed - the acting entity's resolved initial speed (m/s)
 * @returns the sampled path, or null if the road/lanes cannot be resolved
 */
export function computeLaneChangePath(
  action: LaneChangeAction,
  entityPose: WorldPose,
  odrDoc: OpenDriveDocument,
  entityPositions: Map<string, WorldPose>,
  speed: number = NOMINAL_SPEED_MPS,
): LaneChangePathResult | null {
  const fromLane = worldToLane(odrDoc, entityPose.x, entityPose.y);
  if (!fromLane) return null;

  const toLaneId = resolveTargetLaneId(action, odrDoc, entityPositions);
  if (toLaneId == null) return null;

  const roadId = fromLane.roadId;
  const s0 = fromLane.s;
  const length = computeLaneChangeLength(action, speed);
  const laneOffset = action.targetLaneOffset ?? 0;
  const shape = action.dynamics.dynamicsShape;

  const points: Point3[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const u = i / SAMPLES;
    const s = s0 + u * length;
    // Lane centres at this s for both the source and target lane.
    const fromCentre = laneCentreToWorld(odrDoc, roadId, fromLane.laneId, s);
    const toCentre = laneCentreToWorld(odrDoc, roadId, toLaneId, s);
    if (!fromCentre || !toCentre) {
      // Road ran out (e.g. length exceeds road end) — stop sampling.
      break;
    }
    // Apply targetLaneOffset by shifting the target lane centre laterally
    // (perpendicular to the target driving heading, left = positive t).
    let toX = toCentre.x;
    let toY = toCentre.y;
    if (laneOffset !== 0) {
      const perpX = -Math.sin(toCentre.h);
      const perpY = Math.cos(toCentre.h);
      toX += perpX * laneOffset;
      toY += perpY * laneOffset;
    }
    const w = shapeProgress(shape, u);
    // Blend lateral position between the two lane centres.
    points.push({
      x: fromCentre.x + (toX - fromCentre.x) * w,
      y: fromCentre.y + (toY - fromCentre.y) * w,
      z: fromCentre.z + (toCentre.z - fromCentre.z) * w,
    });
  }

  if (points.length < 2) return null;

  return { points, fromLaneId: fromLane.laneId, toLaneId };
}
