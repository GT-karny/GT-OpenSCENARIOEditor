import { describe, it, expect } from 'vitest';
import { computeAutoArc, computeGeometryEndpoint } from '../../geometry/arc-math.js';

describe('computeAutoArc', () => {
  it('returns a line when heading is unconstrained', () => {
    const result = computeAutoArc(0, 0, 0, 10, 0, false);
    expect(result.type).toBe('line');
    expect(result.curvature).toBe(0);
    expect(result.arcLength).toBeCloseTo(10);
    expect(result.hdg).toBeCloseTo(0);
  });

  it('infers the heading from start to end for an unconstrained line', () => {
    const result = computeAutoArc(0, 0, 0, 10, 10, false);
    expect(result.type).toBe('line');
    expect(result.hdg).toBeCloseTo(Math.PI / 4);
    expect(result.arcLength).toBeCloseTo(Math.hypot(10, 10));
  });

  it('returns a line when chord length is below the 0.5 threshold, even if constrained', () => {
    const result = computeAutoArc(0, 0, 0, 0.3, 0, true);
    expect(result.type).toBe('line');
    expect(result.curvature).toBe(0);
    expect(result.arcLength).toBeCloseTo(0.3);
  });

  it('returns a line when the constrained heading nearly matches the direct line (delta < 0.01)', () => {
    // Endpoint almost directly ahead of start heading 0 => delta ~ 0
    const result = computeAutoArc(0, 0, 0, 10, 0.001, true);
    expect(result.type).toBe('line');
    expect(result.curvature).toBe(0);
    expect(result.hdg).toBeCloseTo(0);
  });

  it('curves left (positive curvature) when the endpoint is to the left of the constrained heading', () => {
    // Start heading along +x, endpoint above the x-axis (positive y) => left turn.
    const result = computeAutoArc(0, 0, 0, 10, 5, true);
    expect(result.type).toBe('arc');
    expect(result.curvature).toBeGreaterThan(0);
    expect(result.hdg).toBeCloseTo(0);
    expect(result.arcLength).toBeGreaterThan(0);
  });

  it('curves right (negative curvature) when the endpoint is to the right of the constrained heading', () => {
    // Start heading along +x, endpoint below the x-axis (negative y) => right turn.
    const result = computeAutoArc(0, 0, 0, 10, -5, true);
    expect(result.type).toBe('arc');
    expect(result.curvature).toBeLessThan(0);
    expect(result.hdg).toBeCloseTo(0);
    expect(result.arcLength).toBeGreaterThan(0);
  });

  it('produces an arc whose computed endpoint matches the requested target point', () => {
    const startX = 0;
    const startY = 0;
    const startHdg = 0.2;
    const endX = 20;
    const endY = 8;
    const result = computeAutoArc(startX, startY, startHdg, endX, endY, true);
    expect(result.type).toBe('arc');

    const endpoint = computeGeometryEndpoint(
      startX,
      startY,
      startHdg,
      result.arcLength,
      result.curvature,
    );
    expect(endpoint.x).toBeCloseTo(endX, 6);
    expect(endpoint.y).toBeCloseTo(endY, 6);
  });

  it('handles a heading-constrained half-circle-ish sharp turn without throwing', () => {
    // Endpoint roughly behind-and-to-the-side of the start heading.
    const result = computeAutoArc(0, 0, 0, 0.1, 10, true);
    expect(result.type).toBe('arc');
    expect(Number.isFinite(result.curvature)).toBe(true);
    expect(Number.isFinite(result.arcLength)).toBe(true);
  });
});

describe('computeGeometryEndpoint', () => {
  it('computes a straight-line endpoint for zero curvature', () => {
    const result = computeGeometryEndpoint(0, 0, 0, 10, 0);
    expect(result.x).toBeCloseTo(10);
    expect(result.y).toBeCloseTo(0);
    expect(result.hdg).toBeCloseTo(0);
  });

  it('computes a straight-line endpoint at an arbitrary heading', () => {
    const hdg = Math.PI / 4;
    const result = computeGeometryEndpoint(1, 2, hdg, 10, 0);
    expect(result.x).toBeCloseTo(1 + 10 * Math.cos(hdg));
    expect(result.y).toBeCloseTo(2 + 10 * Math.sin(hdg));
    expect(result.hdg).toBeCloseTo(hdg);
  });

  it('treats curvature below the 1e-6 threshold as a line (degenerate case)', () => {
    const result = computeGeometryEndpoint(0, 0, 0, 10, 1e-7);
    expect(result.x).toBeCloseTo(10);
    expect(result.y).toBeCloseTo(0);
    expect(result.hdg).toBeCloseTo(0);
  });

  it('treats curvature just above the 1e-6 threshold as an arc', () => {
    const k = 2e-6;
    const length = 10;
    const result = computeGeometryEndpoint(0, 0, 0, length, k);
    const r = 1 / k;
    const endHdg = k * length;
    expect(result.x).toBeCloseTo(r * Math.sin(endHdg), 4);
    expect(result.y).toBeCloseTo(r * (1 - Math.cos(endHdg)), 4);
    expect(result.hdg).toBeCloseTo(endHdg);
  });

  it('traces a quarter circle for positive curvature (left turn)', () => {
    const k = 0.01;
    const r = 1 / k;
    const length = Math.PI / (2 * k);
    const result = computeGeometryEndpoint(0, 0, 0, length, k);
    expect(result.x).toBeCloseTo(r, 2);
    expect(result.y).toBeCloseTo(r, 2);
    expect(result.hdg).toBeCloseTo(Math.PI / 2, 4);
  });

  it('traces a quarter circle for negative curvature (right turn)', () => {
    const k = -0.01;
    const R = 1 / Math.abs(k); // R = 100
    const length = Math.PI / (2 * Math.abs(k));
    const result = computeGeometryEndpoint(0, 0, 0, length, k);
    expect(result.x).toBeCloseTo(R, 2);
    expect(result.y).toBeCloseTo(-R, 2);
    expect(result.hdg).toBeCloseTo(-Math.PI / 2, 4);
  });

  it('preserves position for zero length', () => {
    const result = computeGeometryEndpoint(5, 7, 1.2, 0, 0.01);
    expect(result.x).toBeCloseTo(5);
    expect(result.y).toBeCloseTo(7);
    expect(result.hdg).toBeCloseTo(1.2);
  });
});
