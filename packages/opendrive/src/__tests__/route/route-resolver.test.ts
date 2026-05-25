import { describe, it, expect } from 'vitest';
import type {
  OpenDriveDocument,
  OdrRoad,
  OdrLane,
  OdrLaneSection,
  OdrJunction,
  LanePosition,
} from '@osce/shared';
import { resolveRoute } from '../../route/route-resolver.js';

// ----- fixture builders (shared with road-linking tests) -----

function makeLane(id: number, link?: { predecessorId?: number; successorId?: number }): OdrLane {
  return { id, type: 'driving', width: [], roadMarks: [], link };
}
function makeSection(s: number, left: OdrLane[], center: OdrLane, right: OdrLane[]): OdrLaneSection {
  return { s, leftLanes: left, centerLane: center, rightLanes: right };
}
function makeRoad(overrides: Partial<OdrRoad> & { id: string; length: number }): OdrRoad {
  return {
    name: `road_${overrides.id}`,
    junction: '-1',
    planView: [],
    elevationProfile: [],
    lateralProfile: [],
    laneOffset: [],
    lanes: overrides.lanes ?? [
      makeSection(0, [makeLane(1)], makeLane(0), [makeLane(-1)]),
    ],
    objects: [],
    signals: [],
    ...overrides,
  };
}
function makeDoc(roads: OdrRoad[], junctions: OdrJunction[] = []): OpenDriveDocument {
  return {
    header: { revMajor: 1, revMinor: 6, name: 'test', date: '2025' },
    roads,
    controllers: [],
    junctions,
  };
}
function lp(roadId: string, laneId: number, s: number): LanePosition {
  return { type: 'lanePosition', roadId, laneId: String(laneId), s, offset: 0 };
}

// ----- tests -----

describe('resolveRoute: trivial same-road', () => {
  const road = makeRoad({ id: '1', length: 100 });
  const doc = makeDoc([road]);

  it('returns single segment when start==end road and lane', () => {
    const r = resolveRoute(doc, lp('1', -1, 10), lp('1', -1, 80));
    expect(r).toEqual([{ roadId: '1', laneId: -1, entryS: 10, exitS: 80 }]);
  });
});

describe('resolveRoute: direct road→road link', () => {
  // road 1 --successor-- road 2 (start), lane -1 → -1
  const road1 = makeRoad({
    id: '1',
    length: 100,
    link: { successor: { elementType: 'road', elementId: '2', contactPoint: 'start' } },
    lanes: [makeSection(0, [], makeLane(0), [makeLane(-1, { successorId: -1 })])],
  });
  const road2 = makeRoad({
    id: '2',
    length: 80,
    link: { predecessor: { elementType: 'road', elementId: '1', contactPoint: 'end' } },
    lanes: [makeSection(0, [], makeLane(0), [makeLane(-1, { predecessorId: -1 })])],
  });
  const doc = makeDoc([road1, road2]);

  it('traverses two chained roads correctly', () => {
    const r = resolveRoute(doc, lp('1', -1, 20), lp('2', -1, 40));
    expect(r).toEqual([
      { roadId: '1', laneId: -1, entryS: 20, exitS: 100 },
      { roadId: '2', laneId: -1, entryS: 0, exitS: 40 },
    ]);
  });
});

describe('resolveRoute: junction (3-hop dereference)', () => {
  // road 1 --successor--> junction J --> connectingRoad 10 (start) --> road 2 (start)
  const road1 = makeRoad({
    id: '1',
    length: 100,
    link: { successor: { elementType: 'junction', elementId: 'J' } },
  });
  const cr10 = makeRoad({
    id: '10',
    length: 15,
    junction: 'J',
    link: {
      predecessor: { elementType: 'road', elementId: '1', contactPoint: 'end' },
      successor: { elementType: 'road', elementId: '2', contactPoint: 'start' },
    },
    lanes: [makeSection(0, [], makeLane(0), [makeLane(-1, { predecessorId: -1, successorId: -1 })])],
  });
  const road2 = makeRoad({
    id: '2',
    length: 80,
    link: { predecessor: { elementType: 'road', elementId: '10', contactPoint: 'end' } },
  });
  const junction: OdrJunction = {
    id: 'J',
    name: 'J',
    connections: [
      {
        id: '0',
        incomingRoad: '1',
        connectingRoad: '10',
        contactPoint: 'start',
        laneLinks: [{ from: -1, to: -1 }],
      },
    ],
  };
  const doc = makeDoc([road1, cr10, road2], [junction]);

  it('walks incomingRoad → connectingRoad → outgoingRoad', () => {
    const r = resolveRoute(doc, lp('1', -1, 30), lp('2', -1, 20));
    expect(r).toEqual([
      { roadId: '1', laneId: -1, entryS: 30, exitS: 100 },
      { roadId: '10', laneId: -1, entryS: 0, exitS: 15 },
      { roadId: '2', laneId: -1, entryS: 0, exitS: 20 },
    ]);
  });

  it('respects laneLink from/to mapping', () => {
    // Build a variant where laneLink maps from=-1 to=+1 (sign flip inside junction)
    const junction2: OdrJunction = {
      id: 'J',
      name: 'J',
      connections: [
        {
          id: '0',
          incomingRoad: '1',
          connectingRoad: '10',
          contactPoint: 'start',
          laneLinks: [{ from: -1, to: 1 }],
        },
      ],
    };
    const cr10b = makeRoad({
      ...cr10,
      lanes: [makeSection(0, [makeLane(1, { successorId: -1 })], makeLane(0), [])],
    });
    const doc2 = makeDoc([road1, cr10b, road2], [junction2]);
    const r = resolveRoute(doc2, lp('1', -1, 30), lp('2', -1, 20));
    expect(r).toEqual([
      { roadId: '1', laneId: -1, entryS: 30, exitS: 100 },
      { roadId: '10', laneId: 1, entryS: 0, exitS: 15 },
      { roadId: '2', laneId: -1, entryS: 0, exitS: 20 },
    ]);
  });
});

describe('resolveRoute: unreachable', () => {
  const road1 = makeRoad({ id: '1', length: 100 });
  const road2 = makeRoad({ id: '2', length: 80 }); // no link
  const doc = makeDoc([road1, road2]);

  it('returns null when no path exists', () => {
    const r = resolveRoute(doc, lp('1', -1, 10), lp('2', -1, 20));
    expect(r).toBeNull();
  });
});

describe('resolveRoute: multi-section road (internal lane insertion)', () => {
  // The through lane -1 (section0) links to -2 (section1) via <lane><link>, e.g.
  // an inner lane added with correct renumbered links. Goal is the destination ID.
  const road = makeRoad({
    id: '1',
    length: 100,
    lanes: [
      makeSection(0, [], makeLane(0), [makeLane(-1, { successorId: -2 })]),
      makeSection(50, [], makeLane(0), [makeLane(-1), makeLane(-2, { predecessorId: -1 })]),
    ],
  });
  const doc = makeDoc([road]);

  it('matches goal across the internal section boundary via links', () => {
    const r = resolveRoute(doc, lp('1', -1, 10), lp('1', -2, 90));
    expect(r).toEqual([{ roadId: '1', laneId: -1, entryS: 10, exitS: 90 }]);
  });
});

describe('resolveRoute: exit lane ID follows internal section links', () => {
  // road1 has an internal insertion: lane -1 (entry) links to -2 (exit side), and
  // road1's successor lane link lives on the exit-side section (-2 → road2 -2).
  const road1 = makeRoad({
    id: '1',
    length: 100,
    link: { successor: { elementType: 'road', elementId: '2', contactPoint: 'start' } },
    lanes: [
      makeSection(0, [], makeLane(0), [makeLane(-1, { successorId: -2 })]),
      makeSection(50, [], makeLane(0), [
        makeLane(-1),
        makeLane(-2, { predecessorId: -1, successorId: -2 }),
      ]),
    ],
  });
  const road2 = makeRoad({
    id: '2',
    length: 80,
    link: { predecessor: { elementType: 'road', elementId: '1', contactPoint: 'end' } },
    lanes: [makeSection(0, [], makeLane(0), [makeLane(-1), makeLane(-2, { predecessorId: -2 })])],
  });
  const doc = makeDoc([road1, road2]);

  it('uses the exit-side lane ID (not the entry ID) for the boundary link', () => {
    const r = resolveRoute(doc, lp('1', -1, 20), lp('2', -2, 40));
    expect(r).toEqual([
      { roadId: '1', laneId: -1, entryS: 20, exitS: 100 },
      { roadId: '2', laneId: -2, entryS: 0, exitS: 40 },
    ]);
  });
});

describe('resolveRoute: end-to-end flip (reverse traversal)', () => {
  // road 1 --successor--> road 2 (end). Arriving at s=length of road 2, exit via predecessor side.
  const road1 = makeRoad({
    id: '1',
    length: 100,
    link: { successor: { elementType: 'road', elementId: '2', contactPoint: 'end' } },
    lanes: [makeSection(0, [], makeLane(0), [makeLane(-1, { successorId: -1 })])],
  });
  const road2 = makeRoad({
    id: '2',
    length: 80,
    link: { successor: { elementType: 'road', elementId: '1', contactPoint: 'end' } },
    lanes: [makeSection(0, [], makeLane(0), [makeLane(-1, { successorId: -1 })])],
  });
  const doc = makeDoc([road1, road2]);

  it('correctly reverses on road 2 when entering at s=length', () => {
    const r = resolveRoute(doc, lp('1', -1, 20), lp('2', -1, 10));
    expect(r).toEqual([
      { roadId: '1', laneId: -1, entryS: 20, exitS: 100 },
      { roadId: '2', laneId: -1, entryS: 80, exitS: 10 },
    ]);
  });
});
