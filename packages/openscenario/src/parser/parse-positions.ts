import type {
  Position,
  WorldPosition,
  LanePosition,
  RelativeLanePosition,
  RoadPosition,
  RelativeRoadPosition,
  RelativeObjectPosition,
  RelativeWorldPosition,
  RoutePosition,
  GeoPosition,
  TrajectoryPosition,
  TrajectoryPositionRef,
  Orientation,
  OrientationType,
  RouteRef,
  InRoutePosition,
  Waypoint,
  Route,
  RouteStrategy,
} from '@osce/shared';
import type { RawXml } from '../utils/xml-helpers.js';
import { parseTrajectory } from './parse-actions.js';
import { generateId } from '@osce/shared';
import { parseParameterDeclarations } from './parse-parameters.js';
import { numAttr, strAttr, optNumAttr, optStrAttr, boolAttr, pushBindingFieldPrefix, popBindingFieldPrefix, child, children } from '../utils/xml-helpers.js';

export function parsePosition(raw: RawXml | undefined): Position {
  if (!raw) throw new Error('Position element is missing');

  const worldPosition = child(raw, 'WorldPosition');
  if (worldPosition) return parseWorldPosition(worldPosition);
  const lanePosition = child(raw, 'LanePosition');
  if (lanePosition) return parseLanePosition(lanePosition);
  const relativeLanePosition = child(raw, 'RelativeLanePosition');
  if (relativeLanePosition) return parseRelativeLanePosition(relativeLanePosition);
  const roadPosition = child(raw, 'RoadPosition');
  if (roadPosition) return parseRoadPosition(roadPosition);
  const relativeRoadPosition = child(raw, 'RelativeRoadPosition');
  if (relativeRoadPosition) return parseRelativeRoadPosition(relativeRoadPosition);
  const relativeObjectPosition = child(raw, 'RelativeObjectPosition');
  if (relativeObjectPosition) return parseRelativeObjectPosition(relativeObjectPosition);
  const relativeWorldPosition = child(raw, 'RelativeWorldPosition');
  if (relativeWorldPosition) return parseRelativeWorldPosition(relativeWorldPosition);
  const routePosition = child(raw, 'RoutePosition');
  if (routePosition) return parseRoutePosition(routePosition);
  const geoPosition = child(raw, 'GeoPosition');
  if (geoPosition) return parseGeoPosition(geoPosition);
  const trajectoryPosition = child(raw, 'TrajectoryPosition');
  if (trajectoryPosition) return parseTrajectoryPosition(trajectoryPosition);

  // Fallback for unsupported position types.
  // Return a default WorldPosition since @osce/shared doesn't define these types
  return { type: 'worldPosition', x: 0, y: 0 };
}

function parseTrajectoryPosition(raw: RawXml): TrajectoryPosition {
  return {
    type: 'trajectoryPosition',
    trajectoryRef: parseTrajectoryPositionRef(child(raw, 'TrajectoryRef')),
    s: numAttr(raw, 's'),
    t: optNumAttr(raw, 't'),
    orientation: parseOrientationWithPrefix(child(raw, 'Orientation')),
  };
}

function parseTrajectoryPositionRef(raw: RawXml | undefined): TrajectoryPositionRef {
  // XSD TrajectoryRef: choice(Trajectory | CatalogReference).
  if (!raw) return {};
  const trajectory = child(raw, 'Trajectory');
  if (trajectory) {
    return { trajectory: parseTrajectory(trajectory) };
  }
  const catalogReference = child(raw, 'CatalogReference');
  if (catalogReference) {
    return {
      catalogReference: {
        catalogName: strAttr(catalogReference, 'catalogName'),
        entryName: strAttr(catalogReference, 'entryName'),
      },
    };
  }
  return {};
}

function parseWorldPosition(raw: RawXml): WorldPosition {
  return {
    type: 'worldPosition',
    x: numAttr(raw, 'x'),
    y: numAttr(raw, 'y'),
    z: optNumAttr(raw, 'z'),
    h: optNumAttr(raw, 'h'),
    p: optNumAttr(raw, 'p'),
    r: optNumAttr(raw, 'r'),
  };
}

function parseLanePosition(raw: RawXml): LanePosition {
  return {
    type: 'lanePosition',
    roadId: strAttr(raw, 'roadId'),
    laneId: strAttr(raw, 'laneId'),
    s: numAttr(raw, 's'),
    offset: optNumAttr(raw, 'offset'),
    orientation: parseOrientationWithPrefix(child(raw, 'Orientation')),
  };
}

function parseRelativeLanePosition(raw: RawXml): RelativeLanePosition {
  return {
    type: 'relativeLanePosition',
    entityRef: strAttr(raw, 'entityRef'),
    dLane: numAttr(raw, 'dLane'),
    ds: optNumAttr(raw, 'ds'),
    dsLane: optNumAttr(raw, 'dsLane'),
    offset: optNumAttr(raw, 'offset'),
    orientation: parseOrientationWithPrefix(child(raw, 'Orientation')),
  };
}

function parseRoadPosition(raw: RawXml): RoadPosition {
  return {
    type: 'roadPosition',
    roadId: strAttr(raw, 'roadId'),
    s: numAttr(raw, 's'),
    t: numAttr(raw, 't'),
    orientation: parseOrientationWithPrefix(child(raw, 'Orientation')),
  };
}

function parseRelativeRoadPosition(raw: RawXml): RelativeRoadPosition {
  return {
    type: 'relativeRoadPosition',
    entityRef: strAttr(raw, 'entityRef'),
    ds: numAttr(raw, 'ds'),
    dt: numAttr(raw, 'dt'),
    orientation: parseOrientationWithPrefix(child(raw, 'Orientation')),
  };
}

function parseRelativeObjectPosition(raw: RawXml): RelativeObjectPosition {
  return {
    type: 'relativeObjectPosition',
    entityRef: strAttr(raw, 'entityRef'),
    dx: numAttr(raw, 'dx'),
    dy: numAttr(raw, 'dy'),
    dz: optNumAttr(raw, 'dz'),
    orientation: parseOrientationWithPrefix(child(raw, 'Orientation')),
  };
}

function parseRelativeWorldPosition(raw: RawXml): RelativeWorldPosition {
  return {
    type: 'relativeWorldPosition',
    entityRef: strAttr(raw, 'entityRef'),
    dx: numAttr(raw, 'dx'),
    dy: numAttr(raw, 'dy'),
    dz: optNumAttr(raw, 'dz'),
    orientation: parseOrientationWithPrefix(child(raw, 'Orientation')),
  };
}

function parseRoutePosition(raw: RawXml): RoutePosition {
  return {
    type: 'routePosition',
    routeRef: parseRouteRef(child(raw, 'RouteRef')),
    inRoutePosition: parseInRoutePosition(child(raw, 'InRoutePosition')),
    orientation: parseOrientationWithPrefix(child(raw, 'Orientation')),
  };
}

function parseGeoPosition(raw: RawXml): GeoPosition {
  return {
    type: 'geoPosition',
    latitude: numAttr(raw, 'latitude'),
    longitude: numAttr(raw, 'longitude'),
    altitude: optNumAttr(raw, 'altitude'),
    orientation: parseOrientationWithPrefix(child(raw, 'Orientation')),
  };
}

export function parseOrientation(raw: RawXml | undefined): Orientation {
  return {
    type: optStrAttr(raw, 'type') as OrientationType | undefined,
    h: optNumAttr(raw, 'h'),
    p: optNumAttr(raw, 'p'),
    r: optNumAttr(raw, 'r'),
  };
}

function parseOrientationWithPrefix(raw: RawXml | undefined): Orientation | undefined {
  if (!raw) return undefined;
  pushBindingFieldPrefix('orientation');
  const o = parseOrientation(raw);
  popBindingFieldPrefix();
  return o;
}

function parseRouteRef(raw: RawXml | undefined): RouteRef {
  if (!raw) return {};
  const route = child(raw, 'Route');
  const catalogReference = child(raw, 'CatalogReference');
  return {
    route: route ? parseRoute(route) : undefined,
    catalogReference: catalogReference
      ? {
          catalogName: strAttr(catalogReference, 'catalogName'),
          entryName: strAttr(catalogReference, 'entryName'),
        }
      : undefined,
  };
}

export function parseRoute(raw: RawXml): Route {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    closed: boolAttr(raw, 'closed'),
    parameterDeclarations: parseParameterDeclarations(child(raw, 'ParameterDeclarations')),
    waypoints: children(raw, 'Waypoint').map(parseWaypoint),
  };
}

function parseWaypoint(raw: RawXml): Waypoint {
  return {
    position: parsePosition(child(raw, 'Position')),
    routeStrategy: strAttr(raw, 'routeStrategy', 'shortest') as RouteStrategy,
  };
}

function parseInRoutePosition(raw: RawXml | undefined): InRoutePosition {
  if (!raw) return {};

  // XSD element names: FromCurrentEntity, FromRoadCoordinates, FromLaneCoordinates
  const fromCurrent = child(raw, 'FromCurrentEntity');
  const fromRoad = child(raw, 'FromRoadCoordinates');
  const fromLane = child(raw, 'FromLaneCoordinates');

  return {
    fromCurrentEntity: fromCurrent
      ? { entityRef: strAttr(fromCurrent, 'entityRef') }
      : undefined,
    positionInRoadCoordinates: fromRoad
      ? {
          pathS: numAttr(fromRoad, 'pathS'),
          t: numAttr(fromRoad, 't'),
        }
      : undefined,
    positionInLaneCoordinates: fromLane
      ? {
          pathS: numAttr(fromLane, 'pathS'),
          laneId: strAttr(fromLane, 'laneId'),
          laneOffset: optNumAttr(fromLane, 'laneOffset'),
        }
      : undefined,
  };
}
