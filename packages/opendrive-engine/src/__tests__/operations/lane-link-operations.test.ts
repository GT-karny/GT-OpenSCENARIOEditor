import { describe, it, expect } from 'vitest';
import type { OdrLane, OdrLaneSection } from '@osce/shared';
import { createOpenDriveStore } from '../../store/opendrive-store.js';
import { createTestRoad } from '../helpers.js';
import {
  syncLaneLinksForDirectConnections,
  clearLaneLinks,
  relinkIntraRoadLanes,
} from '../../operations/lane-link-operations.js';
import { createTaperAtRange } from '../../operations/lane-edit-operations.js';

// ── Helpers for intra-road relink tests ──────────────────────────────────────

function lane(id: number, width: number): OdrLane {
  return { id, type: 'driving', width: [{ sOffset: 0, a: width, b: 0, c: 0, d: 0 }], roadMarks: [] };
}

function section(s: number, left: OdrLane[], right: OdrLane[]): OdrLaneSection {
  return {
    s,
    leftLanes: left,
    centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
    rightLanes: right,
  };
}

const findRight = (sec: OdrLaneSection, id: number) => sec.rightLanes.find((l) => l.id === id)!;
const findLeft = (sec: OdrLaneSection, id: number) => sec.leftLanes.find((l) => l.id === id)!;

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

describe('relinkIntraRoadLanes (geometric mutual-nearest-neighbor)', () => {
  it('links the through lane to its shifted ID when an inner lane is inserted (right side)', () => {
    // section0: through lane -1 only.
    // section1: new zero-width inner lane -1 (taper start) + shifted through lane -2.
    const s0 = section(0, [], [lane(-1, 3.5)]);
    const s1 = section(50, [], [lane(-1, 0), lane(-2, 3.5)]);

    const [r0, r1] = relinkIntraRoadLanes([s0, s1]);

    // Through lane continues -1 → -2 across the boundary.
    expect(findRight(r0, -1).link?.successorId).toBe(-2);
    expect(findRight(r1, -2).link?.predecessorId).toBe(-1);
    // The new inner lane has no mutual partner, so it stays unlinked.
    expect(findRight(r1, -1).link?.predecessorId).toBeUndefined();
  });

  it('links the through lane to its shifted ID when an inner lane is inserted (left side)', () => {
    const s0 = section(0, [lane(1, 3.5)], []);
    const s1 = section(50, [lane(1, 0), lane(2, 3.5)], []);

    const [r0, r1] = relinkIntraRoadLanes([s0, s1]);

    expect(findLeft(r0, 1).link?.successorId).toBe(2);
    expect(findLeft(r1, 2).link?.predecessorId).toBe(1);
    expect(findLeft(r1, 1).link?.predecessorId).toBeUndefined();
  });

  it('links same-id lanes when both sections have an identical layout', () => {
    const s0 = section(0, [], [lane(-1, 3.5), lane(-2, 3.5)]);
    const s1 = section(50, [], [lane(-1, 3.5), lane(-2, 3.5)]);

    const [r0, r1] = relinkIntraRoadLanes([s0, s1]);

    expect(findRight(r0, -1).link?.successorId).toBe(-1);
    expect(findRight(r0, -2).link?.successorId).toBe(-2);
    expect(findRight(r1, -1).link?.predecessorId).toBe(-1);
    expect(findRight(r1, -2).link?.predecessorId).toBe(-2);
  });

  it('returns the same reference when nothing changes', () => {
    const sections = [section(0, [], [lane(-1, 3.5)])];
    expect(relinkIntraRoadLanes(sections)).toBe(sections);
  });
});

describe('createTaperAtRange inner lane insertion (right, narrow-to-wide)', () => {
  it('links the through lane to its shifted ID and leaves the new lane unlinked', () => {
    const odrStoreApi = createOpenDriveStore();
    const odrStore = odrStoreApi.getState();

    odrStore.addRoad(
      createTestRoad({
        id: '1',
        length: 100,
        planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
        lanes: [section(0, [], [lane(-1, 3.5)])],
      }),
    );

    const ok = createTaperAtRange(odrStore, '1', 30, 70, 'right', 'narrow-to-wide', 'inner');
    expect(ok).toBe(true);

    const r = odrStore.getDocument().roads.find((rd) => rd.id === '1')!;
    // [0,30] through-only, [30,70] taper, [70,100] full — 3 sections.
    expect(r.lanes.length).toBe(3);

    // section0 through lane -1 continues to the shifted through lane -2.
    expect(findRight(r.lanes[0], -1).link?.successorId).toBe(-2);
    // section1 new inner lane -1 has no predecessor; through lane -2 links back to -1.
    expect(findRight(r.lanes[1], -1).link?.predecessorId).toBeUndefined();
    expect(findRight(r.lanes[1], -2).link?.predecessorId).toBe(-1);
  });
});
