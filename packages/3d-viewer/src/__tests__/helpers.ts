/**
 * Test data factories for @osce/3d-viewer tests.
 */

import type {
  OpenDriveDocument,
  OdrRoad,
  OdrLaneSection,
  OdrLane,
  OdrLaneWidth,
  ScenarioDocument,
  ScenarioEntity,
  Storyboard,
  Init,
  EntityInitActions,
  InitPrivateAction,
  VehicleDefinition,
  PedestrianDefinition,
} from '@osce/shared';

/**
 * Create a straight road OpenDRIVE document.
 * Single road, 100m, with one driving lane on each side.
 */
export function makeStraightRoadDoc(): OpenDriveDocument {
  return {
    header: {
      revMajor: 1,
      revMinor: 7,
      name: 'TestRoad',
      date: '2024-01-01',
    },
    roads: [makeStraightRoad()],
    controllers: [],
    junctions: [],
  };
}

/**
 * Create a single straight road: 100m, 1 left lane + center + 1 right lane.
 * Each lane is 3.5m wide (standard driving lane).
 */
export function makeStraightRoad(): OdrRoad {
  const laneWidth: OdrLaneWidth = { sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 };

  const leftLane: OdrLane = {
    id: 1,
    type: 'driving',
    width: [laneWidth],
    roadMarks: [{ sOffset: 0, type: 'solid', color: 'white', width: 0.15 }],
  };

  const centerLane: OdrLane = {
    id: 0,
    type: 'none',
    width: [],
    roadMarks: [{ sOffset: 0, type: 'solid', color: 'yellow', width: 0.15 }],
  };

  const rightLane: OdrLane = {
    id: -1,
    type: 'driving',
    width: [laneWidth],
    roadMarks: [{ sOffset: 0, type: 'broken', color: 'white', width: 0.12 }],
  };

  const laneSection: OdrLaneSection = {
    s: 0,
    leftLanes: [leftLane],
    centerLane,
    rightLanes: [rightLane],
  };

  return {
    id: '1',
    name: 'StraightRoad',
    length: 100,
    junction: '-1',
    planView: [
      {
        s: 0,
        x: 0,
        y: 0,
        hdg: 0,
        length: 100,
        type: 'line',
      },
    ],
    elevationProfile: [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
    lateralProfile: [],
    laneOffset: [],
    lanes: [laneSection],
    objects: [],
    signals: [],
  };
}

/**
 * Create a scenario document with entities and init positions.
 */
export function makeScenarioWithEntities(): ScenarioDocument {
  const egoVehicle: ScenarioEntity = {
    id: 'entity-1',
    name: 'Ego',
    type: 'vehicle',
    definition: makeVehicleDefinition('EgoCar'),
  };

  const targetVehicle: ScenarioEntity = {
    id: 'entity-2',
    name: 'Target',
    type: 'vehicle',
    definition: makeVehicleDefinition('TargetCar'),
  };

  const pedestrian: ScenarioEntity = {
    id: 'entity-3',
    name: 'Pedestrian1',
    type: 'pedestrian',
    definition: makePedestrianDefinition(),
  };

  const egoInit: EntityInitActions = {
    id: 'einit-1',
    entityRef: 'Ego',
    privateActions: [
      makeInitTeleport('tp-1', { type: 'worldPosition', x: 10, y: 0, z: 0, h: 0 }),
    ],
  };

  const targetInit: EntityInitActions = {
    id: 'einit-2',
    entityRef: 'Target',
    privateActions: [
      makeInitTeleport('tp-2', { type: 'worldPosition', x: 50, y: -3.5, z: 0, h: 0 }),
    ],
  };

  const pedInit: EntityInitActions = {
    id: 'einit-3',
    entityRef: 'Pedestrian1',
    privateActions: [
      makeInitTeleport('tp-3', { type: 'worldPosition', x: 30, y: 5, z: 0, h: 1.57 }),
    ],
  };

  const init: Init = {
    id: 'init-1',
    globalActions: [],
    entityActions: [egoInit, targetInit, pedInit],
  };

  const storyboard: Storyboard = {
    id: 'sb-1',
    init,
    stories: [],
    stopTrigger: { id: 'stop-1', conditionGroups: [] },
  };

  return {
    id: 'doc-1',
    fileHeader: {
      revMajor: 1,
      revMinor: 2,
      date: '2024-01-01',
      description: 'Test scenario',
      author: 'test',
    },
    parameterDeclarations: [],
    variableDeclarations: [],
    catalogLocations: {},
    roadNetwork: {},
    entities: [egoVehicle, targetVehicle, pedestrian],
    storyboard,
    _editor: {
      formatVersion: '1.0',
      lastModified: '2024-01-01',
      appliedTemplates: [],
      nodePositions: {},
      nodeCollapsed: {},
    },
  };
}

function makeVehicleDefinition(name: string): VehicleDefinition {
  return {
    kind: 'vehicle',
    name,
    vehicleCategory: 'car',
    parameterDeclarations: [],
    performance: { maxSpeed: 69.444, maxAcceleration: 10, maxDeceleration: 10 },
    boundingBox: {
      center: { x: 1.4, y: 0, z: 0.9 },
      dimensions: { width: 2.0, length: 4.5, height: 1.8 },
    },
    axles: {
      frontAxle: { maxSteering: 0.5, wheelDiameter: 0.6, trackWidth: 1.8, positionX: 3.1, positionZ: 0.3 },
      rearAxle: { maxSteering: 0, wheelDiameter: 0.6, trackWidth: 1.8, positionX: 0, positionZ: 0.3 },
      additionalAxles: [],
    },
    properties: [],
  };
}

function makePedestrianDefinition(): PedestrianDefinition {
  return {
    kind: 'pedestrian',
    name: 'walker',
    pedestrianCategory: 'pedestrian',
    mass: 75,
    model: 'walker',
    parameterDeclarations: [],
    boundingBox: {
      center: { x: 0, y: 0, z: 0.85 },
      dimensions: { width: 0.5, length: 0.5, height: 1.7 },
    },
    properties: [],
  };
}

function makeInitTeleport(
  id: string,
  position: { type: 'worldPosition'; x: number; y: number; z?: number; h?: number },
): InitPrivateAction {
  return {
    id,
    action: {
      type: 'teleportAction',
      position,
    },
  };
}
