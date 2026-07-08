import { describe, it, expect } from 'vitest';
import type { OdrLane, OdrLaneSection } from '@osce/shared';
import {
  normalizeAngle,
  evalCubic,
  findRecordAtS,
  findLaneSectionAtS,
  findLaneSectionIndexAtS,
  ensureArray,
} from '../../utils/math.js';

describe('normalizeAngle', () => {
  const PI = Math.PI;

  it('keeps PI as PI (upper bound inclusive)', () => {
    expect(normalizeAngle(PI)).toBeCloseTo(PI, 12);
  });

  it('maps -PI to +PI (lower bound exclusive)', () => {
    expect(normalizeAngle(-PI)).toBeCloseTo(PI, 12);
  });

  it('leaves 0 unchanged', () => {
    expect(normalizeAngle(0)).toBe(0);
  });

  it('wraps 3*PI to PI', () => {
    expect(normalizeAngle(3 * PI)).toBeCloseTo(PI, 12);
  });

  it('wraps -3*PI to PI', () => {
    expect(normalizeAngle(-3 * PI)).toBeCloseTo(PI, 12);
  });

  it('wraps angles just above PI into the negative half', () => {
    expect(normalizeAngle(PI + 0.1)).toBeCloseTo(-PI + 0.1, 12);
  });

  it('keeps angles just below PI unchanged', () => {
    expect(normalizeAngle(PI - 0.1)).toBeCloseTo(PI - 0.1, 12);
  });

  it('normalizes a large positive angle into (-PI, PI]', () => {
    const result = normalizeAngle(100);
    expect(result).toBeGreaterThan(-PI);
    expect(result).toBeLessThanOrEqual(PI);
    expect(Math.cos(result)).toBeCloseTo(Math.cos(100), 10);
    expect(Math.sin(result)).toBeCloseTo(Math.sin(100), 10);
  });

  it('normalizes a large negative angle into (-PI, PI]', () => {
    const result = normalizeAngle(-100);
    expect(result).toBeGreaterThan(-PI);
    expect(result).toBeLessThanOrEqual(PI);
    expect(Math.cos(result)).toBeCloseTo(Math.cos(-100), 10);
    expect(Math.sin(result)).toBeCloseTo(Math.sin(-100), 10);
  });

  it('wraps 2*PI to 0', () => {
    expect(normalizeAngle(2 * PI)).toBeCloseTo(0, 12);
  });
});

describe('evalCubic', () => {
  it('evaluates a constant polynomial', () => {
    expect(evalCubic(5, 0, 0, 0, 42)).toBe(5);
  });

  it('evaluates a linear polynomial', () => {
    // 2 + 3*ds
    expect(evalCubic(2, 3, 0, 0, 4)).toBe(14);
  });

  it('evaluates a full cubic polynomial', () => {
    // 1 + 2*ds + 3*ds^2 + 4*ds^3 at ds=2 => 1 + 4 + 12 + 32 = 49
    expect(evalCubic(1, 2, 3, 4, 2)).toBe(49);
  });

  it('handles ds=0 returning the constant term', () => {
    expect(evalCubic(7, 11, 13, 17, 0)).toBe(7);
  });
});

describe('findRecordAtS', () => {
  interface Rec {
    s: number;
    name: string;
  }
  const records: Rec[] = [
    { s: 0, name: 'a' },
    { s: 10, name: 'b' },
    { s: 20, name: 'c' },
  ];
  const getS = (r: Rec): number => r.s;

  it('returns undefined for an empty array', () => {
    expect(findRecordAtS([], 5, getS)).toBeUndefined();
  });

  it('returns the first record when s is before the first boundary', () => {
    // Binary search clamps to index 0 when nothing is <= s.
    expect(findRecordAtS(records, -5, getS)?.name).toBe('a');
  });

  it('returns the record at an exact boundary', () => {
    expect(findRecordAtS(records, 10, getS)?.name).toBe('b');
  });

  it('returns the last matching record between boundaries', () => {
    expect(findRecordAtS(records, 15, getS)?.name).toBe('b');
  });

  it('returns the last record when s is past the end', () => {
    expect(findRecordAtS(records, 1000, getS)?.name).toBe('c');
  });

  it('returns the first record at s=0', () => {
    expect(findRecordAtS(records, 0, getS)?.name).toBe('a');
  });
});

describe('findLaneSectionAtS', () => {
  function makeSection(s: number): OdrLaneSection {
    const centerLane: OdrLane = { id: 0, type: 'none', width: [], roadMarks: [] };
    return { s, leftLanes: [], centerLane, rightLanes: [] };
  }

  const sections: OdrLaneSection[] = [makeSection(0), makeSection(50), makeSection(120)];

  it('returns undefined for no sections', () => {
    expect(findLaneSectionAtS([], 10)).toBeUndefined();
  });

  it('returns the first section before the second boundary', () => {
    expect(findLaneSectionAtS(sections, 25)?.s).toBe(0);
  });

  it('returns the section at an exact boundary', () => {
    expect(findLaneSectionAtS(sections, 50)?.s).toBe(50);
  });

  it('returns the last section past the end', () => {
    expect(findLaneSectionAtS(sections, 9999)?.s).toBe(120);
  });

  it('clamps to the first section before the first boundary', () => {
    expect(findLaneSectionAtS(sections, -1)?.s).toBe(0);
  });
});

describe('findLaneSectionIndexAtS', () => {
  function makeSection(s: number): OdrLaneSection {
    const centerLane: OdrLane = { id: 0, type: 'none', width: [], roadMarks: [] };
    return { s, leftLanes: [], centerLane, rightLanes: [] };
  }

  const sections: OdrLaneSection[] = [makeSection(0), makeSection(50), makeSection(120)];

  it('returns 0 for no sections', () => {
    expect(findLaneSectionIndexAtS([], 10)).toBe(0);
  });

  it('returns the first index before the second boundary', () => {
    expect(findLaneSectionIndexAtS(sections, 25)).toBe(0);
  });

  it('returns the index at an exact boundary', () => {
    expect(findLaneSectionIndexAtS(sections, 50)).toBe(1);
  });

  it('returns the last index past the end', () => {
    expect(findLaneSectionIndexAtS(sections, 9999)).toBe(2);
  });

  it('clamps to index 0 before the first boundary', () => {
    expect(findLaneSectionIndexAtS(sections, -1)).toBe(0);
  });

  it('agrees with findLaneSectionAtS across a range of s values', () => {
    for (const s of [-10, 0, 1, 49, 50, 51, 119, 120, 121, 1000]) {
      const idx = findLaneSectionIndexAtS(sections, s);
      expect(sections[idx].s).toBe(findLaneSectionAtS(sections, s)?.s);
    }
  });
});

describe('ensureArray', () => {
  it('returns an empty array for undefined', () => {
    expect(ensureArray(undefined)).toEqual([]);
  });

  it('returns an empty array for null', () => {
    expect(ensureArray(null)).toEqual([]);
  });

  it('wraps a scalar in an array', () => {
    expect(ensureArray(42)).toEqual([42]);
  });

  it('returns an existing array unchanged', () => {
    const arr = [1, 2, 3];
    expect(ensureArray(arr)).toBe(arr);
  });

  it('treats an empty array as-is', () => {
    const arr: number[] = [];
    expect(ensureArray(arr)).toBe(arr);
  });
});
