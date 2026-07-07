import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { OdrRoad } from '@osce/shared';
import { XodrParser } from '../../parser/xodr-parser.js';
import {
  buildCrossSectionEvaluator,
  crossSectionCriticalS,
} from '../../geometry/cross-section-profile.js';

const FIXTURE = resolve(
  __dirname,
  '../../../../../test-fixtures/opendrive-v1.9/Ex_CrossSectionSurface_CrossFall_LeftTurn_1.xodr',
);

/** Parse the CrossFall_LeftTurn fixture and return its single road. */
function crossFallRoad(): OdrRoad {
  const doc = new XodrParser().parse(readFileSync(FIXTURE, 'utf-8'));
  return doc.roads[0];
}

describe('buildCrossSectionEvaluator — CrossFall_LeftTurn fixture', () => {
  it('returns null for a road without a cross-section surface', () => {
    const road: OdrRoad = { ...crossFallRoad(), crossSectionSurface: undefined };
    expect(buildCrossSectionEvaluator(road)).toBeNull();
  });

  it('(a) applies tOffset as the surface base height at the reference line', () => {
    const evaluate = buildCrossSectionEvaluator(crossFallRoad());
    expect(evaluate).not.toBeNull();
    // tOffset = -0.375; every strip contributes 0 at its inner edge (t=0),
    // so the surface height at the reference line is the tOffset base.
    expect(evaluate!(0, 0)).toBeCloseTo(-0.375, 3);
  });

  it('(b) linear strips tilt the surface with opposite slopes left vs right', () => {
    const evaluate = buildCrossSectionEvaluator(crossFallRoad())!;
    const center = evaluate(0, 0);
    // Left outer strip carries linear -0.02; right inner strip carries +0.02.
    const left = evaluate(0, 5) - center;
    const right = evaluate(0, -5) - center;
    expect(left).toBeLessThan(0);
    expect(right).toBeGreaterThan(0);
    expect(Math.sign(left)).toBe(-Math.sign(right));
  });

  it('(c) extends flat beyond the outermost strip', () => {
    const evaluate = buildCrossSectionEvaluator(crossFallRoad())!;
    // Far past any real road extent the height stops changing (clamped, finite).
    const far = evaluate(0, 1e6);
    const farther = evaluate(0, 2e6);
    expect(Number.isFinite(far)).toBe(true);
    expect(farther).toBeCloseTo(far, 9);
  });

  it('evaluates the inner-strip width transition in s (piecewise cubic)', () => {
    // strip 1 <width> grows 1.5 → 4.5 between s=30 and s=40, moving the left
    // outer strip's inner edge outward. The same small t therefore lands in the
    // sloped outer strip early but the flat inner strip late.
    const evaluate = buildCrossSectionEvaluator(crossFallRoad())!;
    const early = evaluate(0, 3) - evaluate(0, 0);
    const late = evaluate(45, 3) - evaluate(45, 0);
    expect(early).toBeCloseTo(-0.03, 6); // outer strip: -0.02 * (3 - 1.5)
    expect(late).toBeCloseTo(0, 6); // inner strip (flat) now spans past t=3
  });

  it('is robust to a strip with neither width nor polynomials (warns, skips)', () => {
    const road = crossFallRoad();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Append an empty strip; the evaluator must ignore it, not throw.
    road.crossSectionSurface!.strips.push({ id: 2 });
    const evaluate = buildCrossSectionEvaluator(road)!;
    expect(Number.isFinite(evaluate(0, 5))).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('crossSectionCriticalS', () => {
  it('collects every coefficient s-boundary from the fixture', () => {
    const s = crossSectionCriticalS(crossFallRoad());
    // tOffset @0, width rows @0/@30/@40, linear rows @0.
    expect(s).toContain(0);
    expect(s).toContain(30);
    expect(s).toContain(40);
    // Sorted ascending, de-duplicated.
    expect(s).toEqual([...s].sort((a, b) => a - b));
    expect(new Set(s).size).toBe(s.length);
  });

  it('returns empty for a road without a cross-section surface', () => {
    const road: OdrRoad = { ...crossFallRoad(), crossSectionSurface: undefined };
    expect(crossSectionCriticalS(road)).toEqual([]);
  });
});
