import { describe, it, expect } from 'vitest';
import { evaluateLaneOffset } from '../../geometry/lane-offset.js';
import type { OdrLaneOffset } from '@osce/shared';

describe('evaluateLaneOffset', () => {
  it('should return 0 for empty array', () => {
    expect(evaluateLaneOffset([], 50)).toBe(0);
  });

  it('should evaluate constant offset', () => {
    const offsets: OdrLaneOffset[] = [{ s: 0, a: 3.5, b: 0, c: 0, d: 0 }];
    expect(evaluateLaneOffset(offsets, 0)).toBeCloseTo(3.5);
    expect(evaluateLaneOffset(offsets, 50)).toBeCloseTo(3.5);
    expect(evaluateLaneOffset(offsets, 100)).toBeCloseTo(3.5);
  });

  it('should evaluate linear offset', () => {
    const offsets: OdrLaneOffset[] = [{ s: 0, a: 0, b: 0.1, c: 0, d: 0 }];
    expect(evaluateLaneOffset(offsets, 0)).toBeCloseTo(0);
    expect(evaluateLaneOffset(offsets, 10)).toBeCloseTo(1);
    expect(evaluateLaneOffset(offsets, 50)).toBeCloseTo(5);
  });

  it('should evaluate cubic polynomial transition', () => {
    // Simulates two_plus_one.xodr: 0 → 3.5m offset over 50m
    const offsets: OdrLaneOffset[] = [
      { s: 0, a: 0, b: 0, c: 0, d: 0 },
      { s: 125, a: 0, b: 0, c: 0.0042, d: -5.6e-05 },
      { s: 175, a: 3.5, b: 0, c: 0, d: 0 },
    ];

    expect(evaluateLaneOffset(offsets, 0)).toBeCloseTo(0);
    expect(evaluateLaneOffset(offsets, 100)).toBeCloseTo(0);
    // At s=175: a=0 + polynomial over 50m should reach ~3.5
    const ds = 50; // 175 - 125
    const expected = 0 + 0 * ds + 0.0042 * ds * ds + -5.6e-05 * ds * ds * ds;
    expect(evaluateLaneOffset(offsets, 175)).toBeCloseTo(expected, 1);
    // After transition, flat at 3.5
    expect(evaluateLaneOffset(offsets, 200)).toBeCloseTo(3.5);
  });

  it('should select correct segment for multiple offsets', () => {
    const offsets: OdrLaneOffset[] = [
      { s: 0, a: 0, b: 0, c: 0, d: 0 },
      { s: 100, a: 3.5, b: 0, c: 0, d: 0 },
    ];

    expect(evaluateLaneOffset(offsets, 50)).toBeCloseTo(0);
    expect(evaluateLaneOffset(offsets, 100)).toBeCloseTo(3.5);
    expect(evaluateLaneOffset(offsets, 150)).toBeCloseTo(3.5);
  });
});
