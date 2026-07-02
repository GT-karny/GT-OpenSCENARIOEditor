import { describe, it, expect } from 'vitest';
import type {
  DeterministicDistribution,
  StochasticDistribution,
} from '@osce/shared';
import {
  generateParameterVariants,
  mulberry32,
} from '../operations/distribution-variants.js';

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

describe('generateParameterVariants — deterministic', () => {
  it('expands a DistributionSet into one variant per value', () => {
    const dist: DeterministicDistribution = {
      kind: 'deterministic',
      entries: [
        {
          kind: 'singleParameter',
          parameterName: 'Speed',
          distribution: { kind: 'set', values: ['10', '20', '30'] },
        },
      ],
    };
    const result = generateParameterVariants(dist);
    expect(result.totalCount).toBe(3);
    expect(result.truncated).toBe(false);
    expect(result.variants).toEqual([{ Speed: '10' }, { Speed: '20' }, { Speed: '30' }]);
  });

  it('steps a DistributionRange inclusively, hitting the exact upper endpoint', () => {
    const dist: DeterministicDistribution = {
      kind: 'deterministic',
      entries: [
        {
          kind: 'singleParameter',
          parameterName: 'V',
          distribution: {
            kind: 'range',
            stepWidth: 1,
            range: { lowerLimit: 15, upperLimit: 25 },
          },
        },
      ],
    };
    const result = generateParameterVariants(dist);
    // 15..25 inclusive step 1 → 11 values.
    expect(result.totalCount).toBe(11);
    expect(result.variants[0]).toEqual({ V: '15' });
    expect(result.variants[10]).toEqual({ V: '25' });
  });

  it('includes the endpoint for a fractional step within tolerance', () => {
    const dist: DeterministicDistribution = {
      kind: 'deterministic',
      entries: [
        {
          kind: 'singleParameter',
          parameterName: 'X',
          distribution: {
            kind: 'range',
            stepWidth: 0.1,
            range: { lowerLimit: 0, upperLimit: 0.3 },
          },
        },
      ],
    };
    const result = generateParameterVariants(dist);
    // 0, 0.1, 0.2, 0.3 → 4 values (no float drift dropping the endpoint).
    expect(result.variants.map((v) => v.X)).toEqual(['0', '0.1', '0.2', '0.3']);
  });

  it('computes the cartesian product across multiple single parameters', () => {
    const dist: DeterministicDistribution = {
      kind: 'deterministic',
      entries: [
        {
          kind: 'singleParameter',
          parameterName: 'A',
          distribution: { kind: 'set', values: ['1', '2'] },
        },
        {
          kind: 'singleParameter',
          parameterName: 'B',
          distribution: { kind: 'set', values: ['x', 'y', 'z'] },
        },
      ],
    };
    const result = generateParameterVariants(dist);
    expect(result.totalCount).toBe(6);
    expect(result.variants).toHaveLength(6);
    // Every combination present exactly once.
    const keys = result.variants.map((v) => `${v.A}${v.B}`).sort();
    expect(keys).toEqual(['1x', '1y', '1z', '2x', '2y', '2z']);
  });

  it('treats each multi-parameter value set as one indivisible row', () => {
    const dist: DeterministicDistribution = {
      kind: 'deterministic',
      entries: [
        {
          kind: 'multiParameter',
          valueSets: [
            {
              assignments: [
                { parameterRef: 'T', value: 'morning' },
                { parameterRef: 'Az', value: '3.14' },
              ],
            },
            {
              assignments: [
                { parameterRef: 'T', value: 'evening' },
                { parameterRef: 'Az', value: '4.5' },
              ],
            },
          ],
        },
      ],
    };
    const result = generateParameterVariants(dist);
    expect(result.totalCount).toBe(2);
    expect(result.variants).toEqual([
      { T: 'morning', Az: '3.14' },
      { T: 'evening', Az: '4.5' },
    ]);
  });

  it('multiplies multi-parameter rows with single-parameter sets', () => {
    const dist: DeterministicDistribution = {
      kind: 'deterministic',
      entries: [
        {
          kind: 'multiParameter',
          valueSets: [
            { assignments: [{ parameterRef: 'T', value: 'a' }] },
            { assignments: [{ parameterRef: 'T', value: 'b' }] },
          ],
        },
        {
          kind: 'singleParameter',
          parameterName: 'S',
          distribution: { kind: 'set', values: ['1', '2', '3'] },
        },
      ],
    };
    const result = generateParameterVariants(dist);
    expect(result.totalCount).toBe(6);
  });

  it('skips UserDefinedDistribution and records a warning', () => {
    const dist: DeterministicDistribution = {
      kind: 'deterministic',
      entries: [
        {
          kind: 'singleParameter',
          parameterName: 'S',
          distribution: { kind: 'set', values: ['1', '2'] },
        },
        {
          kind: 'singleParameter',
          parameterName: 'U',
          distribution: { kind: 'userDefined', type: 'custom', content: '' },
        },
      ],
    };
    const result = generateParameterVariants(dist);
    expect(result.totalCount).toBe(2);
    expect(result.variants.every((v) => !('U' in v))).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('UserDefinedDistribution');
  });

  it('sets the truncated flag when the product exceeds maxVariants', () => {
    const dist: DeterministicDistribution = {
      kind: 'deterministic',
      entries: [
        {
          kind: 'singleParameter',
          parameterName: 'A',
          distribution: { kind: 'set', values: ['1', '2', '3', '4', '5'] },
        },
        {
          kind: 'singleParameter',
          parameterName: 'B',
          distribution: { kind: 'set', values: ['1', '2', '3', '4', '5'] },
        },
      ],
    };
    const result = generateParameterVariants(dist, { maxVariants: 10 });
    expect(result.totalCount).toBe(25);
    expect(result.truncated).toBe(true);
    expect(result.variants).toHaveLength(10);
  });
});

// ---------------------------------------------------------------------------
// Stochastic
// ---------------------------------------------------------------------------

function uniformDist(runs: number, seed?: number): StochasticDistribution {
  return {
    kind: 'stochastic',
    numberOfTestRuns: runs,
    randomSeed: seed,
    distributions: [
      {
        parameterName: 'U',
        distribution: { kind: 'uniform', range: { lowerLimit: 0, upperLimit: 10 } },
      },
    ],
  };
}

describe('generateParameterVariants — stochastic', () => {
  it('produces exactly numberOfTestRuns variants', () => {
    const result = generateParameterVariants(uniformDist(50, 1));
    expect(result.totalCount).toBe(50);
    expect(result.variants).toHaveLength(50);
    expect(result.truncated).toBe(false);
  });

  it('is reproducible: same seed → identical variants', () => {
    const a = generateParameterVariants(uniformDist(20, 42));
    const b = generateParameterVariants(uniformDist(20, 42));
    expect(a.variants).toEqual(b.variants);
  });

  it('different seeds produce different variants', () => {
    const a = generateParameterVariants(uniformDist(20, 1));
    const b = generateParameterVariants(uniformDist(20, 2));
    expect(a.variants).not.toEqual(b.variants);
  });

  it('samples uniform values within the range', () => {
    const result = generateParameterVariants(uniformDist(200, 7));
    for (const variant of result.variants) {
      const v = Number(variant.U);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it('clamps normal samples to their optional range', () => {
    const dist: StochasticDistribution = {
      kind: 'stochastic',
      numberOfTestRuns: 300,
      randomSeed: 3,
      distributions: [
        {
          parameterName: 'N',
          distribution: {
            kind: 'normal',
            expectedValue: 0,
            variance: 100,
            range: { lowerLimit: -1, upperLimit: 1 },
          },
        },
      ],
    };
    const result = generateParameterVariants(dist);
    for (const variant of result.variants) {
      const v = Number(variant.N);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('respects histogram bin ranges', () => {
    const dist: StochasticDistribution = {
      kind: 'stochastic',
      numberOfTestRuns: 300,
      randomSeed: 11,
      distributions: [
        {
          parameterName: 'H',
          distribution: {
            kind: 'histogram',
            bins: [
              { weight: 1, range: { lowerLimit: 0, upperLimit: 1 } },
              { weight: 1, range: { lowerLimit: 5, upperLimit: 6 } },
            ],
          },
        },
      ],
    };
    const result = generateParameterVariants(dist);
    for (const variant of result.variants) {
      const v = Number(variant.H);
      const inBin1 = v >= 0 && v <= 1;
      const inBin2 = v >= 5 && v <= 6;
      expect(inBin1 || inBin2).toBe(true);
    }
    // Both bins should be represented with roughly equal weight.
    const inBin2Count = result.variants.filter((x) => Number(x.H) >= 5).length;
    expect(inBin2Count).toBeGreaterThan(50);
  });

  it('chooses only declared values for a probability set', () => {
    const dist: StochasticDistribution = {
      kind: 'stochastic',
      numberOfTestRuns: 200,
      randomSeed: 5,
      distributions: [
        {
          parameterName: 'P',
          distribution: {
            kind: 'probabilitySet',
            elements: [
              { value: 'a', weight: 1 },
              { value: 'b', weight: 9 },
            ],
          },
        },
      ],
    };
    const result = generateParameterVariants(dist);
    const values = new Set(result.variants.map((v) => v.P));
    expect([...values].every((v) => v === 'a' || v === 'b')).toBe(true);
    // 'b' has 9x the weight, so it should dominate.
    const bCount = result.variants.filter((v) => v.P === 'b').length;
    expect(bCount).toBeGreaterThan(result.variants.length / 2);
  });

  it('produces non-negative integer-valued Poisson samples', () => {
    const dist: StochasticDistribution = {
      kind: 'stochastic',
      numberOfTestRuns: 100,
      randomSeed: 9,
      distributions: [
        { parameterName: 'K', distribution: { kind: 'poisson', expectedValue: 3 } },
      ],
    };
    const result = generateParameterVariants(dist);
    for (const variant of result.variants) {
      const v = Number(variant.K);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it('skips a stochastic UserDefinedDistribution with a warning', () => {
    const dist: StochasticDistribution = {
      kind: 'stochastic',
      numberOfTestRuns: 3,
      randomSeed: 1,
      distributions: [
        {
          parameterName: 'U',
          distribution: { kind: 'userDefined', type: 'ext', content: '' },
        },
      ],
    };
    const result = generateParameterVariants(dist);
    expect(result.variants).toHaveLength(3);
    expect(result.variants.every((v) => !('U' in v))).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('truncates stochastic runs to maxVariants', () => {
    const result = generateParameterVariants(uniformDist(500, 1), { maxVariants: 100 });
    expect(result.totalCount).toBe(500);
    expect(result.truncated).toBe(true);
    expect(result.variants).toHaveLength(100);
  });
});

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('returns values in [0, 1)', () => {
    const rng = mulberry32(999);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
