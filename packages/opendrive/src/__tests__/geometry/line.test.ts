import { describe, it, expect } from 'vitest';
import { evaluateLine } from '../../geometry/line.js';
import type { OdrGeometry } from '@osce/shared';

describe('evaluateLine', () => {
  const geom: OdrGeometry = {
    s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line',
  };

  it('should return start position at ds=0', () => {
    const p = evaluateLine(0, geom);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
    expect(p.hdg).toBeCloseTo(0);
  });

  it('should move along x axis for hdg=0', () => {
    const p = evaluateLine(50, geom);
    expect(p.x).toBeCloseTo(50);
    expect(p.y).toBeCloseTo(0);
    expect(p.hdg).toBeCloseTo(0);
  });

  it('should handle non-zero heading', () => {
    const g: OdrGeometry = {
      s: 0, x: 10, y: 20, hdg: Math.PI / 2, length: 100, type: 'line',
    };
    const p = evaluateLine(30, g);
    expect(p.x).toBeCloseTo(10, 4);
    expect(p.y).toBeCloseTo(50, 4);
    expect(p.hdg).toBeCloseTo(Math.PI / 2);
  });

  it('should handle 45-degree heading', () => {
    const g: OdrGeometry = {
      s: 0, x: 0, y: 0, hdg: Math.PI / 4, length: 100, type: 'line',
    };
    const p = evaluateLine(Math.SQRT2, g);
    expect(p.x).toBeCloseTo(1, 4);
    expect(p.y).toBeCloseTo(1, 4);
  });
});
