/**
 * Resolves OpenSCENARIO Position discriminated union types to world coordinates.
 * Bridges scenario position data to 3D rendering coordinates.
 */

import type {
  Position,
  OpenDriveDocument,
  OdrRoad,
  OdrLaneSection,
  Route,
  RoutePosition,
} from '@osce/shared';
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

/**
 * World coordinates for 3D rendering (in OpenDRIVE coordinate system).
 */
export interface WorldCoords {
  x: number;
  y: number;
  z: number;
  /** Heading in radians */
  h: number;
  /** Road grade angle in radians (atan of dz/ds slope) */
  pitch?: number;
  /** Superelevation (crossfall) angle in radians */
  roll?: number;
}

/**
 * Options for resolving positions that require external data.
 */
export interface PositionResolveOptions {
  /** Resolve a catalog reference to an inline Route definition. */
  resolveCatalogRoute?: (ref: { catalogName: string; entryName: string }) => Route | null;
}

/**
 * Resolve any Position variant to world coordinates.
 * Returns null for position types that require entity state (relative positions)
 * or features not yet supported (geo positions).
 *
 * @param position - OpenSCENARIO Position (discriminated union)
 * @param odrDoc - Parsed OpenDRIVE document (needed for lane/road positions)
 * @param options - Optional resolvers for catalog references etc.
 */
export function resolvePositionToWorld(
  position: Position,
  odrDoc: OpenDriveDocument | null,
  options?: PositionResolveOptions,
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

    case 'routePosition':
      return resolveRoutePosition(position, odrDoc, options);

    case 'geoPosition':
      return null;

    default:
      return null;
  }
}

function resolveLanePosition(
  pos: {
    roadId: string;
    laneId: string;
    s: number;
    offset?: number;
    orientation?: { type?: string; h?: number; p?: number; r?: number };
  },
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

  // Compute t at the center of the lane (including road-level lane offset)
  const laneOff = evaluateLaneOffset(road.laneOffset, pos.s);
  const innerT = computeLaneInnerT(laneSection, lane, dsFromSection) + laneOff;
  const outerT = computeLaneOuterT(laneSection, lane, dsFromSection) + laneOff;
  const t = (innerT + outerT) / 2 + (pos.offset ?? 0);

  const pose = evaluateReferenceLineAtS(road.planView, pos.s);
  const z = evaluateElevation(road.elevationProfile, pos.s);
  const worldPos = stToXyz(pose, t, z);

  // Compute heading based on driving direction (accounts for lane side + road rule)
  let h: number;
  if (pos.orientation?.type === 'absolute' && pos.orientation.h != null) {
    // Absolute orientation: use as-is
    h = pos.orientation.h;
  } else {
    // Default or relative orientation: use driving direction
    const drivingH = computeDrivingHeading(road, laneId, pos.s);
    h = drivingH + (pos.orientation?.h ?? 0);
  }

  // Road surface tilt
  const gradient = evaluateElevationGradient(road.elevationProfile, pos.s);
  const pitch = Math.atan(gradient);
  const roll = evaluateSuperelevation(road.lateralProfile, pos.s);

  return {
    x: worldPos.x,
    y: worldPos.y,
    z: worldPos.z,
    h,
    pitch,
    roll,
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

  // Road surface tilt
  const gradient = evaluateElevationGradient(road.elevationProfile, pos.s);
  const pitch = Math.atan(gradient);
  const roll = evaluateSuperelevation(road.lateralProfile, pos.s);

  return {
    x: worldPos.x,
    y: worldPos.y,
    z: worldPos.z,
    h: pose.hdg,
    pitch,
    roll,
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

/**
 * Resolve a RoutePosition to world coordinates.
 * Uses the route's waypoint positions to approximate the location along the route.
 */
function resolveRoutePosition(
  pos: RoutePosition,
  odrDoc: OpenDriveDocument | null,
  options?: PositionResolveOptions,
): WorldCoords | null {
  if (!odrDoc) return null;

  // Get the route definition (inline or from catalog)
  let route: Route | null | undefined = pos.routeRef.route;
  if (!route && pos.routeRef.catalogReference && options?.resolveCatalogRoute) {
    route = options.resolveCatalogRoute(pos.routeRef.catalogReference);
  }
  if (!route || route.waypoints.length === 0) return null;

  const irp = pos.inRoutePosition;

  // Handle FromLaneCoordinates: position along route at pathS with specified laneId
  if (irp.positionInLaneCoordinates) {
    const pathS = irp.positionInLaneCoordinates.pathS;
    const laneId = irp.positionInLaneCoordinates.laneId;
    const laneOffset = irp.positionInLaneCoordinates.laneOffset;

    // For pathS=0, use the first waypoint's road/s with the specified laneId
    if (pathS === 0) {
      const firstWp = route.waypoints[0].position;
      if (firstWp.type === 'lanePosition') {
        return resolveLanePosition(
          { roadId: firstWp.roadId, laneId, s: firstWp.s, offset: laneOffset },
          odrDoc,
        );
      }
    }

    // For non-zero pathS, accumulate distance along waypoints to find position
    const wpPositions = resolveWaypointPositions(route, odrDoc);
    if (wpPositions.length < 2) {
      // Only one waypoint — resolve using its position
      const wp = route.waypoints[0].position;
      if (wp.type === 'lanePosition') {
        return resolveLanePosition(
          { roadId: wp.roadId, laneId, s: wp.s + pathS, offset: laneOffset },
          odrDoc,
        );
      }
      return null;
    }

    // Walk along the route, accumulating straight-line distance between resolved waypoints
    let accumulated = 0;
    for (let i = 0; i < wpPositions.length - 1; i++) {
      const from = wpPositions[i];
      const to = wpPositions[i + 1];
      const segLen = Math.sqrt(
        (to.x - from.x) ** 2 + (to.y - from.y) ** 2 + (to.z - from.z) ** 2,
      );

      if (accumulated + segLen >= pathS) {
        // pathS falls within this segment — interpolate using the waypoint's lane position
        const wp = route.waypoints[i + 1].position;
        if (wp.type === 'lanePosition') {
          const ratio = segLen > 0 ? (pathS - accumulated) / segLen : 0;
          const fromWp = route.waypoints[i].position;
          if (fromWp.type === 'lanePosition') {
            const interpS = fromWp.s + ratio * (wp.s - fromWp.s);
            return resolveLanePosition(
              { roadId: fromWp.roadId, laneId, s: interpS, offset: laneOffset },
              odrDoc,
            );
          }
        }
        break;
      }
      accumulated += segLen;
    }

    // pathS exceeds total route length — use last waypoint
    const lastWp = route.waypoints[route.waypoints.length - 1].position;
    if (lastWp.type === 'lanePosition') {
      return resolveLanePosition(
        { roadId: lastWp.roadId, laneId, s: lastWp.s, offset: laneOffset },
        odrDoc,
      );
    }
    return null;
  }

  // Handle FromRoadCoordinates
  if (irp.positionInRoadCoordinates) {
    const firstWp = route.waypoints[0].position;
    if (firstWp.type === 'lanePosition' || firstWp.type === 'roadPosition') {
      return resolveRoadPosition(
        {
          roadId: firstWp.roadId,
          s: (firstWp.type === 'lanePosition' ? firstWp.s : firstWp.s) + irp.positionInRoadCoordinates.pathS,
          t: irp.positionInRoadCoordinates.t,
        },
        odrDoc,
      );
    }
    return null;
  }

  // Handle FromCurrentEntity — cannot resolve statically
  return null;
}

/**
 * Resolve all waypoint positions in a route to world coords (for distance accumulation).
 */
function resolveWaypointPositions(route: Route, odrDoc: OpenDriveDocument): WorldCoords[] {
  const result: WorldCoords[] = [];
  for (const wp of route.waypoints) {
    const pos = wp.position;
    if (pos.type === 'lanePosition') {
      const resolved = resolveLanePosition(pos, odrDoc);
      if (resolved) result.push(resolved);
    } else if (pos.type === 'worldPosition') {
      result.push({ x: pos.x, y: pos.y, z: pos.z ?? 0, h: pos.h ?? 0 });
    } else if (pos.type === 'roadPosition') {
      const resolved = resolveRoadPosition(pos, odrDoc);
      if (resolved) result.push(resolved);
    }
  }
  return result;
}
