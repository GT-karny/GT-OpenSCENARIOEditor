/**
 * Builds complete entity definitions from simplified AI input.
 * Provides sensible defaults for BoundingBox, Performance, Axles, etc.
 */

import type {
  ScenarioEntity,
  EntityType,
  VehicleDefinition,
  PedestrianDefinition,
  MiscObjectDefinition,
  BoundingBox,
  Performance,
  Axles,
  VehicleCategory,
  PedestrianCategory,
  MiscObjectCategory,
} from '@osce/shared';

export interface EntityInput {
  name: string;
  type: EntityType;
  vehicleCategory?: string;
  pedestrianCategory?: string;
  miscObjectCategory?: string;
}

const VEHICLE_DEFAULTS: Record<string, { bbox: BoundingBox; perf: Performance }> = {
  car: {
    bbox: {
      center: { x: 1.4, y: 0.0, z: 0.75 },
      dimensions: { width: 1.8, length: 4.5, height: 1.5 },
    },
    perf: { maxSpeed: 69.4, maxAcceleration: 5.0, maxDeceleration: 8.0 },
  },
  truck: {
    bbox: {
      center: { x: 4.0, y: 0.0, z: 1.75 },
      dimensions: { width: 2.5, length: 12.0, height: 3.5 },
    },
    perf: { maxSpeed: 33.3, maxAcceleration: 3.0, maxDeceleration: 6.0 },
  },
  bus: {
    bbox: {
      center: { x: 4.5, y: 0.0, z: 1.6 },
      dimensions: { width: 2.5, length: 12.0, height: 3.2 },
    },
    perf: { maxSpeed: 27.8, maxAcceleration: 2.5, maxDeceleration: 5.0 },
  },
  motorbike: {
    bbox: {
      center: { x: 0.8, y: 0.0, z: 0.7 },
      dimensions: { width: 0.8, length: 2.2, height: 1.4 },
    },
    perf: { maxSpeed: 55.6, maxAcceleration: 6.0, maxDeceleration: 8.0 },
  },
  bicycle: {
    bbox: {
      center: { x: 0.7, y: 0.0, z: 0.6 },
      dimensions: { width: 0.6, length: 1.8, height: 1.2 },
    },
    perf: { maxSpeed: 11.1, maxAcceleration: 2.0, maxDeceleration: 4.0 },
  },
  van: {
    bbox: {
      center: { x: 2.0, y: 0.0, z: 1.1 },
      dimensions: { width: 2.0, length: 5.5, height: 2.2 },
    },
    perf: { maxSpeed: 50.0, maxAcceleration: 4.0, maxDeceleration: 7.0 },
  },
};

const DEFAULT_AXLES: Axles = {
  frontAxle: { maxSteering: 0.5, wheelDiameter: 0.65, trackWidth: 1.6, positionX: 3.1, positionZ: 0.325 },
  rearAxle: { maxSteering: 0.0, wheelDiameter: 0.65, trackWidth: 1.6, positionX: 0.0, positionZ: 0.325 },
  additionalAxles: [],
};

export function buildVehicleDefinition(
  name: string,
  category: VehicleCategory = 'car',
): VehicleDefinition {
  const defaults = VEHICLE_DEFAULTS[category] ?? VEHICLE_DEFAULTS['car'];
  return {
    kind: 'vehicle',
    name,
    vehicleCategory: category,
    parameterDeclarations: [],
    performance: defaults.perf,
    boundingBox: defaults.bbox,
    axles: DEFAULT_AXLES,
    properties: [],
  };
}

export function buildPedestrianDefinition(
  name: string,
  category: PedestrianCategory = 'pedestrian',
): PedestrianDefinition {
  return {
    kind: 'pedestrian',
    name,
    pedestrianCategory: category,
    mass: 75,
    model: 'pedestrian',
    parameterDeclarations: [],
    boundingBox: {
      center: { x: 0.0, y: 0.0, z: 0.9 },
      dimensions: { width: 0.5, length: 0.3, height: 1.8 },
    },
    properties: [],
  };
}

export function buildMiscObjectDefinition(
  name: string,
  category: MiscObjectCategory = 'obstacle',
): MiscObjectDefinition {
  return {
    kind: 'miscObject',
    name,
    miscObjectCategory: category,
    mass: 100,
    parameterDeclarations: [],
    boundingBox: {
      center: { x: 0.0, y: 0.0, z: 0.5 },
      dimensions: { width: 1.0, length: 1.0, height: 1.0 },
    },
    properties: [],
  };
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
        definition: buildVehicleDefinition(
          name,
          (input.vehicleCategory as VehicleCategory) ?? 'car',
        ),
      };
    case 'pedestrian':
      return {
        name,
        type: 'pedestrian',
        definition: buildPedestrianDefinition(
          name,
          (input.pedestrianCategory as PedestrianCategory) ?? 'pedestrian',
        ),
      };
    case 'miscObject':
      return {
        name,
        type: 'miscObject',
        definition: buildMiscObjectDefinition(
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
