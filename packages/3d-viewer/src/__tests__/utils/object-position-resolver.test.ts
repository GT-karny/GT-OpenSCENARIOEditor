import { describe, it, expect } from 'vitest';
import {
  resolveObjectPosition,
  resolveObjectPose,
} from '../../utils/object-position-resolver.js';
import type { OdrRoad, OdrRoadObject } from '@osce/shared';

function makeRoad(overrides: Partial<OdrRoad> = {}): OdrRoad {
  return {
    id: 'road1',
    name: 'TestRoad',
    length: 100,
    junction: '-1',
    planView: [{ type: 'line', s: 0, x: 0, y: 0, hdg: 0, length: 100 }],
    elevationProfile: [],
    lateralProfile: [],
    laneOffset: [],
    lanes: [],
    objects: [],
    signals: [],
    ...overrides,
  } as OdrRoad;
}

function makeObject(overrides: Partial<OdrRoadObject> = {}): OdrRoadObject {
  return { id: 'o1', s: 10, t: 3, ...overrides };
}

describe('resolveObjectPosition', () => {
  it('places an object on a flat straight road (s→x, t→y)', () => {
    const road = makeRoad();
    const result = resolveObjectPosition(makeObject({ s: 10, t: 3, zOffset: 0.5 }), road);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(10, 6); // straight road, hdg=0
    expect(result!.y).toBeCloseTo(3, 6); // t offset (no roll)
    expect(result!.z).toBeCloseTo(0.5, 6); // zOffset, no elevation
    expect(result!.h).toBeCloseTo(0, 6); // road heading + obj.hdg(0)
  });

  it('adds elevation to z and composes superelevation roll into position + orientation', () => {
    const roll = 0.1;
    const road = makeRoad({
      elevationProfile: [{ s: 0, a: 2, b: 0, c: 0, d: 0 }],
      lateralProfile: [{ s: 0, a: roll, b: 0, c: 0, d: 0 }],
    });
    const result = resolveObjectPosition(makeObject({ s: 10, t: 3, zOffset: 0.5 }), road);
    expect(result).not.toBeNull();
    // Lateral offset shrinks to t·cos(roll); height gains elevation + t·sin(roll).
    expect(result!.y).toBeCloseTo(3 * Math.cos(roll), 6);
    expect(result!.z).toBeCloseTo(2 + 0.5 + 3 * Math.sin(roll), 6);
    // Orientation roll = surface roll + authored roll(0).
    expect(result!.roll).toBeCloseTo(roll, 6);
  });

  it('adds object hdg to the road heading', () => {
    const road = makeRoad();
    const result = resolveObjectPosition(makeObject({ hdg: Math.PI / 4 }), road);
    expect(result!.h).toBeCloseTo(Math.PI / 4, 6);
  });

  it('derives pitch from the elevation gradient plus authored pitch', () => {
    const road = makeRoad({ elevationProfile: [{ s: 0, a: 0, b: 0.2, c: 0, d: 0 }] });
    const result = resolveObjectPosition(makeObject({ pitch: 0.05 }), road);
    // gradient dz/ds = 0.2 → atan(0.2), plus authored 0.05.
    expect(result!.pitch).toBeCloseTo(Math.atan(0.2) + 0.05, 6);
  });

  it('returns null when s is outside the road', () => {
    const road = makeRoad({ length: 50 });
    expect(resolveObjectPosition(makeObject({ s: 60 }), road)).toBeNull();
    expect(resolveObjectPosition(makeObject({ s: -1 }), road)).toBeNull();
  });
});

describe('resolveObjectPose (repeat-instance entry point)', () => {
  it('resolves an explicit s/t/zOffset triple', () => {
    const road = makeRoad();
    const pose = resolveObjectPose(road, 20, -2, 1);
    expect(pose).not.toBeNull();
    expect(pose!.x).toBeCloseTo(20, 6);
    expect(pose!.y).toBeCloseTo(-2, 6);
    expect(pose!.z).toBeCloseTo(1, 6);
  });
});
