import { describe, it, expect } from 'vitest';
import {
  selectObjectGeometry,
  expandObjectRepeat,
  DEFAULT_OBJECT_SIZE,
  MAX_REPEAT_INSTANCES,
} from '../../road/road-object-geometry.js';
import type { OdrObjectRepeat } from '@osce/shared';

function makeRepeat(overrides: Partial<OdrObjectRepeat> = {}): OdrObjectRepeat {
  return {
    s: 0,
    length: 100,
    distance: 10,
    tStart: 0,
    tEnd: 0,
    heightStart: 0,
    heightEnd: 0,
    zOffsetStart: 0,
    zOffsetEnd: 0,
    ...overrides,
  };
}

describe('selectObjectGeometry', () => {
  it('picks a box when length/width/height are all present and positive', () => {
    const kind = selectObjectGeometry({ length: 4, width: 2, height: 3 });
    expect(kind).toEqual({ kind: 'box', length: 4, width: 2, height: 3 });
  });

  it('picks a cylinder from a radius, defaulting height when absent', () => {
    expect(selectObjectGeometry({ radius: 0.15, height: 1.25 })).toEqual({
      kind: 'cylinder',
      radius: 0.15,
      height: 1.25,
    });
    expect(selectObjectGeometry({ radius: 0.5 })).toEqual({
      kind: 'cylinder',
      radius: 0.5,
      height: DEFAULT_OBJECT_SIZE,
    });
  });

  it('prefers a full box over a radius when both are authored', () => {
    const kind = selectObjectGeometry({ length: 1, width: 1, height: 1, radius: 2 });
    expect(kind.kind).toBe('box');
  });

  it('falls back to a cube when no usable dimensions exist', () => {
    expect(selectObjectGeometry({})).toEqual({ kind: 'cube', size: DEFAULT_OBJECT_SIZE });
    // length+width but zero height is not a valid box → fallback cube.
    expect(selectObjectGeometry({ length: 2, width: 3, height: 0 })).toEqual({
      kind: 'cube',
      size: DEFAULT_OBJECT_SIZE,
    });
  });
});

describe('expandObjectRepeat', () => {
  it('spaces instances evenly along s and interpolates t/zOffset', () => {
    const { instances, clamped } = expandObjectRepeat(
      makeRepeat({ s: 5, length: 100, distance: 10, tStart: 0, tEnd: 10, zOffsetStart: 0, zOffsetEnd: 5 }),
    );
    expect(clamped).toBe(false);
    expect(instances).toHaveLength(11); // floor(100/10) + 1
    expect(instances[0]).toEqual({ s: 5, t: 0, zOffset: 0 });
    // Last instance at ds = 100 (frac = 1) → endpoint t/zOffset.
    expect(instances[10].s).toBeCloseTo(105, 6);
    expect(instances[10].t).toBeCloseTo(10, 6);
    expect(instances[10].zOffset).toBeCloseTo(5, 6);
  });

  it('yields nothing for a continuous (distance ≤ 0) repeat', () => {
    expect(expandObjectRepeat(makeRepeat({ distance: 0 }))).toEqual({ instances: [], clamped: false });
  });

  it('clamps at the instance cap and reports it', () => {
    const { instances, clamped } = expandObjectRepeat(makeRepeat({ length: 1000, distance: 1 }));
    expect(clamped).toBe(true);
    expect(instances).toHaveLength(MAX_REPEAT_INSTANCES);
  });

  it('honors a custom cap', () => {
    const { instances, clamped } = expandObjectRepeat(makeRepeat({ length: 100, distance: 10 }), 5);
    expect(clamped).toBe(true);
    expect(instances).toHaveLength(5);
  });
});
