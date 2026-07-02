import { describe, it, expect } from 'vitest';
import type { OdrRoad, OpenDriveDocument } from '@osce/shared';
import { evaluateReferenceLineAtS, evaluateElevation, stToXyz } from '@osce/opendrive';
import type { SignalAssemblyMetadata } from '../../store/editor-metadata-types.js';
import {
  computeArmAngleFromWorld,
  buildSignalAssemblyMap,
} from '../../signal/signal-arm-geometry.js';

/** Straight road along +x (hdg = 0). */
function straightRoad(overrides?: Partial<OdrRoad>): OdrRoad {
  return {
    id: 'road-1',
    name: 'Straight',
    length: 100,
    junction: '-1',
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
    elevationProfile: [],
    lateralProfile: [],
    laneOffset: [],
    lanes: [],
    objects: [],
    signals: [],
    ...overrides,
  };
}

/** Arc road curving left, starting at origin with hdg = 0. */
function arcRoad(overrides?: Partial<OdrRoad>): OdrRoad {
  return {
    id: 'road-arc',
    name: 'Arc',
    length: 50,
    junction: '-1',
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 50, type: 'arc', curvature: 0.05 }],
    elevationProfile: [],
    lateralProfile: [],
    laneOffset: [],
    lanes: [],
    objects: [],
    signals: [],
    ...overrides,
  };
}

function emptyDoc(roads: OdrRoad[]): OpenDriveDocument {
  return {
    header: { revMajor: 1, revMinor: 7, name: 'T', date: '2024-01-01' },
    roads,
    controllers: [],
    junctions: [],
  };
}

/** Reference implementation replicating the original inline formula. */
function referenceArmAngle(road: OdrRoad, s: number, poleT: number, headT: number): number {
  const pose = evaluateReferenceLineAtS(road.planView, s);
  const z = evaluateElevation(road.elevationProfile, s);
  const poleWorld = stToXyz(pose, poleT, z);
  const headWorld = stToXyz(pose, headT, z);
  return Math.atan2(headWorld.y - poleWorld.y, headWorld.x - poleWorld.x);
}

describe('computeArmAngleFromWorld', () => {
  it('points toward +t (left of heading) on a straight +x road', () => {
    // On a straight road with hdg=0, +t is +y. Head at t>pole → angle = +pi/2.
    const road = straightRoad();
    const angle = computeArmAngleFromWorld(road, 10, -2, 5);
    expect(angle).toBeCloseTo(Math.PI / 2, 10);
  });

  it('points toward -t (right of heading) when head t < pole t', () => {
    const road = straightRoad();
    const angle = computeArmAngleFromWorld(road, 10, 5, -2);
    expect(angle).toBeCloseTo(-Math.PI / 2, 10);
  });

  it('matches the original inline formula on an arc road (right lane, t<0)', () => {
    const road = arcRoad();
    const s = 20;
    const poleT = -6;
    const headT = -2;
    expect(computeArmAngleFromWorld(road, s, poleT, headT)).toBeCloseTo(
      referenceArmAngle(road, s, poleT, headT),
      10,
    );
  });

  it('matches the original inline formula on an arc road (left lane, t>0)', () => {
    const road = arcRoad();
    const s = 35;
    const poleT = 6;
    const headT = 2;
    expect(computeArmAngleFromWorld(road, s, poleT, headT)).toBeCloseTo(
      referenceArmAngle(road, s, poleT, headT),
      10,
    );
  });

  it('respects elevation z (z cancels in the XY-plane atan2)', () => {
    const road = straightRoad({ elevationProfile: [{ s: 0, a: 3, b: 0, c: 0, d: 0 }] });
    // z is identical for pole and head, so it does not affect the XY angle.
    expect(computeArmAngleFromWorld(road, 10, -2, 5)).toBeCloseTo(Math.PI / 2, 10);
  });
});

describe('buildSignalAssemblyMap', () => {
  it('returns undefined when there are no assemblies', () => {
    expect(buildSignalAssemblyMap(emptyDoc([]), undefined)).toBeUndefined();
    expect(buildSignalAssemblyMap(emptyDoc([]), [])).toBeUndefined();
  });

  it('maps a PoleAssemblyInfo under every signal id, preserving a set armAngle', () => {
    const asm: SignalAssemblyMetadata = {
      assemblyId: 'asm-1',
      roadId: 'road-1',
      signalIds: ['sig-a', 'sig-b'],
      poleType: 'arm',
      armLength: 3,
      armAngle: 1.234,
      headPositions: [],
    };
    const map = buildSignalAssemblyMap(emptyDoc([straightRoad()]), [asm]);
    expect(map).toBeDefined();
    const infoA = map?.get('sig-a');
    const infoB = map?.get('sig-b');
    expect(infoA).toEqual({
      assemblyId: 'asm-1',
      poleType: 'arm',
      armLength: 3,
      armAngle: 1.234,
      signalIds: ['sig-a', 'sig-b'],
    });
    // Both signal ids share the same info object.
    expect(infoA).toBe(infoB);
  });

  it('computes armAngle from geometry when missing (arm pole with pole object)', () => {
    const road = straightRoad({
      objects: [{ id: 'pole-1', type: 'pole', s: 10, t: -6 }],
      signals: [{ id: 'sig-1', s: 10, t: -2, orientation: '+' }],
    });
    const asm: SignalAssemblyMetadata = {
      assemblyId: 'asm-1',
      roadId: 'road-1',
      signalIds: ['sig-1'],
      poleType: 'arm',
      poleObjectId: 'pole-1',
      headPositions: [],
    };
    const map = buildSignalAssemblyMap(emptyDoc([road]), [asm]);
    const info = map?.get('sig-1');
    // poleT=-6, headT=-2 on straight road → head is at +t relative to pole → +pi/2.
    expect(info?.armAngle).toBeCloseTo(Math.PI / 2, 10);
  });

  it('leaves armAngle undefined for a straight pole type (no recompute)', () => {
    const road = straightRoad({
      objects: [{ id: 'pole-1', type: 'pole', s: 10, t: -6 }],
      signals: [{ id: 'sig-1', s: 10, t: -2, orientation: '+' }],
    });
    const asm: SignalAssemblyMetadata = {
      assemblyId: 'asm-1',
      roadId: 'road-1',
      signalIds: ['sig-1'],
      poleType: 'straight',
      poleObjectId: 'pole-1',
      headPositions: [],
    };
    const map = buildSignalAssemblyMap(emptyDoc([road]), [asm]);
    expect(map?.get('sig-1')?.armAngle).toBeUndefined();
  });

  it('leaves armAngle undefined when the pole object is missing', () => {
    const road = straightRoad({
      signals: [{ id: 'sig-1', s: 10, t: -2, orientation: '+' }],
    });
    const asm: SignalAssemblyMetadata = {
      assemblyId: 'asm-1',
      roadId: 'road-1',
      signalIds: ['sig-1'],
      poleType: 'arm',
      poleObjectId: 'pole-missing',
      headPositions: [],
    };
    const map = buildSignalAssemblyMap(emptyDoc([road]), [asm]);
    expect(map?.get('sig-1')?.armAngle).toBeUndefined();
  });
});
