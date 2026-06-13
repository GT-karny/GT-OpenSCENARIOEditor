/**
 * Canonical default entity definitions.
 *
 * Single source of truth for inline (non-catalog) entity definitions created by
 * the UI, MCP tools, and scenario templates. Values are physics-realistic and
 * category-aware (a car accelerates at 5 m/s^2, not 200). Any code that needs a
 * default vehicle / pedestrian / misc-object definition must use these factories
 * so the values cannot drift apart again.
 */

import type {
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

interface VehicleDefaults {
  bbox: BoundingBox;
  perf: Performance;
}

/**
 * Category-aware physical defaults for vehicles. Speeds are in m/s, accelerations
 * in m/s^2, dimensions in metres.
 */
export const VEHICLE_DEFAULTS: Record<string, VehicleDefaults> = {
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

/** Default axle layout shared by all vehicle categories. */
export const DEFAULT_AXLES: Axles = {
  frontAxle: {
    maxSteering: 0.5,
    wheelDiameter: 0.65,
    trackWidth: 1.6,
    positionX: 3.1,
    positionZ: 0.325,
  },
  rearAxle: {
    maxSteering: 0.0,
    wheelDiameter: 0.65,
    trackWidth: 1.6,
    positionX: 0.0,
    positionZ: 0.325,
  },
  additionalAxles: [],
};

/** Canonical pedestrian model id (matches esmini sample assets, e.g. walkman.osgb). */
export const DEFAULT_PEDESTRIAN_MODEL = 'EPTa';

/**
 * Build a complete default vehicle definition for the given category.
 * Unknown categories fall back to the `car` profile.
 */
export function createDefaultVehicleDefinition(
  name: string,
  category: VehicleCategory = 'car',
): VehicleDefinition {
  const defaults = VEHICLE_DEFAULTS[category] ?? VEHICLE_DEFAULTS['car'];
  return {
    kind: 'vehicle',
    name,
    vehicleCategory: category,
    parameterDeclarations: [],
    performance: { ...defaults.perf },
    boundingBox: cloneBoundingBox(defaults.bbox),
    axles: cloneAxles(DEFAULT_AXLES),
    properties: [],
  };
}

/** Build a complete default pedestrian definition. */
export function createDefaultPedestrianDefinition(
  name: string,
  category: PedestrianCategory = 'pedestrian',
): PedestrianDefinition {
  return {
    kind: 'pedestrian',
    name,
    pedestrianCategory: category,
    mass: 75,
    model: DEFAULT_PEDESTRIAN_MODEL,
    parameterDeclarations: [],
    boundingBox: {
      center: { x: 0.0, y: 0.0, z: 0.9 },
      dimensions: { width: 0.5, length: 0.3, height: 1.8 },
    },
    properties: [],
  };
}

/** Build a complete default misc-object definition. */
export function createDefaultMiscObjectDefinition(
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

function cloneBoundingBox(bbox: BoundingBox): BoundingBox {
  return {
    center: { ...bbox.center },
    dimensions: { ...bbox.dimensions },
  };
}

function cloneAxles(axles: Axles): Axles {
  return {
    frontAxle: { ...axles.frontAxle },
    rearAxle: { ...axles.rearAxle },
    additionalAxles: axles.additionalAxles.map((axle) => ({ ...axle })),
  };
}
