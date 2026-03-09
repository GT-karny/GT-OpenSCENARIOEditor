import { describe, it, expect } from 'vitest';
import { resolveSignalPosition } from '../../utils/signal-position-resolver.js';
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
    expect(result!.h).toBeCloseTo(0, 5); // road heading = 0, no hOffset
  });

  it('flips heading for orientation -', () => {
    const road = makeStraightRoad(100);
    const signal = makeSignal({ orientation: '-' });

    const result = resolveSignalPosition(signal, road);
    expect(result).not.toBeNull();
    expect(result!.h).toBeCloseTo(Math.PI, 5);
  });

  it('applies hOffset', () => {
    const road = makeStraightRoad(100);
    const signal = makeSignal({ hOffset: Math.PI / 4 });

    const result = resolveSignalPosition(signal, road);
    expect(result).not.toBeNull();
    expect(result!.h).toBeCloseTo(Math.PI / 4, 5);
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
    // Default height is 4.0
    expect(result!.z).toBeCloseTo(4.0, 1);
  });
});
