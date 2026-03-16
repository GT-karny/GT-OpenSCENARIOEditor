/**
 * Tests for junction link integrity during junction creation.
 *
 * Verifies that:
 * 1. Segment roads get proper junction links (predecessor/successor)
 * 2. Stale incomingRoad references are repaired during re-splits
 * 3. setRoadLink warns when road not found
 */

import { describe, it, expect, vi } from 'vitest';
import type { OdrRoad, OdrJunctionConnection } from '@osce/shared';
import { createOpenDriveStore } from '../../store/opendrive-store.js';
import { createEditorMetadataStore } from '../../store/editor-metadata-store.js';
import {
  executeJunctionCreationPlan,
} from '../../operations/junction-execution.js';
import type { JunctionCreationPlan, RoadSplitInfo } from '../../operations/junction-operations.js';
import type { JunctionMetadata, VirtualRoad } from '../../store/editor-metadata-types.js';
import { createTestRoad } from '../helpers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSegmentRoad(
  id: string,
  length: number,
  hdg = 0,
  x = 0,
  y = 0,
): OdrRoad {
  return createTestRoad({
    id,
    length,
    planView: [{ s: 0, x, y, hdg, length, type: 'line' }],
    lanes: [
      {
        s: 0,
        leftLanes: [
          {
            id: 1,
            type: 'driving',
            width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
            roadMarks: [],
          },
        ],
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
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
  });
}

function makeConnectingRoad(
  id: string,
  predId: string,
  predContact: 'start' | 'end',
  succId: string,
  succContact: 'start' | 'end',
  junctionId: string,
): OdrRoad {
  return createTestRoad({
    id,
    length: 14,
    junction: junctionId,
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 14, type: 'line' }],
    link: {
      predecessor: { elementType: 'road', elementId: predId, contactPoint: predContact },
      successor: { elementType: 'road', elementId: succId, contactPoint: succContact },
    },
  });
}

/**
 * Build a junction plan for two crossing roads with 4 arms.
 */
function makeCrossingPlan(): {
  plan: JunctionCreationPlan;
  originalRoadA: OdrRoad;
  originalRoadB: OdrRoad;
} {
  const originalRoadA = createTestRoad({
    id: '1',
    name: 'RoadA',
    length: 100,
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
  });
  const originalRoadB = createTestRoad({
    id: '2',
    name: 'RoadB',
    length: 100,
    planView: [{ s: 0, x: 50, y: -50, hdg: Math.PI / 2, length: 100, type: 'line' }],
  });

  const segA_before = makeSegmentRoad('10', 43, 0, 0, 0);
  const segA_after = makeSegmentRoad('11', 43, 0, 57, 0);
  const segB_before = makeSegmentRoad('20', 43, Math.PI / 2, 50, -50);
  const segB_after = makeSegmentRoad('21', 43, Math.PI / 2, 50, 57);

  const junctionId = '100';
  const connections: OdrJunctionConnection[] = [
    { id: 'c1', incomingRoad: '10', connectingRoad: 'conn-1', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
    { id: 'c2', incomingRoad: '11', connectingRoad: 'conn-2', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
    { id: 'c3', incomingRoad: '20', connectingRoad: 'conn-3', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
    { id: 'c4', incomingRoad: '21', connectingRoad: 'conn-4', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
  ];

  const connectingRoads: OdrRoad[] = [
    makeConnectingRoad('conn-1', '10', 'end', '21', 'start', junctionId),
    makeConnectingRoad('conn-2', '11', 'start', '20', 'end', junctionId),
    makeConnectingRoad('conn-3', '20', 'end', '11', 'start', junctionId),
    makeConnectingRoad('conn-4', '21', 'start', '10', 'end', junctionId),
  ];

  const roadSplits: RoadSplitInfo[] = [
    { originalRoadId: '1', beforeSegment: segA_before, afterSegment: segA_after },
    { originalRoadId: '2', beforeSegment: segB_before, afterSegment: segB_after },
  ];

  const virtualRoads: VirtualRoad[] = [
    { virtualRoadId: '1', segmentRoadIds: ['10', '11'] },
    { virtualRoadId: '2', segmentRoadIds: ['20', '21'] },
  ];

  const junctionMetadata: JunctionMetadata = {
    junctionId,
    intersectingVirtualRoadIds: ['1', '2'],
    connectingRoadIds: ['conn-1', 'conn-2', 'conn-3', 'conn-4'],
    autoCreated: true,
  };

  const plan: JunctionCreationPlan = {
    junction: {
      id: junctionId,
      name: 'Junction 100',
      type: 'default',
      connections,
    },
    connectingRoads,
    junctionMetadata,
    incomingEndpoints: [
      { roadId: '10', contactPoint: 'end' },
      { roadId: '11', contactPoint: 'start' },
      { roadId: '20', contactPoint: 'end' },
      { roadId: '21', contactPoint: 'start' },
    ],
    roadSplits,
    virtualRoads,
  };

  return { plan, originalRoadA, originalRoadB };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('junction link integrity', () => {
  it('sets junction links on all segment roads after creation', () => {
    const odrStoreApi = createOpenDriveStore();
    const metaStoreApi = createEditorMetadataStore();

    const { plan, originalRoadA, originalRoadB } = makeCrossingPlan();
    const odrStore = odrStoreApi.getState();
    odrStore.addRoad(originalRoadA);
    odrStore.addRoad(originalRoadB);

    odrStore.beginBatch('Create junction');
    const result = executeJunctionCreationPlan(odrStore, metaStoreApi.getState(), plan);
    odrStore.endBatch();

    const doc = odrStore.getDocument();

    // Every segment road should have a link to the junction
    const segmentIds = ['10', '11', '20', '21'];
    for (const segId of segmentIds) {
      const road = doc.roads.find((r) => r.id === segId);
      expect(road).toBeDefined();

      const hasPredJunction =
        road?.link?.predecessor?.elementType === 'junction' &&
        road?.link?.predecessor?.elementId === result.junctionId;
      const hasSuccJunction =
        road?.link?.successor?.elementType === 'junction' &&
        road?.link?.successor?.elementId === result.junctionId;

      expect(
        hasPredJunction || hasSuccJunction,
        `Segment road ${segId} should have a junction link (pred or succ)`,
      ).toBe(true);
    }

    // Specifically: before segments (10, 20) should have successor=junction
    const seg10 = doc.roads.find((r) => r.id === '10');
    expect(seg10?.link?.successor?.elementType).toBe('junction');
    expect(seg10?.link?.successor?.elementId).toBe(result.junctionId);

    const seg20 = doc.roads.find((r) => r.id === '20');
    expect(seg20?.link?.successor?.elementType).toBe('junction');
    expect(seg20?.link?.successor?.elementId).toBe(result.junctionId);

    // After segments (11, 21) should have predecessor=junction
    const seg11 = doc.roads.find((r) => r.id === '11');
    expect(seg11?.link?.predecessor?.elementType).toBe('junction');
    expect(seg11?.link?.predecessor?.elementId).toBe(result.junctionId);

    const seg21 = doc.roads.find((r) => r.id === '21');
    expect(seg21?.link?.predecessor?.elementType).toBe('junction');
    expect(seg21?.link?.predecessor?.elementId).toBe(result.junctionId);
  });

  it('junction connections reference existing roads', () => {
    const odrStoreApi = createOpenDriveStore();
    const metaStoreApi = createEditorMetadataStore();

    const { plan, originalRoadA, originalRoadB } = makeCrossingPlan();
    const odrStore = odrStoreApi.getState();
    odrStore.addRoad(originalRoadA);
    odrStore.addRoad(originalRoadB);

    odrStore.beginBatch('Create junction');
    const result = executeJunctionCreationPlan(odrStore, metaStoreApi.getState(), plan);
    odrStore.endBatch();

    const doc = odrStore.getDocument();
    const junction = doc.junctions.find((j) => j.id === result.junctionId);
    expect(junction).toBeDefined();

    const roadIds = new Set(doc.roads.map((r) => r.id));
    for (const conn of junction!.connections) {
      expect(
        roadIds.has(conn.incomingRoad),
        `incomingRoad "${conn.incomingRoad}" should exist in document`,
      ).toBe(true);
      expect(
        roadIds.has(conn.connectingRoad),
        `connectingRoad "${conn.connectingRoad}" should exist in document`,
      ).toBe(true);
    }
  });

  it('repairs stale incomingRoad references when road is re-split', () => {
    const odrStoreApi = createOpenDriveStore();
    const metaStoreApi = createEditorMetadataStore();

    // First junction: roads 1 and 2 cross
    const { plan: plan1, originalRoadA, originalRoadB } = makeCrossingPlan();
    const odrStore = odrStoreApi.getState();
    odrStore.addRoad(originalRoadA);
    odrStore.addRoad(originalRoadB);

    odrStore.beginBatch('Create junction 1');
    const result1 = executeJunctionCreationPlan(odrStore, metaStoreApi.getState(), plan1);
    odrStore.endBatch();

    // Now simulate a second junction that re-splits segment road '11'
    // (the after-segment of road A). This creates sub-segments '30' and '31'.
    const seg11 = odrStore.getDocument().roads.find((r) => r.id === '11');
    expect(seg11).toBeDefined();

    const subSeg30 = makeSegmentRoad('30', 20, 0, 57, 0);
    const subSeg31 = makeSegmentRoad('31', 23, 0, 77, 0);

    // Build a second junction plan that splits road '11'
    const plan2: JunctionCreationPlan = {
      junction: {
        id: '200',
        name: 'Junction 200',
        type: 'default',
        connections: [
          { id: 'c5', incomingRoad: '30', connectingRoad: 'conn-5', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
        ],
      },
      connectingRoads: [
        makeConnectingRoad('conn-5', '30', 'end', '31', 'start', '200'),
      ],
      junctionMetadata: {
        junctionId: '200',
        intersectingVirtualRoadIds: ['1'],
        connectingRoadIds: ['conn-5'],
        autoCreated: true,
      },
      incomingEndpoints: [
        { roadId: '30', contactPoint: 'end' },
        { roadId: '31', contactPoint: 'start' },
      ],
      roadSplits: [
        { originalRoadId: '11', beforeSegment: subSeg30, afterSegment: subSeg31 },
      ],
      virtualRoads: [],
    };

    odrStore.beginBatch('Create junction 2');
    executeJunctionCreationPlan(odrStore, metaStoreApi.getState(), plan2);
    odrStore.endBatch();

    // Verify: junction 1's connections should now reference '30' instead of '11'
    // (since '11' was re-split into '30' + '31')
    const doc = odrStore.getDocument();
    const junction1 = doc.junctions.find((j) => j.id === result1.junctionId);
    expect(junction1).toBeDefined();

    // Check that no connection references the now-removed road '11'
    const referencesOldRoad = junction1!.connections.some(
      (c) => c.incomingRoad === '11',
    );
    expect(
      referencesOldRoad,
      'Junction 1 should not reference removed road "11" as incomingRoad',
    ).toBe(false);

    // All incomingRoads should exist in the document
    const roadIds = new Set(doc.roads.map((r) => r.id));
    for (const conn of junction1!.connections) {
      expect(
        roadIds.has(conn.incomingRoad),
        `incomingRoad "${conn.incomingRoad}" should exist after re-split`,
      ).toBe(true);
    }
  });

  it('logs warning when setRoadLink targets non-existent road', () => {
    const odrStoreApi = createOpenDriveStore();
    const odrStore = odrStoreApi.getState();

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    odrStore.setRoadLink('non-existent-road', 'successor', {
      elementType: 'junction',
      elementId: '1',
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('non-existent-road'),
    );

    warnSpy.mockRestore();
  });
});
