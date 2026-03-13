/**
 * Factory functions for creating default OpenDRIVE elements.
 */

import type {
  OpenDriveDocument,
  OdrHeader,
  OdrRoad,
  OdrLaneSection,
  OdrLane,
  OdrSignal,
  OdrController,
  OdrJunction,
  OdrJunctionConnection,
} from '@osce/shared';

export function createDefaultDocument(): OpenDriveDocument {
  return {
    header: createDefaultHeader(),
    roads: [],
    controllers: [],
    junctions: [],
  };
}

export function createDefaultHeader(): OdrHeader {
  return {
    revMajor: 1,
    revMinor: 6,
    name: '',
    date: new Date().toISOString().split('T')[0],
  };
}

export function createDefaultLane(id: number, type = 'driving'): OdrLane {
  return {
    id,
    type,
    width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
    roadMarks: [{ sOffset: 0, type: 'solid', color: 'standard' }],
  };
}

export function createDefaultCenterLane(): OdrLane {
  return {
    id: 0,
    type: 'none',
    width: [],
    roadMarks: [{ sOffset: 0, type: 'solid', color: 'yellow' }],
  };
}

export function createDefaultLaneSection(s = 0): OdrLaneSection {
  return {
    s,
    leftLanes: [createDefaultLane(1, 'driving')],
    centerLane: createDefaultCenterLane(),
    rightLanes: [createDefaultLane(-1, 'driving')],
  };
}

export function createRoadFromDefaults(id: string, name = ''): OdrRoad {
  return {
    id,
    name,
    length: 100,
    junction: '-1',
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
    elevationProfile: [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
    lateralProfile: [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
    laneOffset: [],
    lanes: [createDefaultLaneSection()],
    objects: [],
    signals: [],
  };
}

export function createSignalFromDefaults(id: string): OdrSignal {
  return {
    id,
    s: 0,
    t: 0,
    orientation: '+',
  };
}

export function createControllerFromDefaults(id: string, name = ''): OdrController {
  return {
    id,
    name,
    controls: [],
  };
}

export function createJunctionFromDefaults(id: string, name = ''): OdrJunction {
  return {
    id,
    name,
    connections: [],
  };
}

export function createJunctionConnectionFromDefaults(
  id: string,
  incomingRoad: string,
  connectingRoad: string,
): OdrJunctionConnection {
  return {
    id,
    incomingRoad,
    connectingRoad,
    contactPoint: 'start',
    laneLinks: [],
  };
}
