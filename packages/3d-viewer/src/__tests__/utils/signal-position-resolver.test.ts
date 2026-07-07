import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { resolveSignalPosition } from '../../utils/signal-position-resolver.js';
import { XodrParser } from '@osce/opendrive';
import type { OdrSignal, OdrRoad } from '@osce/shared';

function makeSignal(overrides: Partial<OdrSignal> = {}): OdrSignal {
  return {
    id: 'sig1',
    s: 10,
    t: 3,
    orientation: '+',
    zOffset: 5,
    ...overrides,
  };
}

function makeStraightRoad(length: number): OdrRoad {
  return {
    id: 'road1',
    name: 'TestRoad',
    length,
    junction: '-1',
    planView: [
      {
        type: 'line',
        s: 0,
        x: 0,
        y: 0,
        hdg: 0,
        length,
      },
    ],
    elevationProfile: [],
    lateralProfile: [],
    laneOffset: [],
    lanes: [],
    objects: [],
    signals: [],
  } as OdrRoad;
}

describe('resolveSignalPosition', () => {
  it('resolves a signal on a straight road', () => {
    const road = makeStraightRoad(100);
    const signal = makeSignal({ s: 10, t: 3, zOffset: 5 });

    const result = resolveSignalPosition(signal, road);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(10, 1); // s=10, straight road at hdg=0
    expect(result!.y).toBeCloseTo(3, 1); // t=3, perpendicular offset
    expect(result!.z).toBeCloseTo(5, 1); // zOffset=5, no elevation
    expect(result!.h).toBeCloseTo(Math.PI, 5); // orientation '+' faces against road dir
  });

  it('keeps heading for orientation -', () => {
    const road = makeStraightRoad(100);
    const signal = makeSignal({ orientation: '-' });

    const result = resolveSignalPosition(signal, road);
    expect(result).not.toBeNull();
    expect(result!.h).toBeCloseTo(0, 5); // orientation '-' faces with road dir
  });

  it('applies hOffset', () => {
    const road = makeStraightRoad(100);
    const signal = makeSignal({ hOffset: Math.PI / 4 });

    const result = resolveSignalPosition(signal, road);
    expect(result).not.toBeNull();
    expect(result!.h).toBeCloseTo(Math.PI / 4 + Math.PI, 5); // hOffset + π
  });

  it('returns null for s out of range', () => {
    const road = makeStraightRoad(50);
    const signal = makeSignal({ s: 60 });

    const result = resolveSignalPosition(signal, road);
    expect(result).toBeNull();
  });

  it('uses default height when zOffset is not set', () => {
    const road = makeStraightRoad(100);
    const signal = makeSignal({ zOffset: undefined });

    const result = resolveSignalPosition(signal, road);
    expect(result).not.toBeNull();
    // Default height is 5.0 (JP standard)
    expect(result!.z).toBeCloseTo(5.0, 1);
  });

  it('seats the signal base on the banked surface (superelevation)', () => {
    const roll = 0.1;
    const road = makeStraightRoad(100);
    road.elevationProfile = [{ s: 0, a: 0, b: 0, c: 0, d: 0 }];
    road.lateralProfile = [{ s: 0, a: roll, b: 0, c: 0, d: 0 }];
    const result = resolveSignalPosition(makeSignal({ s: 10, t: 3, zOffset: 5 }), road)!;
    // Lateral shrinks to t·cos(roll); the base rises t·sin(roll), zOffset stays vertical.
    expect(result.y).toBeCloseTo(3 * Math.cos(roll), 5);
    expect(result.z).toBeCloseTo(5 + 3 * Math.sin(roll), 5);
    expect(result.roll).toBeCloseTo(roll, 6);
  });

  it('offsets the signal by the crossSectionSurface height field (roll 0)', () => {
    const road = new XodrParser()
      .parse(
        readFileSync(
          resolve(
            __dirname,
            '../../../../../test-fixtures/opendrive-v1.9/Ex_CrossSectionSurface_CrossFall_LeftTurn_1.xodr',
          ),
          'utf-8',
        ),
      )
      .roads[0];
    const result = resolveSignalPosition(makeSignal({ s: 0, t: 0, zOffset: 5 }), road)!;
    // elevation 0 + zOffset 5 + tOffset base (-0.375) at (s=0, t=0).
    expect(result.z).toBeCloseTo(5 - 0.375, 3);
    expect(result.roll).toBe(0);
  });
});
