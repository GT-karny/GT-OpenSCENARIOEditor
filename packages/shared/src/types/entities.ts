/**
 * Entity types for OpenSCENARIO.
 * ScenarioObject = entity definition + optional controller.
 */

import type { Property, CatalogReference } from './scenario.js';
import type { ParameterDeclaration } from './parameters.js';
import type {
  VehicleCategory,
  Role,
  PedestrianCategory,
  MiscObjectCategory,
} from '../enums/osc-enums.js';

export type EntityType = 'vehicle' | 'pedestrian' | 'miscObject';

export interface ScenarioEntity {
  id: string;
  name: string;
  type: EntityType;
  definition: VehicleDefinition | PedestrianDefinition | MiscObjectDefinition | CatalogReference;
  controller?: ObjectController;
}

// --- Vehicle ---

export interface VehicleDefinition {
  kind: 'vehicle';
  name: string;
  vehicleCategory: VehicleCategory;
  mass?: number;
  role?: Role;
  parameterDeclarations: ParameterDeclaration[];
  performance: Performance;
  boundingBox: BoundingBox;
  axles: Axles;
  properties: Property[];
  model3d?: string;
}

export interface Performance {
  maxSpeed: number;
  maxAcceleration: number;
  maxDeceleration: number;
  mass?: number;
}

export interface BoundingBox {
  center: { x: number; y: number; z: number };
  dimensions: { width: number; length: number; height: number };
}

export interface Axles {
  frontAxle: Axle;
  rearAxle: Axle;
  additionalAxles: Axle[];
}

export interface Axle {
  maxSteering: number;
  wheelDiameter: number;
  trackWidth: number;
  positionX: number;
  positionZ: number;
}

// --- Pedestrian ---

export interface PedestrianDefinition {
  kind: 'pedestrian';
  name: string;
  pedestrianCategory: PedestrianCategory;
  mass: number;
  model: string;
  parameterDeclarations: ParameterDeclaration[];
  boundingBox: BoundingBox;
  properties: Property[];
  model3d?: string;
}

// --- MiscObject ---

export interface MiscObjectDefinition {
  kind: 'miscObject';
  name: string;
  miscObjectCategory: MiscObjectCategory;
  mass: number;
  parameterDeclarations: ParameterDeclaration[];
  boundingBox: BoundingBox;
  properties: Property[];
  model3d?: string;
}

// --- Controller ---

export interface ObjectController {
  controller: ControllerDefinition | CatalogReference;
}

export interface ControllerDefinition {
  kind: 'controller';
  name: string;
  properties: Property[];
}
