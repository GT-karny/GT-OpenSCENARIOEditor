import type { ScenarioEntity, VehicleCategory } from '@osce/shared';
import {
  createDefaultVehicleDefinition,
  createDefaultPedestrianDefinition,
} from '@osce/scenario-engine';
import { generateId } from './id.js';

export function createDefaultVehicle(
  name: string,
  category: VehicleCategory = 'car',
): Partial<ScenarioEntity> {
  return {
    id: generateId(),
    name,
    type: 'vehicle',
    definition: createDefaultVehicleDefinition(name, category),
  };
}

export function createDefaultPedestrian(name: string): Partial<ScenarioEntity> {
  return {
    id: generateId(),
    name,
    type: 'pedestrian',
    definition: createDefaultPedestrianDefinition(name),
  };
}
