import { describe, it, expect } from 'vitest';
import { createOpenDriveStore } from '../../store/opendrive-store.js';
import { createTestRoad } from '../helpers.js';
import {
  syncLaneLinksForDirectConnections,
  clearLaneLinks,
} from '../../operations/lane-link-operations.js';

const TWO_LANE_SECTION = [
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
];

describe('syncLaneLinksForDirectConnections', () => {
  it('sets lane predecessor/successor IDs for road-to-road connections', () => {
    const odrStoreApi = createOpenDriveStore();
    const odrStore = odrStoreApi.getState();

    odrStore.addRoad(createTestRoad({
      id: '1',
      length: 100,
      planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
      link: { successor: { elementType: 'road', elementId: '2', contactPoint: 'start' } },
      lanes: TWO_LANE_SECTION,
    }));
    odrStore.addRoad(createTestRoad({
      id: '2',
      length: 100,
      planView: [{ s: 0, x: 100, y: 0, hdg: 0, length: 100, type: 'line' }],
      link: { predecessor: { elementType: 'road', elementId: '1', contactPoint: 'end' } },
      lanes: TWO_LANE_SECTION,
    }));

    syncLaneLinksForDirectConnections(odrStore, ['1', '2']);

    const doc = odrStore.getDocument();
    const r1 = doc.roads.find((r) => r.id === '1')!;
    const r2 = doc.roads.find((r) => r.id === '2')!;

    // Road 1 last section: successor links
    expect(r1.lanes[r1.lanes.length - 1].rightLanes[0].link?.successorId).toBe(-1);
    expect(r1.lanes[r1.lanes.length - 1].leftLanes[0].link?.successorId).toBe(1);

    // Road 2 first section: predecessor links
    expect(r2.lanes[0].rightLanes[0].link?.predecessorId).toBe(-1);
    expect(r2.lanes[0].leftLanes[0].link?.predecessorId).toBe(1);
  });

  it('does not modify lanes when link points to a junction', () => {
    const odrStoreApi = createOpenDriveStore();
    const odrStore = odrStoreApi.getState();

    odrStore.addRoad(createTestRoad({
      id: '1',
      length: 100,
      planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
      link: { successor: { elementType: 'junction', elementId: '99' } },
      lanes: TWO_LANE_SECTION,
    }));

    syncLaneLinksForDirectConnections(odrStore, ['1']);

    const r1 = odrStore.getDocument().roads.find((r) => r.id === '1')!;
    expect(r1.lanes[0].rightLanes[0].link).toBeUndefined();
  });
});

describe('clearLaneLinks', () => {
  it('clears successor lane links from the last lane section', () => {
    const odrStoreApi = createOpenDriveStore();
    const odrStore = odrStoreApi.getState();

    // Create roads and sync their lane links first
    odrStore.addRoad(createTestRoad({
      id: '1',
      length: 100,
      planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
      link: { successor: { elementType: 'road', elementId: '2', contactPoint: 'start' } },
      lanes: TWO_LANE_SECTION,
    }));
    odrStore.addRoad(createTestRoad({
      id: '2',
      length: 100,
      planView: [{ s: 0, x: 100, y: 0, hdg: 0, length: 100, type: 'line' }],
      link: { predecessor: { elementType: 'road', elementId: '1', contactPoint: 'end' } },
      lanes: TWO_LANE_SECTION,
    }));
    syncLaneLinksForDirectConnections(odrStore, ['1', '2']);

    // Verify links exist before clearing
    let r1 = odrStore.getDocument().roads.find((r) => r.id === '1')!;
    expect(r1.lanes[0].rightLanes[0].link?.successorId).toBe(-1);

    // Clear successor lane links on road 1
    clearLaneLinks(odrStore, '1', 'successor');

    r1 = odrStore.getDocument().roads.find((r) => r.id === '1')!;
    expect(r1.lanes[r1.lanes.length - 1].rightLanes[0].link?.successorId).toBeUndefined();
    expect(r1.lanes[r1.lanes.length - 1].leftLanes[0].link?.successorId).toBeUndefined();
  });

  it('clears predecessor lane links from the first lane section', () => {
    const odrStoreApi = createOpenDriveStore();
    const odrStore = odrStoreApi.getState();

    odrStore.addRoad(createTestRoad({
      id: '1',
      length: 100,
      planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
      link: { successor: { elementType: 'road', elementId: '2', contactPoint: 'start' } },
      lanes: TWO_LANE_SECTION,
    }));
    odrStore.addRoad(createTestRoad({
      id: '2',
      length: 100,
      planView: [{ s: 0, x: 100, y: 0, hdg: 0, length: 100, type: 'line' }],
      link: { predecessor: { elementType: 'road', elementId: '1', contactPoint: 'end' } },
      lanes: TWO_LANE_SECTION,
    }));
    syncLaneLinksForDirectConnections(odrStore, ['1', '2']);

    // Clear predecessor lane links on road 2
    clearLaneLinks(odrStore, '2', 'predecessor');

    const r2 = odrStore.getDocument().roads.find((r) => r.id === '2')!;
    expect(r2.lanes[0].rightLanes[0].link?.predecessorId).toBeUndefined();
    expect(r2.lanes[0].leftLanes[0].link?.predecessorId).toBeUndefined();
  });

  it('does nothing for a road with no lane links', () => {
    const odrStoreApi = createOpenDriveStore();
    const odrStore = odrStoreApi.getState();

    odrStore.addRoad(createTestRoad({
      id: '1',
      length: 100,
      planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
      lanes: TWO_LANE_SECTION,
    }));

    // Should not throw
    clearLaneLinks(odrStore, '1', 'successor');

    const r1 = odrStore.getDocument().roads.find((r) => r.id === '1')!;
    expect(r1.lanes[0].rightLanes[0].link).toBeUndefined();
  });

  it('removes the link object entirely when both predecessor and successor are cleared', () => {
    const odrStoreApi = createOpenDriveStore();
    const odrStore = odrStoreApi.getState();

    // Create a road that has both predecessor and successor
    odrStore.addRoad(createTestRoad({
      id: '1',
      length: 100,
      planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
      link: {
        predecessor: { elementType: 'road', elementId: '0', contactPoint: 'end' },
        successor: { elementType: 'road', elementId: '2', contactPoint: 'start' },
      },
      lanes: TWO_LANE_SECTION,
    }));
    odrStore.addRoad(createTestRoad({
      id: '0',
      length: 100,
      planView: [{ s: 0, x: -100, y: 0, hdg: 0, length: 100, type: 'line' }],
      link: { successor: { elementType: 'road', elementId: '1', contactPoint: 'start' } },
      lanes: TWO_LANE_SECTION,
    }));
    odrStore.addRoad(createTestRoad({
      id: '2',
      length: 100,
      planView: [{ s: 0, x: 100, y: 0, hdg: 0, length: 100, type: 'line' }],
      link: { predecessor: { elementType: 'road', elementId: '1', contactPoint: 'end' } },
      lanes: TWO_LANE_SECTION,
    }));

    syncLaneLinksForDirectConnections(odrStore, ['0', '1', '2']);

    // Road 1 should have both predecessor and successor lane links
    let r1 = odrStore.getDocument().roads.find((r) => r.id === '1')!;
    expect(r1.lanes[0].rightLanes[0].link?.predecessorId).toBe(-1);
    expect(r1.lanes[0].rightLanes[0].link?.successorId).toBe(-1);

    // Clear predecessor
    clearLaneLinks(odrStore, '1', 'predecessor');
    r1 = odrStore.getDocument().roads.find((r) => r.id === '1')!;
    // predecessorId cleared but successorId remains
    expect(r1.lanes[0].rightLanes[0].link?.predecessorId).toBeUndefined();
    expect(r1.lanes[0].rightLanes[0].link?.successorId).toBe(-1);

    // Clear successor
    clearLaneLinks(odrStore, '1', 'successor');
    r1 = odrStore.getDocument().roads.find((r) => r.id === '1')!;
    // Link object should be removed entirely
    expect(r1.lanes[r1.lanes.length - 1].rightLanes[0].link).toBeUndefined();
  });
});
