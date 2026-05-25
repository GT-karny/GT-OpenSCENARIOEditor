import { describe, it, expect } from 'vitest';
import type {
  OpenDriveDocument,
  OdrRoad,
  OdrLane,
  OdrLaneSection,
  OdrJunction,
} from '@osce/shared';
import {
  contactEndS,
  sideOfS,
  roadLinkOn,
  arrivalSFromContactPoint,
  directNextRoad,
  findLaneOnSide,
  traceLaneLinkAcrossBoundary,
  junctionConnectionsFrom,
  exitOfConnectingRoad,
  laneSpansAcrossSections,
} from '../../route/road-linking.js';

// ----- fixture builders -----

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
    lanes: overrides.lanes ?? [],
    objects: [],
    signals: [],
    ...overrides,
  };
}

function makeJunction(overrides: Partial<OdrJunction> & { id: string }): OdrJunction {
  return {
    name: `jct_${overrides.id}`,
    connections: [],
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

// ----- tests -----

describe('contactEndS', () => {
  const road = makeRoad({ id: '1', length: 100 });
  it('returns 0 for predecessor', () => {
    expect(contactEndS(road, 'predecessor')).toBe(0);
  });
  it('returns length for successor', () => {
    expect(contactEndS(road, 'successor')).toBe(100);
  });
});

describe('sideOfS', () => {
  const road = makeRoad({ id: '1', length: 100 });
  it('detects predecessor end', () => {
    expect(sideOfS(road, 0)).toBe('predecessor');
    expect(sideOfS(road, 0.0005)).toBe('predecessor');
  });
  it('detects successor end', () => {
    expect(sideOfS(road, 100)).toBe('successor');
    expect(sideOfS(road, 99.9995)).toBe('successor');
  });
  it('returns null for interior', () => {
    expect(sideOfS(road, 50)).toBeNull();
  });
});

describe('arrivalSFromContactPoint', () => {
  const road = makeRoad({ id: '1', length: 50 });
  it('start → 0, end → length', () => {
    expect(arrivalSFromContactPoint(road, 'start')).toBe(0);
    expect(arrivalSFromContactPoint(road, 'end')).toBe(50);
  });
});

describe('roadLinkOn', () => {
  const road = makeRoad({
    id: '1',
    length: 100,
    link: {
      predecessor: { elementType: 'road', elementId: '0', contactPoint: 'end' },
      successor: { elementType: 'junction', elementId: 'J1' },
    },
  });
  it('returns predecessor', () => {
    expect(roadLinkOn(road, 'predecessor')?.elementId).toBe('0');
  });
  it('returns successor', () => {
    expect(roadLinkOn(road, 'successor')?.elementId).toBe('J1');
  });
  it('returns undefined when link missing', () => {
    const bare = makeRoad({ id: '99', length: 10 });
    expect(roadLinkOn(bare, 'predecessor')).toBeUndefined();
  });
});

describe('directNextRoad', () => {
  // road 1 successor → road 2 start (i.e. road 2 s=0, predecessor side)
  const road1 = makeRoad({
    id: '1',
    length: 100,
    link: {
      successor: { elementType: 'road', elementId: '2', contactPoint: 'start' },
    },
  });
  // road 2 successor → road 3 end (i.e. road 3 s=length, successor side; reverse traversal)
  const road2 = makeRoad({
    id: '2',
    length: 80,
    link: {
      predecessor: { elementType: 'road', elementId: '1', contactPoint: 'end' },
      successor: { elementType: 'road', elementId: '3', contactPoint: 'end' },
    },
  });
  const road3 = makeRoad({ id: '3', length: 60 });
  const doc = makeDoc([road1, road2, road3]);

  it('follows successor→start correctly', () => {
    const r = directNextRoad(road1, 'successor', doc);
    expect(r?.road.id).toBe('2');
    expect(r?.arrivalSide).toBe('predecessor');
    expect(r?.arrivalS).toBe(0);
  });
  it('follows successor→end correctly (end-to-end flip)', () => {
    const r = directNextRoad(road2, 'successor', doc);
    expect(r?.road.id).toBe('3');
    expect(r?.arrivalSide).toBe('successor');
    expect(r?.arrivalS).toBe(60);
  });
  it('returns null when link missing', () => {
    expect(directNextRoad(road3, 'successor', doc)).toBeNull();
  });
  it('returns null when link is a junction', () => {
    const r = makeRoad({
      id: '5',
      length: 10,
      link: { successor: { elementType: 'junction', elementId: 'J1' } },
    });
    expect(directNextRoad(r, 'successor', makeDoc([r]))).toBeNull();
  });
});

describe('findLaneOnSide', () => {
  const secA = makeSection(0, [makeLane(1), makeLane(2)], makeLane(0), [makeLane(-1), makeLane(-2)]);
  const secB = makeSection(50, [makeLane(1)], makeLane(0), [makeLane(-1)]);
  const road = makeRoad({ id: 'X', length: 100, lanes: [secA, secB] });

  it('uses first section on predecessor side', () => {
    expect(findLaneOnSide(road, -2, 'predecessor')?.id).toBe(-2);
  });
  it('uses last section on successor side', () => {
    // Lane -2 does not exist in the last section
    expect(findLaneOnSide(road, -2, 'successor')).toBeNull();
    expect(findLaneOnSide(road, -1, 'successor')?.id).toBe(-1);
  });
  it('returns center lane for id 0', () => {
    expect(findLaneOnSide(road, 0, 'predecessor')?.id).toBe(0);
  });
  it('returns null for missing lane', () => {
    expect(findLaneOnSide(road, 99, 'predecessor')).toBeNull();
  });
});

describe('traceLaneLinkAcrossBoundary', () => {
  // road1 lane -1 --successor--> road2 lane -1 (start-to-end in xodr sign, signs already set by author)
  const lane1Right = makeLane(-1, { successorId: -1 });
  const lane2Right = makeLane(-1, { predecessorId: -1 });
  const road1 = makeRoad({
    id: '1',
    length: 100,
    link: { successor: { elementType: 'road', elementId: '2', contactPoint: 'start' } },
    lanes: [makeSection(0, [], makeLane(0), [lane1Right])],
  });
  const road2 = makeRoad({
    id: '2',
    length: 80,
    link: { predecessor: { elementType: 'road', elementId: '1', contactPoint: 'end' } },
    lanes: [makeSection(0, [], makeLane(0), [lane2Right])],
  });
  const doc = makeDoc([road1, road2]);

  it('traces direct road→road lane link', () => {
    const r = traceLaneLinkAcrossBoundary(road1, -1, 'successor', doc);
    expect(r).toEqual({ roadId: '2', laneId: -1, arrivalSide: 'predecessor', arrivalS: 0 });
  });
  it('returns null when lane has no link', () => {
    const laneNoLink = makeLane(-1);
    const r = makeRoad({
      id: '5',
      length: 10,
      link: { successor: { elementType: 'road', elementId: '1', contactPoint: 'start' } },
      lanes: [makeSection(0, [], makeLane(0), [laneNoLink])],
    });
    const doc2 = makeDoc([r, road1]);
    expect(traceLaneLinkAcrossBoundary(r, -1, 'successor', doc2)).toBeNull();
  });
});

describe('junctionConnectionsFrom + exitOfConnectingRoad', () => {
  // Incoming road 1 (s=length side) → junction J
  // Junction J has two connections via connectingRoads 10 and 11
  // connectingRoad 10: predecessor=road 1 (contactPoint=end), successor=road 2 (start)
  // connectingRoad 11: predecessor=road 1 (contactPoint=end), successor=road 3 (start)
  const road1 = makeRoad({
    id: '1',
    length: 100,
    link: { successor: { elementType: 'junction', elementId: 'J' } },
  });
  const cr10 = makeRoad({
    id: '10',
    length: 20,
    junction: 'J',
    link: {
      predecessor: { elementType: 'road', elementId: '1', contactPoint: 'end' },
      successor: { elementType: 'road', elementId: '2', contactPoint: 'start' },
    },
  });
  const cr11 = makeRoad({
    id: '11',
    length: 20,
    junction: 'J',
    link: {
      predecessor: { elementType: 'road', elementId: '1', contactPoint: 'end' },
      successor: { elementType: 'road', elementId: '3', contactPoint: 'start' },
    },
  });
  const road2 = makeRoad({ id: '2', length: 50 });
  const road3 = makeRoad({ id: '3', length: 60 });
  const junction: OdrJunction = makeJunction({
    id: 'J',
    connections: [
      {
        id: '0',
        incomingRoad: '1',
        connectingRoad: '10',
        contactPoint: 'start',
        laneLinks: [{ from: -1, to: -1 }],
      },
      {
        id: '1',
        incomingRoad: '1',
        connectingRoad: '11',
        contactPoint: 'start',
        laneLinks: [{ from: -2, to: -1 }],
      },
      // Sanity: unrelated connection from another incoming road
      {
        id: '2',
        incomingRoad: '99',
        connectingRoad: '10',
        contactPoint: 'end',
        laneLinks: [{ from: 1, to: 1 }],
      },
    ],
  });
  const doc = makeDoc([road1, cr10, cr11, road2, road3], [junction]);

  it('enumerates only connections where incoming matches', () => {
    const conns = junctionConnectionsFrom(road1, 'successor', doc);
    expect(conns).toHaveLength(2);
    expect(conns.map((c) => c.connectingRoad.id).sort()).toEqual(['10', '11']);
  });

  it('each connection exposes the 3-hop exit link', () => {
    const conns = junctionConnectionsFrom(road1, 'successor', doc);
    const c10 = conns.find((c) => c.connectingRoad.id === '10')!;
    expect(c10.exitLink?.elementId).toBe('2');
  });

  it('exitOfConnectingRoad resolves outgoing road', () => {
    const exit = exitOfConnectingRoad(cr10, 'start', doc);
    expect(exit?.road.id).toBe('2');
    expect(exit?.arrivalSide).toBe('predecessor');
    expect(exit?.arrivalS).toBe(0);
  });

  it('returns empty when leaving side link is not junction', () => {
    const r = makeRoad({ id: 'x', length: 10 });
    expect(junctionConnectionsFrom(r, 'successor', doc)).toEqual([]);
  });
});

describe('laneSpansAcrossSections', () => {
  // Through lane -1 (section0) links to -2 (section1) and -3 (section2) via
  // <lane><link>, e.g. inner lanes added with correct (renumbered) links.
  const linkRoad = makeRoad({
    id: 'X',
    length: 100,
    lanes: [
      makeSection(0, [], makeLane(0), [makeLane(-1, { successorId: -2 })]),
      makeSection(50, [], makeLane(0), [makeLane(-1), makeLane(-2, { predecessorId: -1 })]),
    ],
  });

  it('single-section road → one span, id unchanged', () => {
    const road = makeRoad({
      id: '1',
      length: 100,
      lanes: [makeSection(0, [], makeLane(0), [makeLane(-1)])],
    });
    expect(laneSpansAcrossSections(road, -1, 10, 90, 'low')).toEqual([
      { laneId: -1, sStart: 10, sEnd: 90 },
    ]);
  });

  it('forward (anchor low): remaps via successorId at the boundary', () => {
    expect(laneSpansAcrossSections(linkRoad, -1, 10, 90, 'low')).toEqual([
      { laneId: -1, sStart: 10, sEnd: 50 },
      { laneId: -2, sStart: 50, sEnd: 90 },
    ]);
  });

  it('backward (anchor high): remaps via predecessorId, increasing-s order', () => {
    // laneId -2 is valid at the high end (section1); walking upstream yields -1.
    expect(laneSpansAcrossSections(linkRoad, -2, 10, 90, 'high')).toEqual([
      { laneId: -1, sStart: 10, sEnd: 50 },
      { laneId: -2, sStart: 50, sEnd: 90 },
    ]);
  });

  it('missing lane.link → same id across the boundary (fallback)', () => {
    const road = makeRoad({
      id: '2',
      length: 100,
      lanes: [
        makeSection(0, [], makeLane(0), [makeLane(-1)]),
        makeSection(50, [], makeLane(0), [makeLane(-1)]),
      ],
    });
    expect(laneSpansAcrossSections(road, -1, 10, 90, 'low')).toEqual([
      { laneId: -1, sStart: 10, sEnd: 50 },
      { laneId: -1, sStart: 50, sEnd: 90 },
    ]);
  });

  it('span entirely within one section → single clamped span', () => {
    expect(laneSpansAcrossSections(linkRoad, -1, 10, 40, 'low')).toEqual([
      { laneId: -1, sStart: 10, sEnd: 40 },
    ]);
  });

  it('center lane (id 0) stays 0 across the boundary', () => {
    // The span is still split at the section boundary; only the ID stays 0.
    expect(laneSpansAcrossSections(linkRoad, 0, 10, 90, 'low')).toEqual([
      { laneId: 0, sStart: 10, sEnd: 50 },
      { laneId: 0, sStart: 50, sEnd: 90 },
    ]);
  });

  it('span ending exactly on a boundary → no zero-length/duplicate span', () => {
    expect(laneSpansAcrossSections(linkRoad, -1, 0, 50, 'low')).toEqual([
      { laneId: -1, sStart: 0, sEnd: 50 },
    ]);
  });

  it('three chained sections remap -1 → -2 → -3 via links', () => {
    const road = makeRoad({
      id: '3',
      length: 100,
      lanes: [
        makeSection(0, [], makeLane(0), [makeLane(-1, { successorId: -2 })]),
        makeSection(40, [], makeLane(0), [makeLane(-1), makeLane(-2, { successorId: -3 })]),
        makeSection(70, [], makeLane(0), [makeLane(-1), makeLane(-2), makeLane(-3)]),
      ],
    });
    expect(laneSpansAcrossSections(road, -1, 10, 90, 'low')).toEqual([
      { laneId: -1, sStart: 10, sEnd: 40 },
      { laneId: -2, sStart: 40, sEnd: 70 },
      { laneId: -3, sStart: 70, sEnd: 90 },
    ]);
  });
});
