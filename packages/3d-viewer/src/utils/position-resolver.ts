/**
 * Resolves OpenSCENARIO Position discriminated union types to world coordinates.
 * Bridges scenario position data to 3D rendering coordinates.
 */

import type { Position, OpenDriveDocument, OdrRoad, OdrLaneSection } from '@osce/shared';
import {
  evaluateReferenceLineAtS,
  evaluateElevation,
  computeLaneInnerT,
  computeLaneOuterT,
  stToXyz,
} from '@osce/opendrive';

/**
 * World coordinates for 3D rendering (in OpenDRIVE coordinate system).
 */
export interface WorldCoords {
  x: number;
  y: number;
  z: number;
  /** Heading in radians */
  h: number;
}

/**
 * Resolve any Position variant to world coordinates.
 * Returns null for position types that require entity state (relative positions)
 * or features not yet supported (geo positions, route positions).
 *
 * @param position - OpenSCENARIO Position (discriminated union)
 * @param odrDoc - Parsed OpenDRIVE document (needed for lane/road positions)
 */
export function resolvePositionToWorld(
  position: Position,
  odrDoc: OpenDriveDocument | null,
): WorldCoords | null {
  switch (position.type) {
    case 'worldPosition':
      return {
        x: position.x,
        y: position.y,
        z: position.z ?? 0,
        h: position.h ?? 0,
      };

    case 'lanePosition':
      return resolveLanePosition(position, odrDoc);

    case 'roadPosition':
      return resolveRoadPosition(position, odrDoc);

    // Relative positions require entity state — cannot resolve here
    case 'relativeLanePosition':
    case 'relativeRoadPosition':
    case 'relativeObjectPosition':
    case 'relativeWorldPosition':
      return null;

    // Route and geo positions not supported in MVP
    case 'routePosition':
    case 'geoPosition':
      return null;

    default:
      return null;
  }
}

function resolveLanePosition(
  pos: { roadId: string; laneId: string; s: number; offset?: number },
  odrDoc: OpenDriveDocument | null,
): WorldCoords | null {
  if (!odrDoc) return null;

  const road = odrDoc.roads.find((r) => r.id === pos.roadId);
  if (!road) return null;

  const laneSection = findLaneSectionAtS(road, pos.s);
  if (!laneSection) return null;

  const laneId = parseInt(pos.laneId, 10);
  const allLanes = [...laneSection.leftLanes, laneSection.centerLane, ...laneSection.rightLanes];
  const lane = allLanes.find((l) => l.id === laneId);
  if (!lane) return null;

  const dsFromSection = pos.s - laneSection.s;

  // Compute t at the center of the lane
  const innerT = computeLaneInnerT(laneSection, lane, dsFromSection);
  const outerT = computeLaneOuterT(laneSection, lane, dsFromSection);
  const t = (innerT + outerT) / 2 + (pos.offset ?? 0);

  const pose = evaluateReferenceLineAtS(road.planView, pos.s);
  const z = evaluateElevation(road.elevationProfile, pos.s);
  const worldPos = stToXyz(pose, t, z);

  return {
    x: worldPos.x,
    y: worldPos.y,
    z: worldPos.z,
    h: pose.hdg,
  };
}

function resolveRoadPosition(
  pos: { roadId: string; s: number; t: number },
  odrDoc: OpenDriveDocument | null,
): WorldCoords | null {
  if (!odrDoc) return null;

  const road = odrDoc.roads.find((r) => r.id === pos.roadId);
  if (!road) return null;

  const pose = evaluateReferenceLineAtS(road.planView, pos.s);
  const z = evaluateElevation(road.elevationProfile, pos.s);
  const worldPos = stToXyz(pose, pos.t, z);

  return {
    x: worldPos.x,
    y: worldPos.y,
    z: worldPos.z,
    h: pose.hdg,
  };
}

function findLaneSectionAtS(road: OdrRoad, s: number): OdrLaneSection | null {
  for (let i = 0; i < road.lanes.length; i++) {
    const sEnd = i + 1 < road.lanes.length ? road.lanes[i + 1].s : road.length;
    if (s >= road.lanes[i].s && s <= sEnd) {
      return road.lanes[i];
    }
  }
  // Fallback to last section
  return road.lanes.length > 0 ? road.lanes[road.lanes.length - 1] : null;
}
