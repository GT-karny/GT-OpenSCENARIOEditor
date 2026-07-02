import { describe, it, expect } from 'vitest';
import type { OdrRoad } from '@osce/shared';
import { computePolePlacementT } from '@osce/opendrive';
import type { SignalAssemblyMetadata } from '../../store/editor-metadata-types.js';
import { computeArmAngleFromWorld } from '../../signal/signal-arm-geometry.js';
import { computeSignalMovePatch } from '../../signal/signal-assembly-operations.js';

/** Straight road (+x) with a right driving lane and a sidewalk pole candidate. */
function straightRoad(overrides?: Partial<OdrRoad>): OdrRoad {
  return {
    id: 'road-1',
    name: 'R',
    length: 100,
    junction: '-1',
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
    elevationProfile: [],
    lateralProfile: [],
    laneOffset: [],
    lanes: [
      {
        s: 0,
        leftLanes: [],
        centerLane: { id: 0, type: 'driving', width: [], roadMarks: [] },
        rightLanes: [
          {
            id: -1,
            type: 'driving',
            width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
            roadMarks: [],
          },
          {
            id: -2,
            type: 'sidewalk',
            width: [{ sOffset: 0, a: 2, b: 0, c: 0, d: 0 }],
            roadMarks: [],
          },
        ],
      },
    ],
    objects: [],
    signals: [{ id: 'sig-1', s: 10, t: -2, orientation: '+', zOffset: 4 }],
    ...overrides,
  };
}

function armAssembly(overrides?: Partial<SignalAssemblyMetadata>): SignalAssemblyMetadata {
  return {
    assemblyId: 'asm-1',
    roadId: 'road-1',
    signalIds: ['sig-1'],
    poleType: 'arm',
    armLength: 3,
    poleObjectId: 'pole-1',
    armObjectId: 'arm-1',
    headPositions: [],
    ...overrides,
  };
}

describe('computeSignalMovePatch', () => {
  it('returns the signal patch and assembly patch with a recomputed arm angle', () => {
    const road = straightRoad();
    const asm = armAssembly();
    const newS = 20;
    const newT = -2;
    const patch = computeSignalMovePatch(road, asm, 'sig-1', newS, newT, {
      armLength: 3,
      armAngle: 0,
    });

    const expectedPoleT = computePolePlacementT(road, newS, 'right');
    const expectedAngle = computeArmAngleFromWorld(road, newS, expectedPoleT, newT);

    expect(patch.signalPatch).toEqual({ s: newS, t: newT });
    expect(patch.assemblyPatch.armLength).toBe(3);
    expect(patch.assemblyPatch.armAngle).toBeCloseTo(expectedAngle, 10);
  });

  it('chooses the right side for t<0 and computes pole/arm object patches', () => {
    const road = straightRoad();
    const asm = armAssembly();
    const newS = 20;
    const newT = -2;
    const patch = computeSignalMovePatch(road, asm, 'sig-1', newS, newT, {
      armLength: 5,
      armAngle: 0,
    });

    const poleT = computePolePlacementT(road, newS, 'right');
    // signal zOffset is 4 → drives pole height and arm zOffset.
    expect(patch.objectPatches).toEqual([
      { id: 'pole-1', patch: { s: newS, t: poleT, height: 4 } },
      {
        id: 'arm-1',
        patch: {
          s: newS,
          t: (poleT + newT) / 2,
          zOffset: 4,
          length: 5,
          hdg: newT > poleT ? Math.PI / 2 : -Math.PI / 2,
        },
      },
    ]);
  });

  it('chooses the left side for t>0', () => {
    // Road with a left sidewalk lane for a valid left-side pole placement.
    const road = straightRoad({
      lanes: [
        {
          s: 0,
          leftLanes: [
            {
              id: 1,
              type: 'driving',
              width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
              roadMarks: [],
            },
            {
              id: 2,
              type: 'sidewalk',
              width: [{ sOffset: 0, a: 2, b: 0, c: 0, d: 0 }],
              roadMarks: [],
            },
          ],
          centerLane: { id: 0, type: 'driving', width: [], roadMarks: [] },
          rightLanes: [],
        },
      ],
      signals: [{ id: 'sig-1', s: 10, t: 2, orientation: '+', zOffset: 6 }],
    });
    const asm = armAssembly();
    const newS = 15;
    const newT = 2;
    const patch = computeSignalMovePatch(road, asm, 'sig-1', newS, newT, {
      armLength: 3,
      armAngle: 0,
    });

    const poleT = computePolePlacementT(road, newS, 'left');
    expect(patch.objectPatches[0]).toEqual({
      id: 'pole-1',
      patch: { s: newS, t: poleT, height: 6 },
    });
  });

  it('defaults zOffset to 5.0 when the signal has none', () => {
    const road = straightRoad({
      signals: [{ id: 'sig-1', s: 10, t: -2, orientation: '+' }],
    });
    const asm = armAssembly();
    const patch = computeSignalMovePatch(road, asm, 'sig-1', 20, -2, {
      armLength: 3,
      armAngle: 0,
    });
    expect(patch.objectPatches[0].patch.height).toBe(5.0);
  });

  it('emits no object patches when there is no pole object', () => {
    const road = straightRoad();
    const asm = armAssembly({ poleObjectId: undefined, armObjectId: undefined });
    const patch = computeSignalMovePatch(road, asm, 'sig-1', 20, -2, {
      armLength: 3,
      armAngle: 0,
    });
    expect(patch.objectPatches).toEqual([]);
    // signal + assembly patches are still produced.
    expect(patch.signalPatch).toEqual({ s: 20, t: -2 });
  });

  it('emits only the pole patch when there is a pole but no arm object', () => {
    const road = straightRoad();
    const asm = armAssembly({ armObjectId: undefined });
    const patch = computeSignalMovePatch(road, asm, 'sig-1', 20, -2, {
      armLength: 3,
      armAngle: 0,
    });
    expect(patch.objectPatches).toHaveLength(1);
    expect(patch.objectPatches[0].id).toBe('pole-1');
  });
});
