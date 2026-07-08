import type {
  DeterministicEntry,
  DeterministicSingleDistributionType,
  StochasticDistributionType,
} from '@osce/shared';
import type { DistributionMode } from '../../../../stores/distribution-store';

/** Deterministic single-parameter distribution type discriminators. */
export const DETERMINISTIC_TYPES = ['set', 'range', 'userDefined'] as const;
export type DeterministicTypeKind = (typeof DETERMINISTIC_TYPES)[number];

/** Stochastic distribution type discriminators. */
export const STOCHASTIC_TYPES = [
  'probabilitySet',
  'normal',
  'logNormal',
  'uniform',
  'poisson',
  'histogram',
  'userDefined',
] as const;
export type StochasticTypeKind = (typeof STOCHASTIC_TYPES)[number];

/** Human labels for the distribution-type EnumSelect. */
export const DISTRIBUTION_TYPE_LABELS: Record<DeterministicTypeKind | StochasticTypeKind, string> =
  {
    set: 'Set',
    range: 'Range',
    userDefined: 'User Defined',
    probabilitySet: 'Probability Set',
    normal: 'Normal',
    logNormal: 'Log Normal',
    uniform: 'Uniform',
    poisson: 'Poisson',
    histogram: 'Histogram',
  };

/** Distribution-type discriminators available for the given mode. */
export function typeOptionsForMode(mode: DistributionMode): readonly string[] {
  return mode === 'deterministic' ? DETERMINISTIC_TYPES : STOCHASTIC_TYPES;
}

/** A fresh default distribution of the given discriminator, for the attach dialog. */
export function defaultDeterministic(
  kind: DeterministicTypeKind,
): DeterministicSingleDistributionType {
  switch (kind) {
    case 'set':
      return { kind: 'set', values: [''] };
    case 'range':
      return { kind: 'range', stepWidth: 1, range: { lowerLimit: 0, upperLimit: 10 } };
    case 'userDefined':
      return { kind: 'userDefined', type: '', content: '' };
  }
}

export function defaultStochastic(kind: StochasticTypeKind): StochasticDistributionType {
  switch (kind) {
    case 'probabilitySet':
      return { kind: 'probabilitySet', elements: [{ value: '', weight: 1 }] };
    case 'normal':
      return { kind: 'normal', expectedValue: 0, variance: 1 };
    case 'logNormal':
      return { kind: 'logNormal', expectedValue: 0, variance: 1 };
    case 'uniform':
      return { kind: 'uniform', range: { lowerLimit: 0, upperLimit: 1 } };
    case 'poisson':
      return { kind: 'poisson', expectedValue: 1 };
    case 'histogram':
      return { kind: 'histogram', bins: [{ weight: 1, range: { lowerLimit: 0, upperLimit: 1 } }] };
    case 'userDefined':
      return { kind: 'userDefined', type: '', content: '' };
  }
}

/** A compact one-line, human-readable summary of a distribution. */
export function summarizeDistribution(
  distribution: DeterministicSingleDistributionType | StochasticDistributionType,
): string {
  switch (distribution.kind) {
    case 'set':
      return `Set {${distribution.values.join(', ')}}`;
    case 'range':
      return `Range ${distribution.range.lowerLimit}..${distribution.range.upperLimit} step ${distribution.stepWidth}`;
    case 'userDefined':
      return `User Defined (${distribution.type || 'untyped'})`;
    case 'probabilitySet':
      return `Probability Set (${distribution.elements.length} values)`;
    case 'normal':
      return `Normal(μ=${distribution.expectedValue}, σ²=${distribution.variance})`;
    case 'logNormal':
      return `LogNormal(μ=${distribution.expectedValue}, σ²=${distribution.variance})`;
    case 'uniform':
      return `Uniform ${distribution.range.lowerLimit}..${distribution.range.upperLimit}`;
    case 'poisson':
      return `Poisson(λ=${distribution.expectedValue})`;
    case 'histogram':
      return `Histogram (${distribution.bins.length} bins)`;
  }
}

/** A summary of a read-only multi-parameter ValueSet entry. */
export function summarizeMultiParameter(
  entry: Extract<DeterministicEntry, { kind: 'multiParameter' }>,
): string {
  const params = new Set<string>();
  for (const set of entry.valueSets) {
    for (const a of set.assignments) params.add(a.parameterRef);
  }
  return `Value sets: ${entry.valueSets.length} rows over {${Array.from(params).join(', ')}}`;
}
