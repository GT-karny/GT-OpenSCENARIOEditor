import { describe, it, expect } from 'vitest';
import type { OdrRoad } from '@osce/shared';
import type { AssemblyPreset } from '../../signal/signal-preset-store.js';
import type { SignalHeadPreset } from '../../signal/signal-presets.js';
import {
  resolveSignalOrientation,
  mirrorAssemblyHeadsForOrientation,
  resolveHeadZOffset,
  PEDESTRIAN_HEAD_Z_OFFSET,
  DEFAULT_HEAD_Z_OFFSET,
} from '../../signal/signal-orientation.js';

function road(rule?: 'RHT' | 'LHT'): OdrRoad {
  return {
    id: 'road-1',
    name: 'R',
    length: 100,
    junction: '-1',
    rule,
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
    elevationProfile: [],
    lateralProfile: [],
    laneOffset: [],
    lanes: [],
    objects: [],
    signals: [],
  };
}

describe('resolveSignalOrientation', () => {
  describe('RHT road (rule !== LHT)', () => {
    const rht = road('RHT');
    it('right lane (t<0): keeps user orientation', () => {
      expect(resolveSignalOrientation(rht, -2, '+')).toBe('+');
      expect(resolveSignalOrientation(rht, -2, '-')).toBe('-');
    });
    it('left lane (t>0): flips user orientation', () => {
      expect(resolveSignalOrientation(rht, 2, '+')).toBe('-');
      expect(resolveSignalOrientation(rht, 2, '-')).toBe('+');
    });
  });

  describe('LHT road', () => {
    const lht = road('LHT');
    it('right lane (t<0): flips user orientation', () => {
      expect(resolveSignalOrientation(lht, -2, '+')).toBe('-');
      expect(resolveSignalOrientation(lht, -2, '-')).toBe('+');
    });
    it('left lane (t>0): keeps user orientation', () => {
      expect(resolveSignalOrientation(lht, 2, '+')).toBe('+');
      expect(resolveSignalOrientation(lht, 2, '-')).toBe('-');
    });
  });

  describe('undefined road (treated as RHT)', () => {
    it('right lane keeps, left lane flips', () => {
      expect(resolveSignalOrientation(undefined, -2, '+')).toBe('+');
      expect(resolveSignalOrientation(undefined, 2, '+')).toBe('-');
    });
  });

  it('road without an explicit rule is treated as RHT', () => {
    const noRule = road(undefined);
    expect(resolveSignalOrientation(noRule, -2, '+')).toBe('+');
    expect(resolveSignalOrientation(noRule, 2, '+')).toBe('-');
  });
});

describe('mirrorAssemblyHeadsForOrientation', () => {
  const preset: AssemblyPreset = {
    id: 'p1',
    name: 'Two heads',
    heads: [
      { presetId: 'a', x: 1, y: 0 },
      { presetId: 'b', x: -2, y: 0.5 },
    ],
  };

  it("orientation '+' negates head x offsets (xMirror = -1)", () => {
    const heads = mirrorAssemblyHeadsForOrientation(preset, 'fallback', '+');
    expect(heads).toEqual([
      { presetId: 'a', x: -1, y: 0 },
      { presetId: 'b', x: 2, y: 0.5 },
    ]);
  });

  it("orientation '-' preserves head x offsets (xMirror = +1)", () => {
    const heads = mirrorAssemblyHeadsForOrientation(preset, 'fallback', '-');
    expect(heads).toEqual([
      { presetId: 'a', x: 1, y: 0 },
      { presetId: 'b', x: -2, y: 0.5 },
    ]);
  });

  it('falls back to a single head at origin when no preset supplied', () => {
    expect(mirrorAssemblyHeadsForOrientation(undefined, 'fallback', '+')).toEqual([
      { presetId: 'fallback', x: 0, y: 0 },
    ]);
  });

  it('falls back to a single head when the preset has no heads', () => {
    const empty: AssemblyPreset = { id: 'e', name: 'Empty', heads: [] };
    expect(mirrorAssemblyHeadsForOrientation(empty, 'fallback', '-')).toEqual([
      { presetId: 'fallback', x: 0, y: 0 },
    ]);
  });

  it('does not mutate the source preset heads', () => {
    mirrorAssemblyHeadsForOrientation(preset, 'fallback', '+');
    expect(preset.heads[0].x).toBe(1);
    expect(preset.heads[1].x).toBe(-2);
  });
});

describe('resolveHeadZOffset', () => {
  const pedestrian: SignalHeadPreset = {
    id: 'pedestrian-2',
    label: 'Pedestrian',
    orientation: 'vertical',
    bulbs: [],
    category: 'pedestrian',
  };
  const vehicle: SignalHeadPreset = {
    id: '3-light-vertical',
    label: 'Vehicle',
    orientation: 'vertical',
    bulbs: [],
    category: 'vehicle',
  };
  const arrow: SignalHeadPreset = {
    id: 'arrow-left',
    label: 'Arrow',
    orientation: 'vertical',
    bulbs: [],
    category: 'arrow',
  };

  it('returns 2.5 for pedestrian heads', () => {
    expect(resolveHeadZOffset(pedestrian)).toBe(PEDESTRIAN_HEAD_Z_OFFSET);
    expect(resolveHeadZOffset(pedestrian)).toBe(2.5);
  });

  it('returns 5.0 for vehicle and arrow heads', () => {
    expect(resolveHeadZOffset(vehicle)).toBe(DEFAULT_HEAD_Z_OFFSET);
    expect(resolveHeadZOffset(arrow)).toBe(5.0);
  });

  it('returns 5.0 when preset is undefined', () => {
    expect(resolveHeadZOffset(undefined)).toBe(5.0);
  });
});
