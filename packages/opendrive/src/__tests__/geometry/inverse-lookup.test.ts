import { describe, it, expect } from 'vitest';
import { worldToRoad, worldToLane } from '../../geometry/inverse-lookup.js';
import type { OpenDriveDocument, OdrRoad, OdrLane, OdrLaneSection, OdrLaneWidth } from '@osce/shared';

function makeLaneWidth(a: number): OdrLaneWidth {
  return { sOffset: 0, a, b: 0, c: 0, d: 0 };
}

function makeStraightRoad(laneOffsetA = 0): OdrRoad {
  const leftLane: OdrLane = {
    id: 1,
    type: 'driving',
    width: [makeLaneWidth(3.5)],
    roadMarks: [],
  };
  const centerLane: OdrLane = {
    id: 0,
    type: 'none',
    width: [],
    roadMarks: [],
  };
  const rightLane: OdrLane = {
    id: -1,
    type: 'driving',
    width: [makeLaneWidth(3.5)],
    roadMarks: [],
  };
  const laneSection: OdrLaneSection = {
    s: 0,
    leftLanes: [leftLane],
    centerLane,
    rightLanes: [rightLane],
  };
  return {
    id: '1',
    name: 'TestRoad',
    length: 100,
    junction: '-1',
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
    elevationProfile: [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
    lateralProfile: [],
    laneOffset: laneOffsetA !== 0 ? [{ s: 0, a: laneOffsetA, b: 0, c: 0, d: 0 }] : [],
    lanes: [laneSection],
    objects: [],
    signals: [],
  };
}

function makeDoc(road: OdrRoad): OpenDriveDocument {
  return {
    header: { revMajor: 1, revMinor: 7, name: 'Test', date: '2024-01-01' },
    roads: [road],
    controllers: [],
    junctions: [],
  };
}

describe('worldToRoad', () => {
  it('finds the nearest road point on a straight road', () => {
    const doc = makeDoc(makeStraightRoad());
    const result = worldToRoad(doc, 50, 0);
    expect(result).not.toBeNull();
    expect(result!.roadId).toBe('1');
    expect(result!.s).toBeCloseTo(50, 0);
    expect(result!.t).toBeCloseTo(0, 1);
  });

  it('returns null when too far from road', () => {
    const doc = makeDoc(makeStraightRoad());
    const result = worldToRoad(doc, 50, 100);
    expect(result).toBeNull();
  });
});

describe('worldToLane', () => {
  it('identifies right lane from point on right side', () => {
    const doc = makeDoc(makeStraightRoad());
    // Right lane center is at y = -1.75
    const result = worldToLane(doc, 50, -1.75);
    expect(result).not.toBeNull();
    expect(result!.laneId).toBe(-1);
    expect(result!.offset).toBeCloseTo(0, 1);
  });

  it('identifies left lane from point on left side', () => {
    const doc = makeDoc(makeStraightRoad());
    // Left lane center is at y = +1.75
    const result = worldToLane(doc, 50, 1.75);
    expect(result).not.toBeNull();
    expect(result!.laneId).toBe(1);
    expect(result!.offset).toBeCloseTo(0, 1);
  });

  it('applies laneOffset when matching lanes', () => {
    // With laneOffset a=3.5, the entire lane structure shifts +3.5 in t
    // Right lane center: 0 → -1.75 → shifted to +1.75
    // Left lane center: 0 → +1.75 → shifted to +5.25
    const doc = makeDoc(makeStraightRoad(3.5));

    // A point at y=+1.75 should now match the RIGHT lane (shifted from -1.75 to +1.75)
    const rightResult = worldToLane(doc, 50, 1.75);
    expect(rightResult).not.toBeNull();
    expect(rightResult!.laneId).toBe(-1);
    expect(rightResult!.offset).toBeCloseTo(0, 1);

    // A point at y=+5.25 should match the LEFT lane (shifted from +1.75 to +5.25)
    const leftResult = worldToLane(doc, 50, 5.25);
    expect(leftResult).not.toBeNull();
    expect(leftResult!.laneId).toBe(1);
    expect(leftResult!.offset).toBeCloseTo(0, 1);
  });

  it('without laneOffset, y=-1.75 matches right lane; with offset it does not', () => {
    // Without offset: y=-1.75 is right lane center
    const docNoOff = makeDoc(makeStraightRoad(0));
    const r1 = worldToLane(docNoOff, 50, -1.75);
    expect(r1).not.toBeNull();
    expect(r1!.laneId).toBe(-1);

    // With offset a=3.5: right lane center is now at y=+1.75, so y=-1.75 is far from any lane
    const docOff = makeDoc(makeStraightRoad(3.5));
    const r2 = worldToLane(docOff, 50, -1.75, 10);
    // The closest lane should be the right lane, but with a large offset
    if (r2) {
      expect(r2.laneId).toBe(-1);
      expect(Math.abs(r2.offset)).toBeGreaterThan(2);
    }
  });
});
