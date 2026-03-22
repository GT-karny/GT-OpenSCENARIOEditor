import { describe, it, expect } from 'vitest';
import type { OdrRoad, OdrJunctionConnection } from '@osce/shared';
import { createOpenDriveStore } from '../../store/opendrive-store.js';
import { createEditorMetadataStore } from '../../store/editor-metadata-store.js';
import {
  executeJunctionCreationPlan,
  executeJunctionRemoval,
  syncLaneLinksForDirectConnections,
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
        leftLanes: [],
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
 * Build a basic 4-arm junction plan for two crossing roads.
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

describe('executeJunctionCreationPlan', () => {
  it('replaces original roads with segments and adds junction', () => {
    const odrStoreApi = createOpenDriveStore();
    const metaStoreApi = createEditorMetadataStore();

    const { plan, originalRoadA, originalRoadB } = makeCrossingPlan();

    // Add original roads to the store
    const odrStore = odrStoreApi.getState();
    odrStore.addRoad(originalRoadA);
    odrStore.addRoad(originalRoadB);

    // Execute the plan
    odrStore.beginBatch('Create junction');
    const result = executeJunctionCreationPlan(odrStore, metaStoreApi.getState(), plan);
    odrStore.endBatch();

    const doc = odrStore.getDocument();

    // Original roads should be removed
    expect(doc.roads.find((r) => r.id === '1')).toBeUndefined();
    expect(doc.roads.find((r) => r.id === '2')).toBeUndefined();

    // Segment roads should exist
    expect(doc.roads.some((r) => r.id === '10')).toBe(true);
    expect(doc.roads.some((r) => r.id === '11')).toBe(true);
    expect(doc.roads.some((r) => r.id === '20')).toBe(true);
    expect(doc.roads.some((r) => r.id === '21')).toBe(true);

    // Junction should exist
    expect(doc.junctions.length).toBe(1);
    expect(result.junctionId).toBeTruthy();

    // Connecting roads should exist
    expect(result.connectingRoadIds.length).toBe(4);
    for (const connId of result.connectingRoadIds) {
      expect(doc.roads.some((r) => r.id === connId)).toBe(true);
    }
  });

  it('sets road links on segments pointing to junction', () => {
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

    // segA_before (id='10') should have successor pointing to junction
    const seg10 = doc.roads.find((r) => r.id === '10');
    expect(seg10?.link?.successor?.elementType).toBe('junction');
    expect(seg10?.link?.successor?.elementId).toBe(result.junctionId);

    // segA_after (id='11') should have predecessor pointing to junction
    const seg11 = doc.roads.find((r) => r.id === '11');
    expect(seg11?.link?.predecessor?.elementType).toBe('junction');
    expect(seg11?.link?.predecessor?.elementId).toBe(result.junctionId);
  });

  it('persists virtual road and junction metadata', () => {
    const odrStoreApi = createOpenDriveStore();
    const metaStoreApi = createEditorMetadataStore();

    const { plan, originalRoadA, originalRoadB } = makeCrossingPlan();
    const odrStore = odrStoreApi.getState();
    odrStore.addRoad(originalRoadA);
    odrStore.addRoad(originalRoadB);

    odrStore.beginBatch('Create junction');
    const result = executeJunctionCreationPlan(odrStore, metaStoreApi.getState(), plan);
    odrStore.endBatch();

    // Read fresh metadata state after mutations
    const metaState = metaStoreApi.getState();

    // VirtualRoad metadata
    const vr1 = metaState.metadata.virtualRoads.find((vr) => vr.virtualRoadId === '1');
    expect(vr1).toBeDefined();
    expect(vr1?.segmentRoadIds).toEqual(['10', '11']);

    const vr2 = metaState.metadata.virtualRoads.find((vr) => vr.virtualRoadId === '2');
    expect(vr2).toBeDefined();
    expect(vr2?.segmentRoadIds).toEqual(['20', '21']);

    // Junction metadata
    const jMeta = metaState.getJunctionMetadata(result.junctionId);
    expect(jMeta).toBeDefined();
    expect(jMeta?.autoCreated).toBe(true);
    expect(jMeta?.connectingRoadIds.length).toBe(4);
  });

  it('supports batch undo to restore original state', () => {
    const odrStoreApi = createOpenDriveStore();
    const metaStoreApi = createEditorMetadataStore();

    const { plan, originalRoadA, originalRoadB } = makeCrossingPlan();
    const odrStore = odrStoreApi.getState();
    odrStore.addRoad(originalRoadA);
    odrStore.addRoad(originalRoadB);

    // Snapshot before junction creation
    const roadCountBefore = odrStore.getDocument().roads.length;

    odrStore.beginBatch('Create junction');
    executeJunctionCreationPlan(odrStore, metaStoreApi.getState(), plan);
    odrStore.endBatch();

    // After creation: more roads, 1 junction
    const docAfter = odrStore.getDocument();
    expect(docAfter.junctions.length).toBe(1);
    expect(docAfter.roads.length).toBeGreaterThan(roadCountBefore);

    // Undo: should restore to original state
    odrStore.undo();
    const docRestored = odrStore.getDocument();
    expect(docRestored.junctions.length).toBe(0);
    expect(docRestored.roads.length).toBe(roadCountBefore);
    expect(docRestored.roads.some((r) => r.id === '1')).toBe(true);
    expect(docRestored.roads.some((r) => r.id === '2')).toBe(true);
  });
});

describe('syncLaneLinksForDirectConnections', () => {
  it('sets lane predecessor/successor IDs for road-to-road connections', () => {
    const odrStoreApi = createOpenDriveStore();
    const odrStore = odrStoreApi.getState();

    // Create two directly connected roads: road43 → road75
    const road43 = createTestRoad({
      id: '43',
      length: 100,
      planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
      link: {
        successor: { elementType: 'road', elementId: '75', contactPoint: 'start' },
      },
      lanes: [
        {
          s: 0,
          leftLanes: [
            { id: 1, type: 'driving', width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }], roadMarks: [] },
          ],
          centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
          rightLanes: [
            { id: -1, type: 'driving', width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }], roadMarks: [] },
          ],
        },
      ],
    });
    const road75 = createTestRoad({
      id: '75',
      length: 200,
      planView: [{ s: 0, x: 100, y: 0, hdg: 0, length: 200, type: 'line' }],
      link: {
        predecessor: { elementType: 'road', elementId: '43', contactPoint: 'end' },
      },
      lanes: [
        {
          s: 0,
          leftLanes: [
            { id: 1, type: 'driving', width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }], roadMarks: [] },
          ],
          centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
          rightLanes: [
            { id: -1, type: 'driving', width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }], roadMarks: [] },
          ],
        },
      ],
    });

    odrStore.addRoad(road43);
    odrStore.addRoad(road75);

    // Sync lane links
    syncLaneLinksForDirectConnections(odrStore, ['43', '75']);

    const doc = odrStore.getDocument();

    // Road 43's lanes should have successorId set
    const r43 = doc.roads.find((r) => r.id === '43')!;
    const r43LastSection = r43.lanes[r43.lanes.length - 1];
    expect(r43LastSection.rightLanes[0].link?.successorId).toBe(-1);
    expect(r43LastSection.leftLanes[0].link?.successorId).toBe(1);

    // Road 75's lanes should have predecessorId set
    const r75 = doc.roads.find((r) => r.id === '75')!;
    const r75FirstSection = r75.lanes[0];
    expect(r75FirstSection.rightLanes[0].link?.predecessorId).toBe(-1);
    expect(r75FirstSection.leftLanes[0].link?.predecessorId).toBe(1);
  });

  it('sets lane links on segment roads with inherited road-to-road connections', () => {
    const odrStoreApi = createOpenDriveStore();
    const metaStoreApi = createEditorMetadataStore();

    // Create Road C that will be the successor of Road A
    const roadC = createTestRoad({
      id: '3',
      length: 100,
      planView: [{ s: 0, x: 100, y: 0, hdg: 0, length: 100, type: 'line' }],
      link: {
        predecessor: { elementType: 'road', elementId: '1', contactPoint: 'end' },
      },
    });

    // Road A with successor = Road C
    const { plan, originalRoadA, originalRoadB } = makeCrossingPlan();
    const odrStore = odrStoreApi.getState();

    // Set Road A's successor to Road C before adding it
    const roadAWithLink = {
      ...originalRoadA,
      link: { successor: { elementType: 'road' as const, elementId: '3', contactPoint: 'start' as const } },
    };
    odrStore.addRoad(roadAWithLink);
    odrStore.addRoad(originalRoadB);
    odrStore.addRoad(roadC);

    odrStore.beginBatch('Create junction');
    executeJunctionCreationPlan(odrStore, metaStoreApi.getState(), plan);
    odrStore.endBatch();

    const doc = odrStore.getDocument();

    // After segment '11' should inherit successor = Road C
    const seg11 = doc.roads.find((r) => r.id === '11');
    expect(seg11?.link?.successor?.elementType).toBe('road');
    expect(seg11?.link?.successor?.elementId).toBe('3');

    // Lane links should be set on segment 11 and Road C
    const seg11LastSection = seg11!.lanes[seg11!.lanes.length - 1];
    expect(seg11LastSection.rightLanes[0].link?.successorId).toBe(-1);

    const rC = doc.roads.find((r) => r.id === '3')!;
    const rCFirstSection = rC.lanes[0];
    expect(rCFirstSection.rightLanes[0].link?.predecessorId).toBe(-1);
  });
});

describe('executeJunctionRemoval', () => {
  it('removes junction, connecting roads, and cleans up metadata', () => {
    const odrStoreApi = createOpenDriveStore();
    const metaStoreApi = createEditorMetadataStore();

    const { plan, originalRoadA, originalRoadB } = makeCrossingPlan();
    const odrStore = odrStoreApi.getState();
    odrStore.addRoad(originalRoadA);
    odrStore.addRoad(originalRoadB);

    // Create junction
    odrStore.beginBatch('Create junction');
    const result = executeJunctionCreationPlan(odrStore, metaStoreApi.getState(), plan);
    odrStore.endBatch();

    const junctionId = result.junctionId;
    const meta = metaStoreApi.getState().getJunctionMetadata(junctionId);
    expect(meta).toBeDefined();

    // Remove junction
    odrStore.beginBatch('Remove junction');
    executeJunctionRemoval(odrStore, metaStoreApi.getState(), junctionId, meta!);
    odrStore.endBatch();

    const doc = odrStore.getDocument();

    // Junction should be gone
    expect(doc.junctions.length).toBe(0);

    // Connecting roads should be gone
    for (const connId of result.connectingRoadIds) {
      expect(doc.roads.some((r) => r.id === connId)).toBe(false);
    }

    // Segment roads should be gone (removal deletes them)
    expect(doc.roads.some((r) => r.id === '10')).toBe(false);
    expect(doc.roads.some((r) => r.id === '11')).toBe(false);
    expect(doc.roads.some((r) => r.id === '20')).toBe(false);
    expect(doc.roads.some((r) => r.id === '21')).toBe(false);

    // Metadata should be cleaned up
    const freshMeta = metaStoreApi.getState();
    expect(freshMeta.getJunctionMetadata(junctionId)).toBeUndefined();
    expect(freshMeta.metadata.virtualRoads.length).toBe(0);
  });
});
