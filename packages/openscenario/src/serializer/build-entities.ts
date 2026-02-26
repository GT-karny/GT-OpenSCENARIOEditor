import type {
  ScenarioEntity,
  VehicleDefinition,
  PedestrianDefinition,
  MiscObjectDefinition,
  CatalogReference,
  ObjectController,
  ControllerDefinition,
  BoundingBox,
  Performance,
  Axles,
  Axle,
  Property,
} from '@osce/shared';
import { buildParameterDeclarations } from './build-parameters.js';
import { buildAttrs } from '../utils/xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildEntities(entities: ScenarioEntity[]): any {
  if (entities.length === 0) return '';
  return {
    ScenarioObject: entities.map(buildScenarioObject),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildScenarioObject(entity: ScenarioEntity): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = buildAttrs({ name: entity.name });

  const def = entity.definition;
  switch (def.kind) {
    case 'vehicle':
      result.Vehicle = buildVehicle(def);
      break;
    case 'pedestrian':
      result.Pedestrian = buildPedestrian(def);
      break;
    case 'miscObject':
      result.MiscObject = buildMiscObject(def);
      break;
    case 'catalogReference':
      result.CatalogReference = buildCatalogReference(def);
      break;
  }

  if (entity.controller) {
    result.ObjectController = buildObjectController(entity.controller);
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildVehicle(v: VehicleDefinition): any {
  return {
    ...buildAttrs({
      name: v.name,
      vehicleCategory: v.vehicleCategory,
      mass: v.mass,
      role: v.role,
      model3d: v.model3d,
    }),
    ParameterDeclarations: buildParameterDeclarations(v.parameterDeclarations),
    BoundingBox: buildBoundingBox(v.boundingBox),
    Performance: buildPerformance(v.performance),
    Axles: buildAxles(v.axles),
    Properties: buildProperties(v.properties),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPedestrian(p: PedestrianDefinition): any {
  return {
    ...buildAttrs({
      name: p.name,
      pedestrianCategory: p.pedestrianCategory,
      mass: p.mass,
      model: p.model,
      model3d: p.model3d,
    }),
    ParameterDeclarations: buildParameterDeclarations(p.parameterDeclarations),
    BoundingBox: buildBoundingBox(p.boundingBox),
    Properties: buildProperties(p.properties),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMiscObject(m: MiscObjectDefinition): any {
  return {
    ...buildAttrs({
      name: m.name,
      miscObjectCategory: m.miscObjectCategory,
      mass: m.mass,
      model3d: m.model3d,
    }),
    ParameterDeclarations: buildParameterDeclarations(m.parameterDeclarations),
    BoundingBox: buildBoundingBox(m.boundingBox),
    Properties: buildProperties(m.properties),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCatalogReference(cr: CatalogReference): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = buildAttrs({
    catalogName: cr.catalogName,
    entryName: cr.entryName,
  });
  if (cr.parameterAssignments.length > 0) {
    result.ParameterAssignments = {
      ParameterAssignment: cr.parameterAssignments.map((pa) =>
        buildAttrs({ parameterRef: pa.parameterRef, value: pa.value }),
      ),
    };
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildBoundingBox(bb: BoundingBox): any {
  return {
    Center: buildAttrs({ x: bb.center.x, y: bb.center.y, z: bb.center.z }),
    Dimensions: buildAttrs({
      width: bb.dimensions.width,
      length: bb.dimensions.length,
      height: bb.dimensions.height,
    }),
  };
}

function buildPerformance(p: Performance): Record<string, string> {
  return buildAttrs({
    maxSpeed: p.maxSpeed,
    maxAcceleration: p.maxAcceleration,
    maxDeceleration: p.maxDeceleration,
    mass: p.mass,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAxles(a: Axles): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {
    FrontAxle: buildAxle(a.frontAxle),
    RearAxle: buildAxle(a.rearAxle),
  };
  if (a.additionalAxles.length > 0) {
    result.AdditionalAxle = a.additionalAxles.map(buildAxle);
  }
  return result;
}

function buildAxle(a: Axle): Record<string, string> {
  return buildAttrs({
    maxSteering: a.maxSteering,
    wheelDiameter: a.wheelDiameter,
    trackWidth: a.trackWidth,
    positionX: a.positionX,
    positionZ: a.positionZ,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildProperties(props: Property[]): any {
  if (props.length === 0) return '';
  return {
    Property: props.map((p) => buildAttrs({ name: p.name, value: p.value })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildObjectController(oc: ObjectController): any {
  const ctrl = oc.controller;
  if (ctrl.kind === 'controller') {
    return {
      Controller: buildControllerDefinition(ctrl),
    };
  }
  // CatalogReference
  return {
    CatalogReference: buildCatalogReference(ctrl as CatalogReference),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildControllerDefinition(c: ControllerDefinition): any {
  return {
    ...buildAttrs({ name: c.name }),
    Properties: buildProperties(c.properties),
  };
}
