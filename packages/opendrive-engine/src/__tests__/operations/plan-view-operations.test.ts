import { describe, it, expect } from 'vitest';
import type { OdrGeometry } from '@osce/shared';
import {
  recalculatePlanViewS,
  computePlanViewLength,
  patchPlanViewGeometry,
} from '../../operations/plan-view-operations.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePlanView(): OdrGeometry[] {
  return [
    { s: 999, x: 0, y: 0, hdg: 0, length: 10, type: 'line' },
    { s: 999, x: 10, y: 0, hdg: 0, length: 20, type: 'arc', curvature: 0.05 },
    { s: 999, x: 30, y: 0, hdg: 0, length: 5, type: 'line' },
  ];
}

// ---------------------------------------------------------------------------
// recalculatePlanViewS
// ---------------------------------------------------------------------------

describe('recalculatePlanViewS', () => {
  it('assigns cumulative s starting at 0', () => {
    const result = recalculatePlanViewS(makePlanView());
    expect(result.map((g) => g.s)).toEqual([0, 10, 30]);
  });

  it('preserves discriminant and variant-specific fields', () => {
    const result = recalculatePlanViewS(makePlanView());
    const arc = result[1];
    expect(arc.type).toBe('arc');
    if (arc.type === 'arc') {
      expect(arc.curvature).toBe(0.05);
    }
  });

  it('returns fresh objects and does not mutate the input', () => {
    const input = makePlanView();
    const result = recalculatePlanViewS(input);
    expect(result).not.toBe(input);
    expect(result[0]).not.toBe(input[0]);
    // Original entries keep their stale s values
    expect(input.map((g) => g.s)).toEqual([999, 999, 999]);
  });

  it('handles an empty plan-view', () => {
    expect(recalculatePlanViewS([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// computePlanViewLength
// ---------------------------------------------------------------------------

describe('computePlanViewLength', () => {
  it('sums all segment lengths', () => {
    expect(computePlanViewLength(makePlanView())).toBe(35);
  });

  it('returns 0 for an empty plan-view', () => {
    expect(computePlanViewLength([])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// patchPlanViewGeometry
// ---------------------------------------------------------------------------

describe('patchPlanViewGeometry', () => {
  it('patches positional fields on a single entry', () => {
    const input = makePlanView();
    const result = patchPlanViewGeometry(input, 0, { x: 100, y: 200 });
    expect(result[0].x).toBe(100);
    expect(result[0].y).toBe(200);
    // Other entries untouched by value
    expect(result[1].x).toBe(10);
  });

  it('patches variant-specific fields (arc curvature)', () => {
    const result = patchPlanViewGeometry(makePlanView(), 1, { curvature: 0.2 });
    const arc = result[1];
    expect(arc.type).toBe('arc');
    if (arc.type === 'arc') {
      expect(arc.curvature).toBe(0.2);
    }
  });

  it('preserves the existing discriminant when not overridden', () => {
    const result = patchPlanViewGeometry(makePlanView(), 0, { hdg: 1 });
    expect(result[0].type).toBe('line');
  });

  it('returns a cloned array without mutating the input', () => {
    const input = makePlanView();
    const result = patchPlanViewGeometry(input, 0, { x: 5 });
    expect(result).not.toBe(input);
    expect(input[0].x).toBe(0);
  });

  it('ignores out-of-range indices and returns a clone', () => {
    const input = makePlanView();
    const result = patchPlanViewGeometry(input, 99, { x: 5 });
    expect(result).not.toBe(input);
    expect(result).toEqual(input);
  });
});
