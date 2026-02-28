/**
 * Position type options and default factory for PositionEditor.
 */

import type { Position } from '@osce/shared';

export const POSITION_TYPE_OPTIONS: readonly string[] = [
  'worldPosition',
  'lanePosition',
  'relativeLanePosition',
  'roadPosition',
  'relativeRoadPosition',
  'relativeObjectPosition',
  'relativeWorldPosition',
  'geoPosition',
  'routePosition',
] as const;

export const POSITION_TYPE_LABELS: Record<Position['type'], string> = {
  worldPosition: 'World Position',
  lanePosition: 'Lane Position',
  relativeLanePosition: 'Relative Lane Position',
  roadPosition: 'Road Position',
  relativeRoadPosition: 'Relative Road Position',
  relativeObjectPosition: 'Relative Object Position',
  relativeWorldPosition: 'Relative World Position',
  geoPosition: 'Geo Position',
  routePosition: 'Route Position',
};

export function createDefaultPosition(type: Position['type']): Position {
  switch (type) {
    case 'worldPosition':
      return { type: 'worldPosition', x: 0, y: 0 };
    case 'lanePosition':
      return { type: 'lanePosition', roadId: '', laneId: '', s: 0 };
    case 'relativeLanePosition':
      return { type: 'relativeLanePosition', entityRef: '', dLane: 0 };
    case 'roadPosition':
      return { type: 'roadPosition', roadId: '', s: 0, t: 0 };
    case 'relativeRoadPosition':
      return { type: 'relativeRoadPosition', entityRef: '', ds: 0, dt: 0 };
    case 'relativeObjectPosition':
      return { type: 'relativeObjectPosition', entityRef: '', dx: 0, dy: 0 };
    case 'relativeWorldPosition':
      return { type: 'relativeWorldPosition', entityRef: '', dx: 0, dy: 0 };
    case 'geoPosition':
      return { type: 'geoPosition', latitude: 0, longitude: 0 };
    case 'routePosition':
      return {
        type: 'routePosition',
        routeRef: {},
        inRoutePosition: {},
      };
  }
}
