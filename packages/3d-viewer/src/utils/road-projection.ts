/**
 * Road coordinate projection utilities for gizmo interaction.
 * Converts between road coordinates (roadId, laneId, s) and world coordinates.
 */

import type { OpenDriveDocument } from '@osce/shared';
import {
  evaluateReferenceLineAtS,
  evaluateElevation,
  evaluateElevationGradient,
  evaluateLaneOffset,
  computeLaneInnerT,
  computeLaneOuterT,
  computeDrivingHeading,
  findLaneSectionAtS,
} from '@osce/opendrive';
import { bankedSurfacePoint } from './banked-surface.js';

export interface RoadProjectionResult {
  x: number;
  y: number;
  z: number;
  /** Driving heading in radians */
  h: number;
  roadId: string;
  laneId: number;
  s: number;
  /** Road grade angle in radians */
  pitch?: number;
  /** Superelevation angle in radians */
  roll?: number;
}

/**
 * Compute world position for a given road/lane/s (snapped to lane center).
 * Extracts the core logic from position-resolver's resolveLanePosition.
 */
export function roadCoordsToWorld(
  odrDoc: OpenDriveDocument,
  roadId: string,
  laneId: number,
  s: number,
): RoadProjectionResult | null {
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
  const surf = bankedSurfacePoint(road, pose, clampedS, t, z);
  const h = computeDrivingHeading(road, laneId, clampedS);

  const gradient = evaluateElevationGradient(road.elevationProfile, clampedS);
  const pitch = Math.atan(gradient);

  return {
    x: surf.x,
    y: surf.y,
    z: surf.z,
    h,
    roadId,
    laneId,
    s: clampedS,
    pitch,
    roll: surf.roll,
  };
}

/**
 * Get sorted driving lane IDs at a given s position on a road.
 * Excludes center lane (id=0). Ordered: left lanes descending, right lanes ascending.
 */
export function getDrivingLaneIds(
  odrDoc: OpenDriveDocument,
  roadId: string,
  s: number,
): number[] {
  const road = odrDoc.roads.find((r) => r.id === roadId);
  if (!road) return [];

  const laneSection = findLaneSectionAtS(road.lanes, s);
  if (!laneSection) return [];

  const ids: number[] = [];
  for (const lane of laneSection.leftLanes) {
    if (lane.id !== 0) ids.push(lane.id);
  }
  for (const lane of laneSection.rightLanes) {
    if (lane.id !== 0) ids.push(lane.id);
  }

  // Sort: positive (left) descending, then negative (right) ascending
  ids.sort((a, b) => b - a);
  return ids;
}
