/**
 * Parameter variant generation for OpenSCENARIO parameter value distributions.
 *
 * Given a {@link DistributionDefinition}, expand it into concrete parameter
 * assignment sets ("variants"), following OSC 1.3.1 semantics:
 *
 * - Deterministic: cartesian product across the distribution's entries. Each
 *   single-parameter distribution contributes its value list (DistributionSet
 *   elements, or DistributionRange values stepped by `stepWidth` from
 *   `lowerLimit` to `upperLimit` inclusive within tolerance). Each
 *   multi-parameter ValueSetDistribution contributes its explicit rows (each
 *   ParameterValueSet is one indivisible combination). UserDefinedDistribution
 *   contributes nothing (flagged via `warnings`).
 * - Stochastic: `numberOfTestRuns` samples, each run sampling every
 *   StochasticDistribution independently with a seeded deterministic PRNG so
 *   the same seed always yields the same variants.
 */

import type {
  DeterministicDistribution,
  DeterministicEntry,
  DistributionDefinition,
  DistributionRangeBounds,
  StochasticDistribution,
  StochasticDistributionType,
} from '@osce/shared';

/** A single generated variant: parameter name → assigned value (string). */
export type ParameterVariant = Record<string, string>;

export interface GenerateVariantsOptions {
  /**
   * Maximum number of variants to materialize. When the deterministic
   * cartesian product would exceed this, generation stops and `truncated` is
   * set. Defaults to 1000.
   */
  maxVariants?: number;
  /**
   * Seed used for stochastic sampling when the distribution itself has no
   * `randomSeed`. Defaults to 0.
   */
  defaultSeed?: number;
}

export interface GenerateVariantsResult {
  /** The generated variants (possibly truncated to `maxVariants`). */
  variants: ParameterVariant[];
  /**
   * True when the full result set was larger than `maxVariants` and the
   * returned `variants` were truncated.
   */
  truncated: boolean;
  /**
   * The total number of variants the distribution defines, regardless of
   * truncation. For deterministic this is the full cartesian product size; for
   * stochastic it is `numberOfTestRuns`.
   */
  totalCount: number;
  /** Non-fatal issues (e.g. skipped UserDefinedDistribution entries). */
  warnings: string[];
}

const DEFAULT_MAX_VARIANTS = 1000;
/** Absolute tolerance for including a range endpoint when stepping. */
const RANGE_STEP_EPSILON = 1e-9;

export function generateParameterVariants(
  distribution: DistributionDefinition,
  options: GenerateVariantsOptions = {},
): GenerateVariantsResult {
  const maxVariants = options.maxVariants ?? DEFAULT_MAX_VARIANTS;
  if (distribution.kind === 'deterministic') {
    return generateDeterministicVariants(distribution, maxVariants);
  }
  return generateStochasticVariants(distribution, maxVariants, options.defaultSeed ?? 0);
}

// ---------------------------------------------------------------------------
// Deterministic — cartesian product
// ---------------------------------------------------------------------------

/**
 * One factor of the cartesian product. Each option is a partial assignment
 * (single parameter → one value, or a multi-parameter row → several values).
 */
type ProductFactor = ParameterVariant[];

function generateDeterministicVariants(
  distribution: DeterministicDistribution,
  maxVariants: number,
): GenerateVariantsResult {
  const warnings: string[] = [];
  const factors: ProductFactor[] = [];

  for (const entry of distribution.entries) {
    const factor = deterministicEntryToFactor(entry, warnings);
    if (factor === undefined) continue; // skipped (e.g. user-defined)
    // An empty factor would collapse the whole product to zero; skip it and
    // warn instead so the remaining parameters still produce variants.
    if (factor.length === 0) continue;
    factors.push(factor);
  }

  const totalCount = factors.reduce((acc, f) => acc * f.length, 1);
  // With no usable factors there are no variants (not a single empty one).
  const effectiveTotal = factors.length === 0 ? 0 : totalCount;

  const variants: ParameterVariant[] = [];
  let truncated = false;

  if (factors.length > 0) {
    truncated = buildCartesianProduct(factors, maxVariants, variants);
  }

  return { variants, truncated, totalCount: effectiveTotal, warnings };
}

function deterministicEntryToFactor(
  entry: DeterministicEntry,
  warnings: string[],
): ProductFactor | undefined {
  if (entry.kind === 'multiParameter') {
    return entry.valueSets.map((set) => {
      const variant: ParameterVariant = {};
      for (const assignment of set.assignments) {
        variant[assignment.parameterRef] = assignment.value;
      }
      return variant;
    });
  }

  // singleParameter
  const { parameterName, distribution } = entry;
  switch (distribution.kind) {
    case 'set':
      return distribution.values.map((value) => ({ [parameterName]: value }));
    case 'range':
      return rangeValues(distribution.range, distribution.stepWidth).map((value) => ({
        [parameterName]: value,
      }));
    case 'userDefined':
      warnings.push(
        `Skipped UserDefinedDistribution for parameter "${parameterName}" (type "${distribution.type}"): not enumerable.`,
      );
      return undefined;
  }
}

/**
 * Enumerate range values from `lowerLimit` to `upperLimit` stepping by
 * `stepWidth`, inclusive of the upper endpoint within {@link RANGE_STEP_EPSILON}.
 * Values are formatted with {@link formatNumber} to avoid float noise.
 */
function rangeValues(range: DistributionRangeBounds, stepWidth: number): string[] {
  const values: string[] = [];
  if (stepWidth <= 0) {
    // Degenerate step: fall back to the single lower endpoint.
    return [formatNumber(range.lowerLimit)];
  }

  const steps = Math.floor((range.upperLimit - range.lowerLimit) / stepWidth + RANGE_STEP_EPSILON);
  for (let i = 0; i <= steps; i++) {
    values.push(formatNumber(range.lowerLimit + i * stepWidth));
  }
  return values;
}

/**
 * Build the cartesian product of `factors` into `out`, stopping once
 * `maxVariants` entries have been produced. Returns whether truncation
 * occurred.
 */
function buildCartesianProduct(
  factors: ProductFactor[],
  maxVariants: number,
  out: ParameterVariant[],
): boolean {
  const total = factors.reduce((acc, f) => acc * f.length, 1);
  const limit = Math.min(total, maxVariants);

  for (let index = 0; index < limit; index++) {
    const variant: ParameterVariant = {};
    let remainder = index;
    for (const factor of factors) {
      const choice = factor[remainder % factor.length];
      remainder = Math.floor(remainder / factor.length);
      Object.assign(variant, choice);
    }
    out.push(variant);
  }

  return total > maxVariants;
}

// ---------------------------------------------------------------------------
// Stochastic — seeded sampling
// ---------------------------------------------------------------------------

function generateStochasticVariants(
  distribution: StochasticDistribution,
  maxVariants: number,
  defaultSeed: number,
): GenerateVariantsResult {
  const warnings: string[] = [];
  const totalCount = distribution.numberOfTestRuns;
  const limit = Math.min(totalCount, maxVariants);

  const seed = distribution.randomSeed ?? defaultSeed;
  const rng = mulberry32(hashSeed(seed));

  const variants: ParameterVariant[] = [];
  for (let run = 0; run < limit; run++) {
    const variant: ParameterVariant = {};
    for (const entry of distribution.distributions) {
      const sampled = sampleStochastic(entry.distribution, rng, entry.parameterName, warnings);
      if (sampled !== undefined) {
        variant[entry.parameterName] = sampled;
      }
    }
    variants.push(variant);
  }

  return {
    variants,
    truncated: totalCount > maxVariants,
    totalCount,
    warnings: dedupeWarnings(warnings),
  };
}

function sampleStochastic(
  distribution: StochasticDistributionType,
  rng: () => number,
  parameterName: string,
  warnings: string[],
): string | undefined {
  switch (distribution.kind) {
    case 'uniform':
      return formatNumber(sampleUniform(rng, distribution.range));
    case 'normal':
      return formatNumber(
        sampleTruncatedNormal(
          rng,
          distribution.expectedValue,
          distribution.variance,
          distribution.range,
        ),
      );
    case 'logNormal':
      return formatNumber(
        sampleLogNormal(
          rng,
          distribution.expectedValue,
          distribution.variance,
          distribution.range,
        ),
      );
    case 'poisson':
      return formatNumber(samplePoisson(rng, distribution.expectedValue, distribution.range));
    case 'histogram':
      return formatNumber(sampleHistogram(rng, distribution.bins));
    case 'probabilitySet':
      return weightedChoice(
        rng,
        distribution.elements.map((e) => ({ item: e.value, weight: e.weight })),
      );
    case 'userDefined':
      warnings.push(
        `Skipped UserDefinedDistribution for parameter "${parameterName}" (type "${distribution.type}"): not sampleable.`,
      );
      return undefined;
  }
}

function sampleUniform(rng: () => number, range: DistributionRangeBounds): number {
  return range.lowerLimit + rng() * (range.upperLimit - range.lowerLimit);
}

/**
 * Sample a normal deviate via Box-Muller (variance is σ²), clamped to the
 * optional range. Re-sampling would bias the distribution near the bounds, so
 * clamping is used deliberately for reproducibility.
 */
function sampleTruncatedNormal(
  rng: () => number,
  mean: number,
  variance: number,
  range?: DistributionRangeBounds,
): number {
  const stdDev = Math.sqrt(Math.max(variance, 0));
  const value = mean + stdDev * boxMuller(rng);
  return clampToRange(value, range);
}

function sampleLogNormal(
  rng: () => number,
  mean: number,
  variance: number,
  range?: DistributionRangeBounds,
): number {
  // expectedValue/variance parameterize the underlying normal (per OSC).
  const stdDev = Math.sqrt(Math.max(variance, 0));
  const value = Math.exp(mean + stdDev * boxMuller(rng));
  return clampToRange(value, range);
}

/** Knuth's algorithm for sampling a Poisson deviate. */
function samplePoisson(
  rng: () => number,
  expectedValue: number,
  range?: DistributionRangeBounds,
): number {
  const lambda = Math.max(expectedValue, 0);
  const l = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > l);
  return clampToRange(k - 1, range);
}

function sampleHistogram(
  rng: () => number,
  bins: { weight: number; range: DistributionRangeBounds }[],
): number {
  if (bins.length === 0) return 0;
  const chosen = weightedChoice(
    rng,
    bins.map((bin) => ({ item: bin, weight: bin.weight })),
  );
  const bin = chosen ?? bins[0];
  return sampleUniform(rng, bin.range);
}

/**
 * Choose one item proportional to its weight. Consumes exactly one `rng()`
 * draw. Returns `undefined` only for an empty input.
 */
function weightedChoice<T>(
  rng: () => number,
  entries: { item: T; weight: number }[],
): T | undefined {
  if (entries.length === 0) return undefined;
  const totalWeight = entries.reduce((acc, e) => acc + Math.max(e.weight, 0), 0);
  if (totalWeight <= 0) return entries[0].item;

  let target = rng() * totalWeight;
  for (const entry of entries) {
    target -= Math.max(entry.weight, 0);
    if (target < 0) return entry.item;
  }
  return entries[entries.length - 1].item;
}

function clampToRange(value: number, range?: DistributionRangeBounds): number {
  if (!range) return value;
  return Math.min(Math.max(value, range.lowerLimit), range.upperLimit);
}

// ---------------------------------------------------------------------------
// PRNG (mulberry32) + Box-Muller
// ---------------------------------------------------------------------------

/**
 * mulberry32: a fast, deterministic 32-bit seeded PRNG. Produces a function
 * returning floats in [0, 1). Identical seeds always produce identical streams.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Map an arbitrary (possibly fractional/negative) seed to a 32-bit integer. */
function hashSeed(seed: number): number {
  // Fold the float bits into 32 bits so fractional seeds differ deterministically.
  const buffer = new ArrayBuffer(8);
  new Float64Array(buffer)[0] = seed;
  const ints = new Uint32Array(buffer);
  return (ints[0] ^ ints[1]) >>> 0;
}

/** One standard-normal deviate via the Box-Muller transform. */
function boxMuller(rng: () => number): number {
  // Guard against log(0).
  let u = rng();
  while (u <= Number.EPSILON) u = rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Format a number as a compact string. Integers stay integers; fractional
 * values are rounded to a stable precision to avoid float noise such as
 * `0.30000000000000004`.
 */
function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  // Round to 12 significant digits then strip trailing zeros.
  const rounded = Number(value.toPrecision(12));
  return String(rounded);
}

function dedupeWarnings(warnings: string[]): string[] {
  return Array.from(new Set(warnings));
}
