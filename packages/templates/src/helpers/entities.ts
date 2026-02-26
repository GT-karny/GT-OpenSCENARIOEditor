import type { ScenarioEntity, VehicleDefinition, PedestrianDefinition } from '@osce/shared';
import { generateId } from './id.js';

export function createDefaultVehicle(
  name: string,
  category: 'car' | 'truck' | 'van' | 'bus' = 'car',
): Partial<ScenarioEntity> {
  const definition: VehicleDefinition = {
    kind: 'vehicle',
    name,
    vehicleCategory: category,
    parameterDeclarations: [],
    performance: { maxSpeed: 69.444, maxAcceleration: 200, maxDeceleration: 10.0 },
    boundingBox: {
      center: { x: 1.4, y: 0.0, z: 0.9 },
      dimensions: { width: 2.0, length: 4.5, height: 1.8 },
    },
    axles: {
      frontAxle: { maxSteering: 0.5, wheelDiameter: 0.6, trackWidth: 1.8, positionX: 3.1, positionZ: 0.3 },
      rearAxle: { maxSteering: 0.0, wheelDiameter: 0.6, trackWidth: 1.8, positionX: 0.0, positionZ: 0.3 },
      additionalAxles: [],
    },
    properties: [],
  };

  return {
    id: generateId(),
    name,
    type: 'vehicle',
    definition,
  };
}

export function createDefaultPedestrian(name: string): Partial<ScenarioEntity> {
  const definition: PedestrianDefinition = {
    kind: 'pedestrian',
    name,
    pedestrianCategory: 'pedestrian',
    mass: 80,
    model: 'EPTa',
    parameterDeclarations: [],
    boundingBox: {
      center: { x: 0.06, y: 0.0, z: 0.923 },
      dimensions: { width: 0.5, length: 0.6, height: 1.8 },
    },
    properties: [],
  };

  return {
    id: generateId(),
    name,
    type: 'pedestrian',
    definition,
  };
}
