/**
 * Builds complete entity definitions from simplified AI input.
 *
 * Default definitions come from the single source of truth in
 * `@osce/scenario-engine`; this module is a thin adapter that maps the MCP tool
 * input shape onto those factories.
 */

import type {
  ScenarioEntity,
  EntityType,
  VehicleCategory,
  PedestrianCategory,
  MiscObjectCategory,
} from '@osce/shared';
import {
  createDefaultVehicleDefinition,
  createDefaultPedestrianDefinition,
  createDefaultMiscObjectDefinition,
} from '@osce/scenario-engine';

export interface EntityInput {
  name: string;
  type: EntityType;
  vehicleCategory?: string;
  pedestrianCategory?: string;
  miscObjectCategory?: string;
}

/**
 * Build a Partial<ScenarioEntity> with a complete definition from simplified input.
 */
export function buildEntityFromInput(input: EntityInput): Partial<ScenarioEntity> {
  const { name, type } = input;

  switch (type) {
    case 'vehicle':
      return {
        name,
        type: 'vehicle',
        definition: createDefaultVehicleDefinition(
          name,
          (input.vehicleCategory as VehicleCategory) ?? 'car',
        ),
      };
    case 'pedestrian':
      return {
        name,
        type: 'pedestrian',
        definition: createDefaultPedestrianDefinition(
          name,
          (input.pedestrianCategory as PedestrianCategory) ?? 'pedestrian',
        ),
      };
    case 'miscObject':
      return {
        name,
        type: 'miscObject',
        definition: createDefaultMiscObjectDefinition(
          name,
          (input.miscObjectCategory as MiscObjectCategory) ?? 'obstacle',
        ),
      };
    default:
      throw new Error(`Unknown entity type: ${type}. Use 'vehicle', 'pedestrian', or 'miscObject'.`);
  }
}

/**
 * Build a Position from simplified shorthand input.
 * Supports worldPosition (x, y) and lanePosition (roadId, laneId, s) shortcuts.
 */
export function buildPositionFromInput(args: Record<string, unknown>): import('@osce/shared').Position {
  // Direct position object takes priority
  if (args['position'] && typeof args['position'] === 'object') {
    return args['position'] as import('@osce/shared').Position;
  }

  // World position shorthand
  if (args['x'] !== undefined && args['y'] !== undefined) {
    return {
      type: 'worldPosition' as const,
      x: Number(args['x']),
      y: Number(args['y']),
      z: args['z'] !== undefined ? Number(args['z']) : undefined,
      h: args['h'] !== undefined ? Number(args['h']) : undefined,
    };
  }

  // Lane position shorthand
  if (args['roadId'] !== undefined && args['laneId'] !== undefined && args['s'] !== undefined) {
    return {
      type: 'lanePosition' as const,
      roadId: String(args['roadId']),
      laneId: String(args['laneId']),
      s: Number(args['s']),
      offset: args['offset'] !== undefined ? Number(args['offset']) : undefined,
    };
  }

  throw new Error(
    'Cannot determine position. Provide either: ' +
    '(1) a "position" object with a "type" field, ' +
    '(2) "x" and "y" for a world position, or ' +
    '(3) "roadId", "laneId", and "s" for a lane position.',
  );
}
