import { describe, it, expect } from 'vitest';
import { evaluateArc } from '../../geometry/arc.js';
import type { OdrGeometry } from '@osce/shared';

describe('evaluateArc', () => {
  it('should return start position at ds=0', () => {
    const geom: OdrGeometry = {
      s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'arc', curvature: 0.01,
    };
    const p = evaluateArc(0, geom);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
    expect(p.hdg).toBeCloseTo(0);
  });

  it('should trace quarter circle correctly', () => {
    const k = 0.01;
    const R = 1 / k; // R = 100
    const geom: OdrGeometry = {
      s: 0, x: 0, y: 0, hdg: 0, length: 200, type: 'arc', curvature: k,
    };
    // Quarter circle: ds = pi/(2*k) = pi*R/2 ≈ 157.08
    const ds = Math.PI / (2 * k);
    const p = evaluateArc(ds, geom);
    // End of quarter turn for positive curvature (left turn):
    // x = R*sin(pi/2) = R, y = R*(1-cos(pi/2)) = R
    expect(p.x).toBeCloseTo(R, 2);
    expect(p.y).toBeCloseTo(R, 2);
    expect(p.hdg).toBeCloseTo(Math.PI / 2, 4);
  });

  it('should handle negative curvature (right turn)', () => {
    const k = -0.01;
    const geom: OdrGeometry = {
      s: 0, x: 0, y: 0, hdg: 0, length: 200, type: 'arc', curvature: k,
    };
    const ds = Math.PI / (2 * Math.abs(k));
    const p = evaluateArc(ds, geom);
    expect(p.x).toBeCloseTo(100, 2);
    expect(p.y).toBeCloseTo(-100, 2);
    expect(p.hdg).toBeCloseTo(-Math.PI / 2, 4);
  });

  it('should degenerate to line for zero curvature', () => {
    const geom: OdrGeometry = {
      s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'arc', curvature: 0,
    };
    const p = evaluateArc(50, geom);
    expect(p.x).toBeCloseTo(50);
    expect(p.y).toBeCloseTo(0);
    expect(p.hdg).toBeCloseTo(0);
  });
});
