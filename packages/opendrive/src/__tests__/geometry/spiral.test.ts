import { describe, it, expect } from 'vitest';
import { evaluateSpiral } from '../../geometry/spiral.js';
import type { OdrGeometry } from '@osce/shared';

describe('evaluateSpiral', () => {
  it('should return start position at ds=0', () => {
    const geom: OdrGeometry = {
      s: 0, x: 0, y: 0, hdg: 0, length: 100,
      type: 'spiral', curvStart: 0, curvEnd: 0.02,
    };
    const p = evaluateSpiral(0, geom);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
    expect(p.hdg).toBeCloseTo(0);
  });

  it('should compute heading correctly', () => {
    const geom: OdrGeometry = {
      s: 0, x: 0, y: 0, hdg: 0, length: 100,
      type: 'spiral', curvStart: 0, curvEnd: 0.02,
    };
    // hdg = hdg0 + k0*ds + 0.5*dk*ds^2
    // at ds=100: hdg = 0 + 0*100 + 0.5*(0.02/100)*100^2 = 1.0 rad
    const p = evaluateSpiral(100, geom);
    expect(p.hdg).toBeCloseTo(1.0, 2);
  });

  it('should degenerate to line for zero curvatures', () => {
    const geom: OdrGeometry = {
      s: 0, x: 0, y: 0, hdg: 0, length: 100,
      type: 'spiral', curvStart: 0, curvEnd: 0,
    };
    const p = evaluateSpiral(50, geom);
    expect(p.x).toBeCloseTo(50, 1);
    expect(p.y).toBeCloseTo(0, 1);
    expect(p.hdg).toBeCloseTo(0);
  });

  it('should degenerate to arc for equal curvatures', () => {
    const k = 0.01;
    const geom: OdrGeometry = {
      s: 0, x: 0, y: 0, hdg: 0, length: 100,
      type: 'spiral', curvStart: k, curvEnd: k,
    };
    const p = evaluateSpiral(50, geom);
    // Should match arc evaluation
    const R = 1 / k;
    const expectedX = R * Math.sin(k * 50);
    const expectedY = R * (1 - Math.cos(k * 50));
    expect(p.x).toBeCloseTo(expectedX, 1);
    expect(p.y).toBeCloseTo(expectedY, 1);
    expect(p.hdg).toBeCloseTo(k * 50, 2);
  });

  it('should curve in the correct direction', () => {
    const geom: OdrGeometry = {
      s: 0, x: 0, y: 0, hdg: 0, length: 50,
      type: 'spiral', curvStart: 0, curvEnd: 0.04,
    };
    const p = evaluateSpiral(50, geom);
    // Positive curvature should curve left (positive y)
    expect(p.y).toBeGreaterThan(0);
  });
});
