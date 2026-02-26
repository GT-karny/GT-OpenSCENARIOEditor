import type {
  ScenarioEntity,
  VehicleDefinition,
  PedestrianDefinition,
  MiscObjectDefinition,
  BoundingBox,
  Performance,
  Axles,
  Axle,
  ObjectController,
  ControllerDefinition,
  EntityType,
  CatalogReference,
  ParameterAssignment,
  Property,
} from '@osce/shared';
import { parseParameterDeclarations } from './parse-parameters.js';
import { ensureArray } from '../utils/ensure-array.js';
import { generateId } from '../utils/uuid.js';
import { numAttr, strAttr, optNumAttr, optStrAttr } from '../utils/xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseEntities(raw: any): ScenarioEntity[] {
  if (!raw) return [];
  return ensureArray(raw.ScenarioObject).map(parseScenarioObject);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseScenarioObject(raw: any): ScenarioEntity {
  const name = strAttr(raw, 'name');
  const { type, definition } = parseEntityDefinition(raw);

  const entity: ScenarioEntity = {
    id: generateId(),
    name,
    type,
    definition,
  };

  if (raw.ObjectController) {
    entity.controller = parseObjectController(raw.ObjectController);
  }

  return entity;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEntityDefinition(raw: any): { type: EntityType; definition: ScenarioEntity['definition'] } {
  if (raw.Vehicle) {
    return { type: 'vehicle', definition: parseVehicleDefinition(raw.Vehicle) };
  }
  if (raw.Pedestrian) {
    return { type: 'pedestrian', definition: parsePedestrianDefinition(raw.Pedestrian) };
  }
  if (raw.MiscObject) {
    return { type: 'miscObject', definition: parseMiscObjectDefinition(raw.MiscObject) };
  }
  if (raw.CatalogReference) {
    return { type: 'vehicle', definition: parseCatalogReference(raw.CatalogReference) };
  }
  // Fallback: should not happen in valid OpenSCENARIO
  return {
    type: 'vehicle',
    definition: {
      kind: 'catalogReference',
      catalogName: '',
      entryName: '',
      parameterAssignments: [],
    },
  };
}

// ─── Vehicle ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseVehicleDefinition(raw: any): VehicleDefinition {
  return {
    kind: 'vehicle',
    name: strAttr(raw, 'name'),
    vehicleCategory: strAttr(raw, 'vehicleCategory', 'car') as VehicleDefinition['vehicleCategory'],
    mass: optNumAttr(raw, 'mass'),
    role: optStrAttr(raw, 'role') as VehicleDefinition['role'],
    parameterDeclarations: parseParameterDeclarations(raw.ParameterDeclarations),
    performance: parsePerformance(raw.Performance),
    boundingBox: parseBoundingBox(raw.BoundingBox),
    axles: parseAxles(raw.Axles),
    properties: parseProperties(raw.Properties),
    model3d: optStrAttr(raw, 'model3d'),
  };
}

// ─── Pedestrian ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePedestrianDefinition(raw: any): PedestrianDefinition {
  return {
    kind: 'pedestrian',
    name: strAttr(raw, 'name'),
    pedestrianCategory: strAttr(raw, 'pedestrianCategory', 'pedestrian') as PedestrianDefinition['pedestrianCategory'],
    mass: numAttr(raw, 'mass'),
    model: strAttr(raw, 'model'),
    parameterDeclarations: parseParameterDeclarations(raw.ParameterDeclarations),
    boundingBox: parseBoundingBox(raw.BoundingBox),
    properties: parseProperties(raw.Properties),
    model3d: optStrAttr(raw, 'model3d'),
  };
}

// ─── MiscObject ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMiscObjectDefinition(raw: any): MiscObjectDefinition {
  return {
    kind: 'miscObject',
    name: strAttr(raw, 'name'),
    miscObjectCategory: strAttr(raw, 'miscObjectCategory', 'none') as MiscObjectDefinition['miscObjectCategory'],
    mass: numAttr(raw, 'mass'),
    parameterDeclarations: parseParameterDeclarations(raw.ParameterDeclarations),
    boundingBox: parseBoundingBox(raw.BoundingBox),
    properties: parseProperties(raw.Properties),
    model3d: optStrAttr(raw, 'model3d'),
  };
}

// ─── CatalogReference ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCatalogReference(raw: any): CatalogReference {
  return {
    kind: 'catalogReference',
    catalogName: strAttr(raw, 'catalogName'),
    entryName: strAttr(raw, 'entryName'),
    parameterAssignments: parseParameterAssignments(raw.ParameterAssignments),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseParameterAssignments(raw: any): ParameterAssignment[] {
  if (!raw) return [];
  return ensureArray(raw.ParameterAssignment).map(parseParameterAssignment);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseParameterAssignment(raw: any): ParameterAssignment {
  return {
    parameterRef: strAttr(raw, 'parameterRef'),
    value: strAttr(raw, 'value'),
  };
}

// ─── Shared Sub-Elements ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePerformance(raw: any): Performance {
  if (!raw) return { maxSpeed: 0, maxAcceleration: 0, maxDeceleration: 0 };
  return {
    maxSpeed: numAttr(raw, 'maxSpeed'),
    maxAcceleration: numAttr(raw, 'maxAcceleration'),
    maxDeceleration: numAttr(raw, 'maxDeceleration'),
    mass: optNumAttr(raw, 'mass'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseBoundingBox(raw: any): BoundingBox {
  if (!raw) {
    return {
      center: { x: 0, y: 0, z: 0 },
      dimensions: { width: 0, length: 0, height: 0 },
    };
  }
  return {
    center: {
      x: numAttr(raw.Center, 'x'),
      y: numAttr(raw.Center, 'y'),
      z: numAttr(raw.Center, 'z'),
    },
    dimensions: {
      width: numAttr(raw.Dimensions, 'width'),
      length: numAttr(raw.Dimensions, 'length'),
      height: numAttr(raw.Dimensions, 'height'),
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAxles(raw: any): Axles {
  if (!raw) {
    const defaultAxle: Axle = { maxSteering: 0, wheelDiameter: 0, trackWidth: 0, positionX: 0, positionZ: 0 };
    return { frontAxle: { ...defaultAxle }, rearAxle: { ...defaultAxle }, additionalAxles: [] };
  }
  return {
    frontAxle: parseAxle(raw.FrontAxle),
    rearAxle: parseAxle(raw.RearAxle),
    additionalAxles: ensureArray(raw.AdditionalAxle).map(parseAxle),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAxle(raw: any): Axle {
  if (!raw) return { maxSteering: 0, wheelDiameter: 0, trackWidth: 0, positionX: 0, positionZ: 0 };
  return {
    maxSteering: numAttr(raw, 'maxSteering'),
    wheelDiameter: numAttr(raw, 'wheelDiameter'),
    trackWidth: numAttr(raw, 'trackWidth'),
    positionX: numAttr(raw, 'positionX'),
    positionZ: numAttr(raw, 'positionZ'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseProperties(raw: any): Property[] {
  if (!raw) return [];
  return ensureArray(raw.Property).map(parseProperty);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseProperty(raw: any): Property {
  return {
    name: strAttr(raw, 'name'),
    value: strAttr(raw, 'value'),
  };
}

// ─── ObjectController ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseObjectController(raw: any): ObjectController {
  if (raw.Controller) {
    return {
      controller: parseControllerDefinition(raw.Controller),
    };
  }
  if (raw.CatalogReference) {
    return {
      controller: parseCatalogReference(raw.CatalogReference),
    };
  }
  // Fallback
  return {
    controller: { kind: 'controller', name: '', properties: [] },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseControllerDefinition(raw: any): ControllerDefinition {
  return {
    kind: 'controller',
    name: strAttr(raw, 'name'),
    properties: parseProperties(raw.Properties),
  };
}
