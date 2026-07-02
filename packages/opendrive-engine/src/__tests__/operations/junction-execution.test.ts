import { describe, it, expect } from 'vitest';
import type { OdrRoad, OdrGeometry, OdrJunctionConnection } from '@osce/shared';
import { evaluateReferenceLineAtS } from '@osce/opendrive';
import { createOpenDriveStore } from '../../store/opendrive-store.js';
import { createEditorMetadataStore } from '../../store/editor-metadata-store.js';
import {
  executeJunctionCreationPlan,
  executeJunctionRemoval,
  regenerateJunctionConnections,
  syncLaneLinksForDirectConnections,
} from '../../operations/junction-execution.js';
import type { JunctionCreationPlan, RoadSplitInfo } from '../../operations/junction-operations.js';
import type { JunctionMetadata, VirtualRoad } from '../../store/editor-metadata-types.js';
import { createTestRoad } from '../helpers.js';

/** Evaluate a plan view at s using the canonical reference-line evaluator. */
function evaluateAtS(
  planView: readonly OdrGeometry[],
  s: number,
): { x: number; y: number; hdg: number } {
  return evaluateReferenceLineAtS(planView, s);
}

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

describe('regenerateJunctionConnections', () => {
  /** Bidirectional road arm (one left + one right driving lane). */
  function makeCrossArm(id: string, length: number, hdg: number, x: number, y: number): OdrRoad {
    const drivingLane = (laneId: number) => ({
      id: laneId,
      type: 'driving' as const,
      width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
      roadMarks: [],
    });
    return createTestRoad({
      id,
      length,
      planView: [{ s: 0, x, y, hdg, length, type: 'line' }],
      lanes: [
        {
          s: 0,
          leftLanes: [drivingLane(1)],
          centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
          rightLanes: [drivingLane(-1)],
        },
      ],
    });
  }

  /**
   * Build a store with a "+" junction: four incoming road arms whose endpoints
   * meet 7m out from the origin (leaving a central gap), plus a junction whose
   * connections reference those incoming roads and placeholder connecting roads
   * that regeneration should replace.
   */
  function setupCrossJunction() {
    const odrStoreApi = createOpenDriveStore();
    const odrStore = odrStoreApi.getState();

    // Four incoming roads pointing at the origin from N/E/S/W.
    // Each faces the junction at contactPoint 'end', ending 7m out from center.
    const west = makeCrossArm('10', 43, 0, -50, 0); // end at (-7,0) hdg 0
    const south = makeCrossArm('20', 43, Math.PI / 2, 0, -50); // end at (0,-7) hdg 90
    const east = makeCrossArm('30', 43, Math.PI, 50, 0); // end at (7,0) hdg 180
    const north = makeCrossArm('40', 43, -Math.PI / 2, 0, 50); // end at (0,7) hdg -90

    odrStore.addRoad(west);
    odrStore.addRoad(south);
    odrStore.addRoad(east);
    odrStore.addRoad(north);

    // Placeholder connecting roads that regeneration should delete.
    const placeholder1 = makeConnectingRoad('old-1', '10', 'end', '30', 'start', '100');
    const placeholder2 = makeConnectingRoad('old-2', '20', 'end', '40', 'start', '100');
    odrStore.addRoad(placeholder1);
    odrStore.addRoad(placeholder2);

    const connections: OdrJunctionConnection[] = [
      { id: 'jc1', incomingRoad: '10', connectingRoad: 'old-1', contactPoint: 'end', laneLinks: [{ from: -1, to: -1 }] },
      { id: 'jc2', incomingRoad: '20', connectingRoad: 'old-2', contactPoint: 'end', laneLinks: [{ from: -1, to: -1 }] },
      { id: 'jc3', incomingRoad: '30', connectingRoad: 'old-1', contactPoint: 'end', laneLinks: [{ from: -1, to: -1 }] },
      { id: 'jc4', incomingRoad: '40', connectingRoad: 'old-2', contactPoint: 'end', laneLinks: [{ from: -1, to: -1 }] },
    ];

    odrStore.addJunction({ id: '100', name: 'Junction 100', connections });

    return { odrStoreApi, odrStore };
  }

  it('removes old connecting roads and generates new ones as a single batch', () => {
    const { odrStore } = setupCrossJunction();

    const roadCountBefore = odrStore.getDocument().roads.length;

    const newConnIds = regenerateJunctionConnections(odrStore, '100', evaluateAtS);

    const doc = odrStore.getDocument();

    // Old placeholder connecting roads are gone
    expect(doc.roads.some((r) => r.id === 'old-1')).toBe(false);
    expect(doc.roads.some((r) => r.id === 'old-2')).toBe(false);

    // New connecting roads were generated
    expect(newConnIds.length).toBeGreaterThan(0);
    for (const id of newConnIds) {
      const road = doc.roads.find((r) => r.id === id);
      expect(road).toBeDefined();
      expect(road?.junction).toBe('100');
    }

    // Junction connections were replaced (reference the new roads)
    const junction = doc.junctions.find((j) => j.id === '100')!;
    expect(junction.connections.length).toBeGreaterThan(0);
    for (const conn of junction.connections) {
      expect(doc.roads.some((r) => r.id === conn.connectingRoad)).toBe(true);
    }

    // The four incoming roads are untouched
    for (const id of ['10', '20', '30', '40']) {
      expect(doc.roads.some((r) => r.id === id)).toBe(true);
    }

    // Single undo restores the pre-regeneration state (batch granularity)
    odrStore.undo();
    const restored = odrStore.getDocument();
    expect(restored.roads.length).toBe(roadCountBefore);
    expect(restored.roads.some((r) => r.id === 'old-1')).toBe(true);
    expect(restored.roads.some((r) => r.id === 'old-2')).toBe(true);
    const restoredJunction = restored.junctions.find((j) => j.id === '100')!;
    expect(restoredJunction.connections.map((c) => c.id)).toEqual([
      'jc1',
      'jc2',
      'jc3',
      'jc4',
    ]);
  });

  it('returns [] and does nothing when the junction is missing', () => {
    const { odrStore } = setupCrossJunction();
    const before = odrStore.getDocument();
    const result = regenerateJunctionConnections(odrStore, 'nonexistent', evaluateAtS);
    expect(result).toEqual([]);
    // Document is unchanged (same reference — no batch was opened)
    expect(odrStore.getDocument()).toBe(before);
  });

  it('clears connections when fewer than two incoming endpoints resolve', () => {
    const odrStoreApi = createOpenDriveStore();
    const odrStore = odrStoreApi.getState();

    // Only one incoming road exists; the other referenced road is absent.
    const only = makeSegmentRoad('10', 50, 0, -50, 0);
    odrStore.addRoad(only);
    const placeholder = makeConnectingRoad('old-1', '10', 'end', '99', 'start', '200');
    odrStore.addRoad(placeholder);

    const connections: OdrJunctionConnection[] = [
      { id: 'jc1', incomingRoad: '10', connectingRoad: 'old-1', contactPoint: 'end', laneLinks: [{ from: -1, to: -1 }] },
      { id: 'jc2', incomingRoad: '99', connectingRoad: 'old-1', contactPoint: 'end', laneLinks: [{ from: -1, to: -1 }] },
    ];
    odrStore.addJunction({ id: '200', name: 'Junction 200', connections });

    const result = regenerateJunctionConnections(odrStore, '200', evaluateAtS);

    expect(result).toEqual([]);
    const doc = odrStore.getDocument();
    // Old connecting road removed, connections cleared
    expect(doc.roads.some((r) => r.id === 'old-1')).toBe(false);
    const junction = doc.junctions.find((j) => j.id === '200')!;
    expect(junction.connections).toEqual([]);
  });
});
