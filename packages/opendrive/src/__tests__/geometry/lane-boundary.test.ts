import { describe, it, expect } from 'vitest';
import {
  computeLaneWidth,
  computeLaneOuterT,
  computeLaneInnerT,
  computeLaneBoundaries,
  stToXyz,
} from '../../geometry/lane-boundary.js';
import type { OdrLane, OdrLaneSection, OdrRoad } from '@osce/shared';

function makeLane(id: number, widthA: number): OdrLane {
  return {
    id,
    type: 'driving',
    width: [{ sOffset: 0, a: widthA, b: 0, c: 0, d: 0 }],
    roadMarks: [],
  };
}

function makeSection(leftLanes: OdrLane[], rightLanes: OdrLane[]): OdrLaneSection {
  return {
    s: 0,
    leftLanes,
    centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
    rightLanes,
  };
}

describe('computeLaneWidth', () => {
  it('should return constant width for a=val, b=c=d=0', () => {
    const lane = makeLane(1, 3.5);
    expect(computeLaneWidth(lane, 0)).toBeCloseTo(3.5);
    expect(computeLaneWidth(lane, 50)).toBeCloseTo(3.5);
  });

  it('should return 0 for lane with no width entries', () => {
    const lane: OdrLane = { id: 1, type: 'driving', width: [], roadMarks: [] };
    expect(computeLaneWidth(lane, 0)).toBe(0);
  });

  it('should evaluate polynomial width', () => {
    const lane: OdrLane = {
      id: 1, type: 'driving', roadMarks: [],
      width: [{ sOffset: 0, a: 3.0, b: 0.01, c: 0, d: 0 }],
    };
    // w(10) = 3.0 + 0.01*10 = 3.1
    expect(computeLaneWidth(lane, 10)).toBeCloseTo(3.1);
  });
});

describe('computeLaneOuterT', () => {
  it('should return 0 for center lane', () => {
    const section = makeSection([], []);
    const lane = section.centerLane;
    expect(computeLaneOuterT(section, lane, 0)).toBe(0);
  });

  it('should return positive t for left lane', () => {
    const left1 = makeLane(1, 3.5);
    const section = makeSection([left1], []);
    expect(computeLaneOuterT(section, left1, 0)).toBeCloseTo(3.5);
  });

  it('should accumulate multiple left lanes', () => {
    const left1 = makeLane(1, 3.5);
    const left2 = makeLane(2, 2.0);
    const section = makeSection([left2, left1], []);
    // lane 2 outer = width(1) + width(2) = 3.5 + 2.0 = 5.5
    expect(computeLaneOuterT(section, left2, 0)).toBeCloseTo(5.5);
    // lane 1 outer = width(1) = 3.5
    expect(computeLaneOuterT(section, left1, 0)).toBeCloseTo(3.5);
  });

  it('should return negative t for right lane', () => {
    const right1 = makeLane(-1, 3.5);
    const section = makeSection([], [right1]);
    expect(computeLaneOuterT(section, right1, 0)).toBeCloseTo(-3.5);
  });

  it('should accumulate multiple right lanes', () => {
    const right1 = makeLane(-1, 3.5);
    const right2 = makeLane(-2, 2.0);
    const section = makeSection([], [right1, right2]);
    expect(computeLaneOuterT(section, right1, 0)).toBeCloseTo(-3.5);
    expect(computeLaneOuterT(section, right2, 0)).toBeCloseTo(-5.5);
  });
});

describe('computeLaneInnerT', () => {
  it('should return 0 for innermost left lane', () => {
    const left1 = makeLane(1, 3.5);
    const section = makeSection([left1], []);
    expect(computeLaneInnerT(section, left1, 0)).toBeCloseTo(0);
  });

  it('should return 0 for innermost right lane', () => {
    const right1 = makeLane(-1, 3.5);
    const section = makeSection([], [right1]);
    expect(computeLaneInnerT(section, right1, 0)).toBeCloseTo(0);
  });
});

describe('stToXyz', () => {
  it('should offset perpendicular to heading 0', () => {
    const pos = stToXyz({ x: 100, y: 0, hdg: 0 }, 3.5, 5);
    expect(pos.x).toBeCloseTo(100);
    expect(pos.y).toBeCloseTo(3.5);
    expect(pos.z).toBe(5);
  });

  it('should offset perpendicular to heading PI/2', () => {
    const pos = stToXyz({ x: 0, y: 100, hdg: Math.PI / 2 }, 3.5, 0);
    expect(pos.x).toBeCloseTo(-3.5);
    expect(pos.y).toBeCloseTo(100);
  });

  it('should handle negative t (right side)', () => {
    const pos = stToXyz({ x: 100, y: 0, hdg: 0 }, -3.5, 0);
    expect(pos.x).toBeCloseTo(100);
    expect(pos.y).toBeCloseTo(-3.5);
  });

  it('raises the point by t·sin(roll) and shrinks lateral to t·cos(roll)', () => {
    const roll = 0.1;
    const t = 4;
    const pos = stToXyz({ x: 0, y: 0, hdg: 0 }, t, 10, roll);
    // heading 0 → perpendicular is +y
    expect(pos.x).toBeCloseTo(0);
    expect(pos.y).toBeCloseTo(t * Math.cos(roll));
    expect(pos.z).toBeCloseTo(10 + t * Math.sin(roll));
  });

  it('lowers the opposite side for negative t under the same roll', () => {
    const roll = 0.1;
    const pos = stToXyz({ x: 0, y: 0, hdg: 0 }, -4, 10, roll);
    expect(pos.z).toBeCloseTo(10 - 4 * Math.sin(roll));
    expect(pos.z).toBeLessThan(10);
  });

  it('is backward-compatible when roll is omitted (defaults to 0)', () => {
    expect(stToXyz({ x: 1, y: 2, hdg: 0.3 }, 5, 7)).toEqual(
      stToXyz({ x: 1, y: 2, hdg: 0.3 }, 5, 7, 0),
    );
  });
});

/** Minimal straight road with one lane per side and a constant superelevation. */
function makeBankedRoad(superA: number): OdrRoad {
  return {
    id: '1',
    name: '',
    length: 100,
    junction: '-1',
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
    elevationProfile: [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
    lateralProfile: superA === 0 ? [] : [{ s: 0, a: superA, b: 0, c: 0, d: 0 }],
    laneOffset: [],
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
    objects: [],
    signals: [],
  };
}

describe('computeLaneBoundaries with superelevation banking', () => {
  it('raises the left outer edge and lowers the right for positive roll', () => {
    const road = makeBankedRoad(0.05);
    const section = road.lanes[0];
    const left = computeLaneBoundaries(road, section, section.leftLanes[0], [0]);
    const right = computeLaneBoundaries(road, section, section.rightLanes[0], [0]);
    // Left outer edge at +t is raised; right outer edge at -t is lowered.
    expect(left[0].outerPos.z).toBeGreaterThan(0);
    expect(right[0].outerPos.z).toBeLessThan(0);
    // Symmetric lanes (|t| = 3.5) → equal and opposite height.
    expect(left[0].outerPos.z).toBeCloseTo(-right[0].outerPos.z, 6);
    expect(left[0].outerPos.z).toBeCloseTo(3.5 * Math.sin(0.05), 6);
  });

  it('keeps the surface flat when there is no lateral profile', () => {
    const road = makeBankedRoad(0);
    const section = road.lanes[0];
    const left = computeLaneBoundaries(road, section, section.leftLanes[0], [0]);
    expect(left[0].outerPos.z).toBeCloseTo(0, 9);
  });
});
