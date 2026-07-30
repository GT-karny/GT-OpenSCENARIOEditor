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
import { buildAttrs, getSubBindings } from '../utils/xml-helpers.js';

export function buildEntities(entities: ScenarioEntity[]): Record<string, unknown> | string {
  if (entities.length === 0) return '';
  return {
    ScenarioObject: entities.map(buildScenarioObject),
  };
}

function buildScenarioObject(entity: ScenarioEntity): Record<string, unknown> {
  const result: Record<string, unknown> = buildAttrs({ name: entity.name });

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

  if (entity.controllers && entity.controllers.length > 0) {
    result.ObjectController = entity.controllers.map(buildObjectController);
  }

  return result;
}

export function buildVehicle(
  v: VehicleDefinition,
  bindings?: Record<string, string>,
): Record<string, unknown> {
  return {
    ...buildAttrs({
      name: v.name,
      vehicleCategory: v.vehicleCategory,
      mass: v.mass,
      role: v.role,
      model3d: v.model3d,
    }),
    ParameterDeclarations: buildParameterDeclarations(v.parameterDeclarations),
    BoundingBox: buildBoundingBox(
      v.boundingBox,
      bindings ? getSubBindings(bindings, 'boundingBox') : undefined,
    ),
    Performance: buildPerformance(
      v.performance,
      bindings ? getSubBindings(bindings, 'performance') : undefined,
    ),
    Axles: buildAxles(v.axles, bindings ? getSubBindings(bindings, 'axles') : undefined),
    Properties: buildProperties(v.properties),
  };
}

export function buildPedestrian(p: PedestrianDefinition): Record<string, unknown> {
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

export function buildMiscObject(m: MiscObjectDefinition): Record<string, unknown> {
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

function buildCatalogReference(cr: CatalogReference): Record<string, unknown> {
  const result: Record<string, unknown> = buildAttrs({
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

function buildBoundingBox(
  bb: BoundingBox,
  bindings?: Record<string, string>,
): Record<string, unknown> {
  return {
    Center: buildAttrs(
      { x: bb.center.x, y: bb.center.y, z: bb.center.z },
      bindings ? getSubBindings(bindings, 'center') : undefined,
    ),
    Dimensions: buildAttrs(
      { width: bb.dimensions.width, length: bb.dimensions.length, height: bb.dimensions.height },
      bindings ? getSubBindings(bindings, 'dimensions') : undefined,
    ),
  };
}

function buildPerformance(
  p: Performance,
  bindings?: Record<string, string>,
): Record<string, string> {
  return buildAttrs(
    {
      maxSpeed: p.maxSpeed,
      maxAcceleration: p.maxAcceleration,
      maxDeceleration: p.maxDeceleration,
      mass: p.mass,
    },
    bindings,
  );
}

function buildAxles(a: Axles, bindings?: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    FrontAxle: buildAxle(a.frontAxle, bindings ? getSubBindings(bindings, 'frontAxle') : undefined),
    RearAxle: buildAxle(a.rearAxle, bindings ? getSubBindings(bindings, 'rearAxle') : undefined),
  };
  if (a.additionalAxles.length > 0) {
    result.AdditionalAxle = a.additionalAxles.map((ax) => buildAxle(ax));
  }
  return result;
}

function buildAxle(a: Axle, bindings?: Record<string, string>): Record<string, string> {
  return buildAttrs(
    {
      maxSteering: a.maxSteering,
      wheelDiameter: a.wheelDiameter,
      trackWidth: a.trackWidth,
      positionX: a.positionX,
      positionZ: a.positionZ,
    },
    bindings,
  );
}

function buildProperties(props: Property[]): Record<string, unknown> | string {
  if (props.length === 0) return '';
  return {
    Property: props.map((p) => buildAttrs({ name: p.name, value: p.value })),
  };
}

function buildObjectController(oc: ObjectController): Record<string, unknown> {
  const ctrl = oc.controller;
  if (ctrl.kind === 'controller') {
    return {
      ...buildAttrs({ name: oc.name }),
      Controller: buildControllerDefinition(ctrl),
    };
  }
  // CatalogReference
  return {
    ...buildAttrs({ name: oc.name }),
    CatalogReference: buildCatalogReference(ctrl as CatalogReference),
  };
}

export function buildControllerDefinition(c: ControllerDefinition): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...buildAttrs({ name: c.name, controllerType: c.controllerType }),
  };
  if (c.parameterDeclarations && c.parameterDeclarations.length > 0) {
    result.ParameterDeclarations = buildParameterDeclarations(c.parameterDeclarations);
  }
  result.Properties = buildProperties(c.properties);
  return result;
}
