import { describe, it, expect } from 'vitest';
import {
  housingForBulbCount,
  resolveSignalDescriptor,
  SIGNAL_CATALOG,
} from '../signal/signal-catalog.js';

describe('housingForBulbCount polymorphism', () => {
  it('handles 1 bulb (arrow signal)', () => {
    const h = housingForBulbCount(1);
    expect(h.width).toBe(0.4);
    expect(h.height).toBeGreaterThan(0);
    expect(h.height).toBeLessThan(housingForBulbCount(2).height);
  });

  it('handles 2 bulbs (pedestrian signal)', () => {
    const h = housingForBulbCount(2);
    expect(h.height).toBeGreaterThan(housingForBulbCount(1).height);
    expect(h.height).toBeLessThan(housingForBulbCount(3).height);
  });

  it('handles 3 bulbs (standard signal)', () => {
    const h = housingForBulbCount(3);
    // (3-1)*0.38 + 2*(0.12+0.07) = 0.76 + 0.38 = 1.14
    expect(h.height).toBeCloseTo(1.14, 2);
  });

  it('horizontal orientation swaps width and height', () => {
    const v = housingForBulbCount(3, 'vertical');
    const h = housingForBulbCount(3, 'horizontal');
    expect(h.width).toBeCloseTo(v.height, 5);
    expect(h.height).toBe(v.width);
  });
});

describe('resolveSignalDescriptor bulb-count awareness', () => {
  it('1000001 returns 3 bulbs', () => {
    const d = resolveSignalDescriptor({
      id: 'test', s: 0, t: 0, orientation: '+', type: '1000001',
    });
    expect(d).not.toBeNull();
    expect(d!.bulbs).toHaveLength(3);
  });

  it('1000002 returns 2 bulbs', () => {
    const d = resolveSignalDescriptor({
      id: 'test', s: 0, t: 0, orientation: '+', type: '1000002',
    });
    expect(d).not.toBeNull();
    expect(d!.bulbs).toHaveLength(2);
  });

  it('1000012 returns 1 bulb', () => {
    const d = resolveSignalDescriptor({
      id: 'test', s: 0, t: 0, orientation: '+', type: '1000012',
    });
    expect(d).not.toBeNull();
    expect(d!.bulbs).toHaveLength(1);
  });

  it('bulb definitions include correct shapes for pedestrian', () => {
    const d = resolveSignalDescriptor({
      id: 'test', s: 0, t: 0, orientation: '+', type: '1000002',
    });
    expect(d!.bulbs[0].shape).toBe('pedestrian-stop');
    expect(d!.bulbs[1].shape).toBe('pedestrian-go');
  });

  it('arrow subtype maps to correct shape', () => {
    const d = resolveSignalDescriptor({
      id: 'test', s: 0, t: 0, orientation: '+', type: '1000012', subtype: '10',
    });
    expect(d!.bulbs[0].shape).toBe('arrow-left');
  });
});

describe('SIGNAL_CATALOG completeness', () => {
  it('all descriptors have matching housing for their bulb count', () => {
    for (const [, desc] of SIGNAL_CATALOG) {
      const expected = housingForBulbCount(desc.bulbs.length, desc.orientation);
      expect(desc.housing.width).toBeCloseTo(expected.width, 5);
      expect(desc.housing.height).toBeCloseTo(expected.height, 5);
    }
  });
});
