import { describe, it, expect } from 'vitest';
import {
  computeLaneWidth,
  computeLaneOuterT,
  computeLaneInnerT,
  stToXyz,
} from '../../geometry/lane-boundary.js';
import type { OdrLane, OdrLaneSection } from '@osce/shared';

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
});
