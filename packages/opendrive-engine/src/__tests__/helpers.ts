/**
 * Shared test helpers and fixtures for OpenDRIVE engine tests.
 */

import type { OpenDriveDocument, OdrRoad } from '@osce/shared';

/**
 * Create a minimal valid OpenDRIVE document for testing.
 */
export function createTestDocument(): OpenDriveDocument {
  return {
    header: {
      revMajor: 1,
      revMinor: 7,
      name: 'TestRoad',
      date: '2024-01-01',
    },
    roads: [],
    controllers: [],
    junctions: [],
  };
}

/**
 * Create a test road with a simple line geometry.
 */
export function createTestRoad(overrides?: Partial<OdrRoad>): OdrRoad {
  return {
    id: overrides?.id ?? 'road-1',
    name: overrides?.name ?? 'TestRoad',
    length: overrides?.length ?? 100,
    junction: overrides?.junction ?? '-1',
    planView: overrides?.planView ?? [
      { s: 0, x: 0, y: 0, hdg: 0, length: 50, type: 'line' },
      { s: 50, x: 50, y: 0, hdg: 0, length: 50, type: 'line' },
    ],
    elevationProfile: overrides?.elevationProfile ?? [],
    lateralProfile: overrides?.lateralProfile ?? [],
    laneOffset: overrides?.laneOffset ?? [],
    lanes: overrides?.lanes ?? [
      {
        s: 0,
        leftLanes: [],
        centerLane: { id: 0, type: 'driving', width: [], roadMarks: [] },
        rightLanes: [
          {
            id: -1,
            type: 'driving',
            width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
            roadMarks: [],
          },
        ],
      },
    ],
    objects: overrides?.objects ?? [],
    signals: overrides?.signals ?? [],
  };
}

/**
 * Creates mock getDoc/setDoc/markDirtyRoad closures for testing commands in isolation.
 */
export function createMockGetSet(initial: OpenDriveDocument) {
  let doc = initial;
  const dirtyRoads: string[] = [];
  return {
    getDoc: () => doc,
    setDoc: (newDoc: OpenDriveDocument) => {
      doc = newDoc;
    },
    markDirtyRoad: (roadId: string) => {
      dirtyRoads.push(roadId);
    },
    getLatest: () => doc,
    getDirtyRoads: () => dirtyRoads,
  };
}
