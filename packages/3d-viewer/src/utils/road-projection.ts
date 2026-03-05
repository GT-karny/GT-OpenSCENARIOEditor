/**
 * Road coordinate projection utilities for gizmo interaction.
 * Converts between road coordinates (roadId, laneId, s) and world coordinates.
 */

import type { OpenDriveDocument, OdrRoad, OdrLaneSection } from '@osce/shared';
import {
  evaluateReferenceLineAtS,
  evaluateElevation,
  evaluateElevationGradient,
  evaluateSuperelevation,
  evaluateLaneOffset,
  computeLaneInnerT,
  computeLaneOuterT,
  stToXyz,
  computeDrivingHeading,
} from '@osce/opendrive';

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

  const laneSection = findLaneSectionAtS(road, clampedS);
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
  const worldPos = stToXyz(pose, t, z);
  const h = computeDrivingHeading(road, laneId, clampedS);

  const gradient = evaluateElevationGradient(road.elevationProfile, clampedS);
  const pitch = Math.atan(gradient);
  const roll = evaluateSuperelevation(road.lateralProfile, clampedS);

  return {
    x: worldPos.x,
    y: worldPos.y,
    z: worldPos.z,
    h,
    roadId,
    laneId,
    s: clampedS,
    pitch,
    roll,
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

  const laneSection = findLaneSectionAtS(road, s);
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

function findLaneSectionAtS(road: OdrRoad, s: number): OdrLaneSection | null {
  for (let i = 0; i < road.lanes.length; i++) {
    const sEnd = i + 1 < road.lanes.length ? road.lanes[i + 1].s : road.length;
    if (s >= road.lanes[i].s && s <= sEnd) {
      return road.lanes[i];
    }
  }
  return road.lanes.length > 0 ? road.lanes[road.lanes.length - 1] : null;
}
