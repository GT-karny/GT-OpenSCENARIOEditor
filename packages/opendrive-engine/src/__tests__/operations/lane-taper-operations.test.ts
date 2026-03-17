import { describe, it, expect } from 'vitest';
import {
  computeCubicTaperCoefficients,
  buildTaperSectionForAdd,
  buildTaperSectionForRemove,
} from '../../operations/lane-taper-operations.js';
import type { OdrRoad, OdrLaneSection } from '@osce/shared';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeSection(leftCount: number, rightCount: number, s = 0): OdrLaneSection {
  const leftLanes = Array.from({ length: leftCount }, (_, i) => ({
    id: i + 1,
    type: 'driving',
    width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
    roadMarks: [{ sOffset: 0, type: 'solid', color: 'standard' }],
  }));
  const rightLanes = Array.from({ length: rightCount }, (_, i) => ({
    id: -(i + 1),
    type: 'driving',
    width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
    roadMarks: [{ sOffset: 0, type: 'solid', color: 'standard' }],
  }));
  return {
    s,
    leftLanes,
    centerLane: {
      id: 0,
      type: 'none',
      width: [],
      roadMarks: [{ sOffset: 0, type: 'solid', color: 'yellow' }],
    },
    rightLanes,
  };
}

function makeRoad(sections: OdrLaneSection[]): OdrRoad {
  return {
    id: 'road-1',
    name: 'TestRoad',
    length: 200,
    junction: '-1',
    lanes: sections,
    planView: [],
    elevationProfile: [],
    lateralProfile: [],
    laneOffset: [],
    objects: [],
    signals: [],
  } as OdrRoad;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('computeCubicTaperCoefficients', () => {
  it('computes correct coefficients for 0 → 3.5 m taper', () => {
    const taperLength = 30;
    const result = computeCubicTaperCoefficients(0, 3.5, taperLength);

    expect(result.sOffset).toBe(0);
    expect(result.a).toBe(0);
    expect(result.b).toBe(0);
    expect(result.c).toBeCloseTo((3 * 3.5) / (30 * 30), 10);
    expect(result.d).toBeCloseTo((-2 * 3.5) / (30 * 30 * 30), 10);

    // Verify: at ds=0, width = a = 0
    const w0 = result.a;
    expect(w0).toBe(0);

    // Verify: at ds=L, width should equal 3.5
    const ds = taperLength;
    const wL = result.a + result.b * ds + result.c * ds * ds + result.d * ds * ds * ds;
    expect(wL).toBeCloseTo(3.5, 10);
  });

  it('computes correct coefficients for 3.5 → 0 m taper', () => {
    const taperLength = 25;
    const result = computeCubicTaperCoefficients(3.5, 0, taperLength);

    expect(result.a).toBe(3.5);
    expect(result.b).toBe(0);

    // Verify: at ds=L, width should equal 0
    const ds = taperLength;
    const wL = result.a + result.b * ds + result.c * ds * ds + result.d * ds * ds * ds;
    expect(wL).toBeCloseTo(0, 10);
  });

  it('returns constant width when start equals end', () => {
    const result = computeCubicTaperCoefficients(3.5, 3.5, 50);

    expect(result.a).toBe(3.5);
    expect(result.b).toBe(0);
    expect(result.c).toBeCloseTo(0, 10);
    expect(result.d).toBeCloseTo(0, 10);
  });
});

describe('buildTaperSectionForAdd', () => {
  it('adds a new left lane with taper width', () => {
    const section = makeSection(2, 2);
    const road = makeRoad([section]);

    const taper = buildTaperSectionForAdd(road, 0, 'left', 30);

    // Should have one more left lane than the original
    expect(taper.leftLanes).toHaveLength(3);
    // Right lanes unchanged
    expect(taper.rightLanes).toHaveLength(2);
    // Center lane preserved
    expect(taper.centerLane.id).toBe(0);

    // The new lane (id=3) should have taper width starting at 0
    const newLane = taper.leftLanes.find((l) => l.id === 3);
    expect(newLane).toBeDefined();
    expect(newLane!.width[0].a).toBe(0);
    expect(newLane!.width[0].b).toBe(0);
  });

  it('adds a new right lane with taper width', () => {
    const section = makeSection(1, 1);
    const road = makeRoad([section]);

    const taper = buildTaperSectionForAdd(road, 0, 'right', 20);

    expect(taper.rightLanes).toHaveLength(2);
    expect(taper.leftLanes).toHaveLength(1);

    // New right lane should be id=-2
    const newLane = taper.rightLanes.find((l) => l.id === -2);
    expect(newLane).toBeDefined();
    expect(newLane!.width[0].a).toBe(0);
  });

  it('does not mutate the original road', () => {
    const section = makeSection(2, 2);
    const road = makeRoad([section]);

    buildTaperSectionForAdd(road, 0, 'left', 30);

    // Original section should still have 2 left lanes
    expect(road.lanes[0].leftLanes).toHaveLength(2);
  });
});

describe('buildTaperSectionForRemove', () => {
  it('sets taper width on the specified left lane', () => {
    const section = makeSection(2, 2);
    const road = makeRoad([section]);

    const taper = buildTaperSectionForRemove(road, 0, 'left', 2, 25);

    // Same number of lanes
    expect(taper.leftLanes).toHaveLength(2);

    // Lane 2 should have taper starting at 3.5 and ending at 0
    const lane = taper.leftLanes.find((l) => l.id === 2);
    expect(lane).toBeDefined();
    expect(lane!.width[0].a).toBe(3.5);

    // Verify width at end of taper is ~0
    const w = lane!.width[0];
    const ds = 25;
    const wEnd = w.a + w.b * ds + w.c * ds * ds + w.d * ds * ds * ds;
    expect(wEnd).toBeCloseTo(0, 10);
  });

  it('sets taper width on the specified right lane', () => {
    const section = makeSection(1, 3);
    const road = makeRoad([section]);

    const taper = buildTaperSectionForRemove(road, 0, 'right', -2, 30);

    const lane = taper.rightLanes.find((l) => l.id === -2);
    expect(lane).toBeDefined();
    expect(lane!.width[0].a).toBe(3.5);
    expect(lane!.width[0].b).toBe(0);
  });

  it('throws when the lane ID is not found', () => {
    const section = makeSection(1, 1);
    const road = makeRoad([section]);

    expect(() => buildTaperSectionForRemove(road, 0, 'left', 99, 30)).toThrow(
      /Lane 99 not found/,
    );
  });

  it('does not mutate the original road', () => {
    const section = makeSection(2, 2);
    const road = makeRoad([section]);

    buildTaperSectionForRemove(road, 0, 'left', 2, 25);

    // Original lane 2 should still have constant width
    const originalLane = road.lanes[0].leftLanes.find((l) => l.id === 2);
    expect(originalLane!.width[0].a).toBe(3.5);
    expect(originalLane!.width[0].c).toBe(0);
    expect(originalLane!.width[0].d).toBe(0);
  });
});
