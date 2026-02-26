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
  Orientation,
  OrientationType,
  RouteRef,
  InRoutePosition,
  Waypoint,
  Route,
  RouteStrategy,
} from '@osce/shared';
import { ensureArray } from '../utils/ensure-array.js';
import { generateId } from '../utils/uuid.js';
import { numAttr, strAttr, optNumAttr, optStrAttr, boolAttr } from '../utils/xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parsePosition(raw: any): Position {
  if (!raw) throw new Error('Position element is missing');

  if (raw.WorldPosition) return parseWorldPosition(raw.WorldPosition);
  if (raw.LanePosition) return parseLanePosition(raw.LanePosition);
  if (raw.RelativeLanePosition) return parseRelativeLanePosition(raw.RelativeLanePosition);
  if (raw.RoadPosition) return parseRoadPosition(raw.RoadPosition);
  if (raw.RelativeRoadPosition) return parseRelativeRoadPosition(raw.RelativeRoadPosition);
  if (raw.RelativeObjectPosition) return parseRelativeObjectPosition(raw.RelativeObjectPosition);
  if (raw.RelativeWorldPosition) return parseRelativeWorldPosition(raw.RelativeWorldPosition);
  if (raw.RoutePosition) return parseRoutePosition(raw.RoutePosition);
  if (raw.GeoPosition) return parseGeoPosition(raw.GeoPosition);

  // Fallback for unsupported position types (e.g. TrajectoryPosition)
  // Return a default WorldPosition since @osce/shared doesn't define these types
  return { type: 'worldPosition', x: 0, y: 0 };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseWorldPosition(raw: any): WorldPosition {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLanePosition(raw: any): LanePosition {
  return {
    type: 'lanePosition',
    roadId: strAttr(raw, 'roadId'),
    laneId: strAttr(raw, 'laneId'),
    s: numAttr(raw, 's'),
    offset: optNumAttr(raw, 'offset'),
    orientation: raw.Orientation ? parseOrientation(raw.Orientation) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRelativeLanePosition(raw: any): RelativeLanePosition {
  return {
    type: 'relativeLanePosition',
    entityRef: strAttr(raw, 'entityRef'),
    dLane: numAttr(raw, 'dLane'),
    ds: optNumAttr(raw, 'ds'),
    dsLane: optNumAttr(raw, 'dsLane'),
    offset: optNumAttr(raw, 'offset'),
    orientation: raw.Orientation ? parseOrientation(raw.Orientation) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRoadPosition(raw: any): RoadPosition {
  return {
    type: 'roadPosition',
    roadId: strAttr(raw, 'roadId'),
    s: numAttr(raw, 's'),
    t: numAttr(raw, 't'),
    orientation: raw.Orientation ? parseOrientation(raw.Orientation) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRelativeRoadPosition(raw: any): RelativeRoadPosition {
  return {
    type: 'relativeRoadPosition',
    entityRef: strAttr(raw, 'entityRef'),
    ds: numAttr(raw, 'ds'),
    dt: numAttr(raw, 'dt'),
    orientation: raw.Orientation ? parseOrientation(raw.Orientation) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRelativeObjectPosition(raw: any): RelativeObjectPosition {
  return {
    type: 'relativeObjectPosition',
    entityRef: strAttr(raw, 'entityRef'),
    dx: numAttr(raw, 'dx'),
    dy: numAttr(raw, 'dy'),
    dz: optNumAttr(raw, 'dz'),
    orientation: raw.Orientation ? parseOrientation(raw.Orientation) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRelativeWorldPosition(raw: any): RelativeWorldPosition {
  return {
    type: 'relativeWorldPosition',
    entityRef: strAttr(raw, 'entityRef'),
    dx: numAttr(raw, 'dx'),
    dy: numAttr(raw, 'dy'),
    dz: optNumAttr(raw, 'dz'),
    orientation: raw.Orientation ? parseOrientation(raw.Orientation) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRoutePosition(raw: any): RoutePosition {
  return {
    type: 'routePosition',
    routeRef: parseRouteRef(raw.RouteRef),
    inRoutePosition: parseInRoutePosition(raw.InRoutePosition),
    orientation: raw.Orientation ? parseOrientation(raw.Orientation) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGeoPosition(raw: any): GeoPosition {
  return {
    type: 'geoPosition',
    latitude: numAttr(raw, 'latitude'),
    longitude: numAttr(raw, 'longitude'),
    altitude: optNumAttr(raw, 'altitude'),
    orientation: raw.Orientation ? parseOrientation(raw.Orientation) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseOrientation(raw: any): Orientation {
  return {
    type: optStrAttr(raw, 'type') as OrientationType | undefined,
    h: optNumAttr(raw, 'h'),
    p: optNumAttr(raw, 'p'),
    r: optNumAttr(raw, 'r'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRouteRef(raw: any): RouteRef {
  if (!raw) return {};
  return {
    route: raw.Route ? parseRoute(raw.Route) : undefined,
    catalogReference: raw.CatalogReference
      ? {
          catalogName: strAttr(raw.CatalogReference, 'catalogName'),
          entryName: strAttr(raw.CatalogReference, 'entryName'),
        }
      : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRoute(raw: any): Route {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    closed: boolAttr(raw, 'closed'),
    waypoints: ensureArray(raw?.Waypoint).map(parseWaypoint),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseWaypoint(raw: any): Waypoint {
  return {
    position: parsePosition(raw?.Position),
    routeStrategy: strAttr(raw, 'routeStrategy', 'shortest') as RouteStrategy,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseInRoutePosition(raw: any): InRoutePosition {
  if (!raw) return {};
  return {
    fromCurrentEntity: raw.FromCurrentEntity
      ? { entityRef: strAttr(raw.FromCurrentEntity, 'entityRef') }
      : undefined,
    positionOfCurrentEntity: raw.PositionOfCurrentEntity
      ? { entityRef: strAttr(raw.PositionOfCurrentEntity, 'entityRef') }
      : undefined,
    positionInRoadCoordinates: raw.PositionInRoadCoordinates
      ? {
          pathS: numAttr(raw.PositionInRoadCoordinates, 'pathS'),
          t: numAttr(raw.PositionInRoadCoordinates, 't'),
        }
      : undefined,
    positionInLaneCoordinates: raw.PositionInLaneCoordinates
      ? {
          pathS: numAttr(raw.PositionInLaneCoordinates, 'pathS'),
          laneId: strAttr(raw.PositionInLaneCoordinates, 'laneId'),
          laneOffset: optNumAttr(raw.PositionInLaneCoordinates, 'laneOffset'),
        }
      : undefined,
  };
}
