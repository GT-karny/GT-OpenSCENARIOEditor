/**
 * Position types for OpenSCENARIO.
 * Uses discriminated unions with `type` field.
 */

import type { RouteStrategy } from '../enums/osc-enums.js';

export type Position =
  | WorldPosition
  | LanePosition
  | RelativeLanePosition
  | RoadPosition
  | RelativeRoadPosition
  | RelativeObjectPosition
  | RelativeWorldPosition
  | RoutePosition
  | GeoPosition;

export interface WorldPosition {
  type: 'worldPosition';
  x: number;
  y: number;
  z?: number;
  h?: number;
  p?: number;
  r?: number;
}

export interface LanePosition {
  type: 'lanePosition';
  roadId: string;
  laneId: string;
  s: number;
  offset?: number;
  orientation?: Orientation;
}

export interface RelativeLanePosition {
  type: 'relativeLanePosition';
  entityRef: string;
  dLane: number;
  ds?: number;
  dsLane?: number;
  offset?: number;
  orientation?: Orientation;
}

export interface RoadPosition {
  type: 'roadPosition';
  roadId: string;
  s: number;
  t: number;
  orientation?: Orientation;
}

export interface RelativeRoadPosition {
  type: 'relativeRoadPosition';
  entityRef: string;
  ds: number;
  dt: number;
  orientation?: Orientation;
}

export interface RelativeObjectPosition {
  type: 'relativeObjectPosition';
  entityRef: string;
  dx: number;
  dy: number;
  dz?: number;
  orientation?: Orientation;
}

export interface RelativeWorldPosition {
  type: 'relativeWorldPosition';
  entityRef: string;
  dx: number;
  dy: number;
  dz?: number;
  orientation?: Orientation;
}

export interface RoutePosition {
  type: 'routePosition';
  routeRef: RouteRef;
  inRoutePosition: InRoutePosition;
  orientation?: Orientation;
}

export interface GeoPosition {
  type: 'geoPosition';
  latitude: number;
  longitude: number;
  altitude?: number;
  orientation?: Orientation;
}

// --- Supporting types ---

export interface Orientation {
  type?: OrientationType;
  h?: number;
  p?: number;
  r?: number;
}

export type OrientationType = 'relative' | 'absolute';

export interface RouteRef {
  route?: Route;
  catalogReference?: { catalogName: string; entryName: string };
}

export interface Route {
  id: string;
  name: string;
  closed: boolean;
  waypoints: Waypoint[];
}

export interface Waypoint {
  position: Position;
  routeStrategy: RouteStrategy;
}


export interface InRoutePosition {
  fromCurrentEntity?: { entityRef: string };
  positionOfCurrentEntity?: { entityRef: string };
  positionInRoadCoordinates?: { pathS: number; t: number };
  positionInLaneCoordinates?: { pathS: number; laneId: string; laneOffset?: number };
}
