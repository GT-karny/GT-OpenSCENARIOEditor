import { describe, it, expect } from 'vitest';
import type { OdrSignal } from '@osce/shared';
import {
  resolveSignalDescriptor,
  housingForBulbCount,
  SIGNAL_CATALOG,
} from '../../utils/signal-catalog.js';

function makeSignal(overrides: Partial<OdrSignal> = {}): OdrSignal {
  return {
    id: '1',
    s: 0,
    t: 0,
    orientation: '+',
    ...overrides,
  } as OdrSignal;
}

describe('resolveSignalDescriptor', () => {
  it('returns 3-bulb descriptor for type 1000001', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '1000001' }));
    expect(d).not.toBeNull();
    expect(d!.bulbs).toHaveLength(3);
    expect(d!.bulbs.map((b) => b.color)).toEqual(['red', 'yellow', 'green']);
    expect(d!.bulbs.map((b) => b.shape)).toEqual(['circle', 'circle', 'circle']);
  });

  it('returns 2-bulb pedestrian descriptor for type 1000002', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '1000002' }));
    expect(d).not.toBeNull();
    expect(d!.bulbs).toHaveLength(2);
    expect(d!.bulbs[0]).toEqual({ color: 'red', shape: 'pedestrian-stop' });
    expect(d!.bulbs[1]).toEqual({ color: 'green', shape: 'pedestrian-go' });
  });

  it('returns 1-bulb for type 1000002 subtype 10 (red only)', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '1000002', subtype: '10' }));
    expect(d).not.toBeNull();
    expect(d!.bulbs).toHaveLength(1);
    expect(d!.bulbs[0].shape).toBe('pedestrian-stop');
  });

  it('returns 1-bulb for type 1000002 subtype 20 (green only)', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '1000002', subtype: '20' }));
    expect(d).not.toBeNull();
    expect(d!.bulbs).toHaveLength(1);
    expect(d!.bulbs[0].shape).toBe('pedestrian-go');
  });

  it('returns red-yellow 2-bulb for type 1000009 subtype 10', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '1000009', subtype: '10' }));
    expect(d).not.toBeNull();
    expect(d!.bulbs.map((b) => b.color)).toEqual(['red', 'yellow']);
  });

  it('returns yellow-green 2-bulb for type 1000009 subtype 20', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '1000009', subtype: '20' }));
    expect(d!.bulbs.map((b) => b.color)).toEqual(['yellow', 'green']);
  });

  it('returns red-green 2-bulb for type 1000009 subtype 30', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '1000009', subtype: '30' }));
    expect(d!.bulbs.map((b) => b.color)).toEqual(['red', 'green']);
  });

  it('returns arrow-left 3-light for type 1000011 subtype 10', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '1000011', subtype: '10' }));
    expect(d).not.toBeNull();
    expect(d!.bulbs).toHaveLength(3);
    expect(d!.bulbs[0].shape).toBe('arrow-left');
    expect(d!.bulbs[1].shape).toBe('arrow-left');
    expect(d!.bulbs[2].shape).toBe('arrow-left');
  });

  it('returns arrow-up 3-light for type 1000011 subtype 30', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '1000011', subtype: '30' }));
    expect(d!.bulbs[0].shape).toBe('arrow-up');
  });

  it('returns single red arrow-left for type 1000020 subtype 10', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '1000020', subtype: '10' }));
    expect(d).not.toBeNull();
    expect(d!.bulbs).toHaveLength(1);
    expect(d!.bulbs[0]).toEqual({ color: 'red', shape: 'arrow-left' });
  });

  it('returns single yellow dot for type 1000008', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '1000008' }));
    expect(d).not.toBeNull();
    expect(d!.bulbs).toHaveLength(1);
    expect(d!.bulbs[0]).toEqual({ color: 'yellow', shape: 'circle' });
  });

  it('returns single green arrow-up for type 1000012 subtype 30', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '1000012', subtype: '30' }));
    expect(d!.bulbs).toHaveLength(1);
    expect(d!.bulbs[0]).toEqual({ color: 'green', shape: 'arrow-up' });
  });

  it('falls back to type-only when subtype not in catalog', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '1000001', subtype: '99' }));
    expect(d).not.toBeNull();
    expect(d!.bulbs).toHaveLength(3);
  });

  it('falls back to type-only when subtype is -1', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '1000002', subtype: '-1' }));
    expect(d).not.toBeNull();
    expect(d!.bulbs).toHaveLength(2);
    expect(d!.bulbs[0].shape).toBe('pedestrian-stop');
  });

  it('returns 3-light default for dynamic=yes with unknown type', () => {
    const d = resolveSignalDescriptor(makeSignal({ dynamic: 'yes', type: '9999' }));
    expect(d).not.toBeNull();
    expect(d!.bulbs).toHaveLength(3);
    expect(d!.bulbs.map((b) => b.color)).toEqual(['red', 'yellow', 'green']);
  });

  it('returns null for non-traffic-signal types', () => {
    const d = resolveSignalDescriptor(makeSignal({ type: '206' }));
    expect(d).toBeNull();
  });

  it('returns null for empty type without dynamic flag', () => {
    const d = resolveSignalDescriptor(makeSignal({}));
    expect(d).toBeNull();
  });
});

describe('housingForBulbCount', () => {
  it('3-bulb housing is approximately 1.04m tall', () => {
    const h = housingForBulbCount(3);
    expect(h.height).toBeCloseTo(1.04, 1);
  });

  it('2-bulb housing is shorter than 3-bulb', () => {
    expect(housingForBulbCount(2).height).toBeLessThan(housingForBulbCount(3).height);
  });

  it('1-bulb housing is shortest', () => {
    expect(housingForBulbCount(1).height).toBeLessThan(housingForBulbCount(2).height);
  });

  it('all have same width and depth', () => {
    for (const n of [1, 2, 3]) {
      const h = housingForBulbCount(n);
      expect(h.width).toBe(0.4);
      expect(h.depth).toBe(0.25);
    }
  });
});

describe('SIGNAL_CATALOG', () => {
  it('contains entries for all Phase 1 base types', () => {
    expect(SIGNAL_CATALOG.has('1000001')).toBe(true);
    expect(SIGNAL_CATALOG.has('1000002')).toBe(true);
    expect(SIGNAL_CATALOG.has('1000020')).toBe(true);
    expect(SIGNAL_CATALOG.has('1000008')).toBe(true);
    expect(SIGNAL_CATALOG.has('1000012')).toBe(true);
  });

  it('contains all arrow subtypes for single-bulb types', () => {
    for (const type of ['1000020', '1000008', '1000012']) {
      for (const sub of ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100']) {
        expect(SIGNAL_CATALOG.has(`${type}:${sub}`)).toBe(true);
      }
    }
  });

  it('contains all 1000011 subtypes', () => {
    for (const sub of ['10', '20', '30', '40', '50']) {
      expect(SIGNAL_CATALOG.has(`1000011:${sub}`)).toBe(true);
    }
  });
});
