import { describe, it, expect } from 'vitest';
import { evaluateReferenceLineAtS } from '../../geometry/reference-line.js';
import type { OdrGeometry } from '@osce/shared';

describe('evaluateReferenceLineAtS', () => {
  it('should return origin for empty planView', () => {
    const p = evaluateReferenceLineAtS([], 0);
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
    expect(p.hdg).toBe(0);
  });

  it('should evaluate single line geometry', () => {
    const planView: OdrGeometry[] = [
      { s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' },
    ];
    const p = evaluateReferenceLineAtS(planView, 50);
    expect(p.x).toBeCloseTo(50);
    expect(p.y).toBeCloseTo(0);
  });

  it('should dispatch to correct geometry segment', () => {
    const planView: OdrGeometry[] = [
      { s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' },
      { s: 100, x: 100, y: 0, hdg: 0, length: 50, type: 'arc', curvature: 0.02 },
    ];

    // In first segment
    const p1 = evaluateReferenceLineAtS(planView, 50);
    expect(p1.x).toBeCloseTo(50);
    expect(p1.y).toBeCloseTo(0);

    // In second segment (arc)
    const p2 = evaluateReferenceLineAtS(planView, 100);
    expect(p2.x).toBeCloseTo(100);
    expect(p2.y).toBeCloseTo(0);

    // Further into arc
    const p3 = evaluateReferenceLineAtS(planView, 125);
    expect(p3.hdg).not.toBe(0); // Arc changes heading
  });

  it('should handle multi-segment road with line-spiral-arc', () => {
    const planView: OdrGeometry[] = [
      { s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' },
      { s: 100, x: 100, y: 0, hdg: 0, length: 30, type: 'spiral', curvStart: 0, curvEnd: 0.0133 },
      { s: 130, x: 129.87, y: 2.65, hdg: 0.1995, length: 30, type: 'arc', curvature: 0.0133 },
    ];

    // Start of line
    const p0 = evaluateReferenceLineAtS(planView, 0);
    expect(p0.x).toBeCloseTo(0);
    expect(p0.y).toBeCloseTo(0);

    // End of line / start of spiral
    const p1 = evaluateReferenceLineAtS(planView, 100);
    expect(p1.x).toBeCloseTo(100);
    expect(p1.y).toBeCloseTo(0);

    // Within arc
    const p2 = evaluateReferenceLineAtS(planView, 140);
    expect(p2.x).toBeGreaterThan(100);
    expect(p2.y).toBeGreaterThan(0);
  });

  it('should clamp s to last geometry', () => {
    const planView: OdrGeometry[] = [
      { s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' },
    ];
    // s beyond road length - should clamp to geometry length
    const p = evaluateReferenceLineAtS(planView, 150);
    expect(p.x).toBeCloseTo(100); // clamped to length
  });
});
