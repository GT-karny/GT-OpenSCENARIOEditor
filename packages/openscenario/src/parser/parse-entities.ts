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
  ControllerType,
} from '@osce/shared';
import type { RawXml } from '../utils/xml-helpers.js';
import { parseParameterDeclarations } from './parse-parameters.js';
import { generateId } from '@osce/shared';
import { numAttr, strAttr, optNumAttr, optStrAttr, pushBindingFieldPrefix, popBindingFieldPrefix, child, children } from '../utils/xml-helpers.js';

export function parseEntities(raw: RawXml | undefined): ScenarioEntity[] {
  if (!raw) return [];
  return children(raw, 'ScenarioObject').map(parseScenarioObject);
}

function parseScenarioObject(raw: RawXml): ScenarioEntity {
  const name = strAttr(raw, 'name');
  const { type, definition } = parseEntityDefinition(raw);

  const entity: ScenarioEntity = {
    id: generateId(),
    name,
    type,
    definition,
  };

  const objectController = child(raw, 'ObjectController');
  if (objectController) {
    entity.controller = parseObjectController(objectController);
  }

  return entity;
}

function parseEntityDefinition(raw: RawXml): { type: EntityType; definition: ScenarioEntity['definition'] } {
  const vehicle = child(raw, 'Vehicle');
  if (vehicle) {
    return { type: 'vehicle', definition: parseVehicleDefinition(vehicle) };
  }
  const pedestrian = child(raw, 'Pedestrian');
  if (pedestrian) {
    return { type: 'pedestrian', definition: parsePedestrianDefinition(pedestrian) };
  }
  const miscObject = child(raw, 'MiscObject');
  if (miscObject) {
    return { type: 'miscObject', definition: parseMiscObjectDefinition(miscObject) };
  }
  const catalogReference = child(raw, 'CatalogReference');
  if (catalogReference) {
    return { type: 'vehicle', definition: parseCatalogReference(catalogReference) };
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

export function parseVehicleDefinition(raw: RawXml): VehicleDefinition {
  pushBindingFieldPrefix('performance');
  const performance = parsePerformance(child(raw, 'Performance'));
  popBindingFieldPrefix();

  pushBindingFieldPrefix('boundingBox');
  const boundingBox = parseBoundingBox(child(raw, 'BoundingBox'));
  popBindingFieldPrefix();

  pushBindingFieldPrefix('axles');
  const axles = parseAxles(child(raw, 'Axles'));
  popBindingFieldPrefix();

  return {
    kind: 'vehicle',
    name: strAttr(raw, 'name'),
    vehicleCategory: strAttr(raw, 'vehicleCategory', 'car') as VehicleDefinition['vehicleCategory'],
    mass: optNumAttr(raw, 'mass'),
    role: optStrAttr(raw, 'role') as VehicleDefinition['role'],
    parameterDeclarations: parseParameterDeclarations(child(raw, 'ParameterDeclarations')),
    performance,
    boundingBox,
    axles,
    properties: parseProperties(child(raw, 'Properties')),
    model3d: optStrAttr(raw, 'model3d'),
  };
}

// ─── Pedestrian ──────────────────────────────────────────────────────────────

export function parsePedestrianDefinition(raw: RawXml): PedestrianDefinition {
  return {
    kind: 'pedestrian',
    name: strAttr(raw, 'name'),
    pedestrianCategory: strAttr(raw, 'pedestrianCategory', 'pedestrian') as PedestrianDefinition['pedestrianCategory'],
    mass: numAttr(raw, 'mass'),
    model: strAttr(raw, 'model'),
    parameterDeclarations: parseParameterDeclarations(child(raw, 'ParameterDeclarations')),
    boundingBox: parseBoundingBox(child(raw, 'BoundingBox')),
    properties: parseProperties(child(raw, 'Properties')),
    model3d: optStrAttr(raw, 'model3d'),
  };
}

// ─── MiscObject ──────────────────────────────────────────────────────────────

export function parseMiscObjectDefinition(raw: RawXml): MiscObjectDefinition {
  return {
    kind: 'miscObject',
    name: strAttr(raw, 'name'),
    miscObjectCategory: strAttr(raw, 'miscObjectCategory', 'none') as MiscObjectDefinition['miscObjectCategory'],
    mass: numAttr(raw, 'mass'),
    parameterDeclarations: parseParameterDeclarations(child(raw, 'ParameterDeclarations')),
    boundingBox: parseBoundingBox(child(raw, 'BoundingBox')),
    properties: parseProperties(child(raw, 'Properties')),
    model3d: optStrAttr(raw, 'model3d'),
  };
}

// ─── CatalogReference ────────────────────────────────────────────────────────

function parseCatalogReference(raw: RawXml): CatalogReference {
  return {
    kind: 'catalogReference',
    catalogName: strAttr(raw, 'catalogName'),
    entryName: strAttr(raw, 'entryName'),
    parameterAssignments: parseParameterAssignments(child(raw, 'ParameterAssignments')),
  };
}

function parseParameterAssignments(raw: RawXml | undefined): ParameterAssignment[] {
  if (!raw) return [];
  return children(raw, 'ParameterAssignment').map(parseParameterAssignment);
}

function parseParameterAssignment(raw: RawXml): ParameterAssignment {
  return {
    parameterRef: strAttr(raw, 'parameterRef'),
    value: strAttr(raw, 'value'),
  };
}

// ─── Shared Sub-Elements ─────────────────────────────────────────────────────

function parsePerformance(raw: RawXml | undefined): Performance {
  if (!raw) return { maxSpeed: 0, maxAcceleration: 0, maxDeceleration: 0 };
  return {
    maxSpeed: numAttr(raw, 'maxSpeed'),
    maxAcceleration: numAttr(raw, 'maxAcceleration'),
    maxDeceleration: numAttr(raw, 'maxDeceleration'),
    mass: optNumAttr(raw, 'mass'),
  };
}

function parseBoundingBox(raw: RawXml | undefined): BoundingBox {
  if (!raw) {
    return {
      center: { x: 0, y: 0, z: 0 },
      dimensions: { width: 0, length: 0, height: 0 },
    };
  }

  const centerEl = child(raw, 'Center');
  pushBindingFieldPrefix('center');
  const center = {
    x: numAttr(centerEl, 'x'),
    y: numAttr(centerEl, 'y'),
    z: numAttr(centerEl, 'z'),
  };
  popBindingFieldPrefix();

  const dimensionsEl = child(raw, 'Dimensions');
  pushBindingFieldPrefix('dimensions');
  const dimensions = {
    width: numAttr(dimensionsEl, 'width'),
    length: numAttr(dimensionsEl, 'length'),
    height: numAttr(dimensionsEl, 'height'),
  };
  popBindingFieldPrefix();

  return { center, dimensions };
}

function parseAxles(raw: RawXml | undefined): Axles {
  if (!raw) {
    const defaultAxle: Axle = { maxSteering: 0, wheelDiameter: 0, trackWidth: 0, positionX: 0, positionZ: 0 };
    return { frontAxle: { ...defaultAxle }, rearAxle: { ...defaultAxle }, additionalAxles: [] };
  }

  pushBindingFieldPrefix('frontAxle');
  const frontAxle = parseAxle(child(raw, 'FrontAxle'));
  popBindingFieldPrefix();

  pushBindingFieldPrefix('rearAxle');
  const rearAxle = parseAxle(child(raw, 'RearAxle'));
  popBindingFieldPrefix();

  return {
    frontAxle,
    rearAxle,
    additionalAxles: children(raw, 'AdditionalAxle').map(parseAxle),
  };
}

function parseAxle(raw: RawXml | undefined): Axle {
  if (!raw) return { maxSteering: 0, wheelDiameter: 0, trackWidth: 0, positionX: 0, positionZ: 0 };
  return {
    maxSteering: numAttr(raw, 'maxSteering'),
    wheelDiameter: numAttr(raw, 'wheelDiameter'),
    trackWidth: numAttr(raw, 'trackWidth'),
    positionX: numAttr(raw, 'positionX'),
    positionZ: numAttr(raw, 'positionZ'),
  };
}

function parseProperties(raw: RawXml | undefined): Property[] {
  if (!raw) return [];
  return children(raw, 'Property').map(parseProperty);
}

function parseProperty(raw: RawXml): Property {
  return {
    name: strAttr(raw, 'name'),
    value: strAttr(raw, 'value'),
  };
}

// ─── ObjectController ────────────────────────────────────────────────────────

function parseObjectController(raw: RawXml): ObjectController {
  const controller = child(raw, 'Controller');
  if (controller) {
    return {
      controller: parseControllerDefinition(controller),
    };
  }
  const catalogReference = child(raw, 'CatalogReference');
  if (catalogReference) {
    return {
      controller: parseCatalogReference(catalogReference),
    };
  }
  // Fallback
  return {
    controller: { kind: 'controller', name: '', properties: [] },
  };
}

export function parseControllerDefinition(raw: RawXml): ControllerDefinition {
  return {
    kind: 'controller',
    name: strAttr(raw, 'name'),
    controllerType: optStrAttr(raw, 'controllerType') as ControllerType | undefined,
    parameterDeclarations: parseParameterDeclarations(child(raw, 'ParameterDeclarations')),
    properties: parseProperties(child(raw, 'Properties')),
  };
}
