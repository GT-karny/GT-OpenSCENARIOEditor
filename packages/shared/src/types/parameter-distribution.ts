/**
 * Parameter value distribution types for OpenSCENARIO v1.3.1.
 *
 * A distribution `.xosc` file is a standalone document whose root
 * `<OpenSCENARIO>` contains a `<ParameterValueDistribution>` (the third
 * OpenScenarioCategory choice besides ScenarioDefinition and CatalogDefinition).
 * It references a base scenario file and declares how top-level parameters of
 * that scenario should be varied — either deterministically (cartesian product
 * of explicit value lists / ranges) or stochastically (seeded random sampling).
 *
 * Choice branches are modelled as discriminated unions with a `kind`
 * discriminant, matching the convention used for actions and conditions.
 *
 * XSD reference: `ParameterValueDistribution`, `Deterministic`, `Stochastic`
 * and their subtypes in ASAM_OpenSCENARIO_v1.3.1_Schema/OpenSCENARIO.xsd.
 */

import type { FileHeader, ParameterAssignment } from './scenario.js';

/** XSD `Range` — inclusive numeric bounds (both attributes required). */
export interface DistributionRangeBounds {
  lowerLimit: number;
  upperLimit: number;
}

// ---------------------------------------------------------------------------
// Deterministic — single parameter
// ---------------------------------------------------------------------------

/** XSD `DistributionSet` — explicit list of `Element value` entries. */
export interface DistributionSet {
  kind: 'set';
  /** Values from each `<Element value="...">` (strings per XSD). */
  values: string[];
}

/** XSD `DistributionRange` — `Range` stepped by `stepWidth`. */
export interface DistributionRange {
  kind: 'range';
  stepWidth: number;
  range: DistributionRangeBounds;
}

/**
 * XSD `UserDefinedDistribution` — opaque string content plus a `type`
 * discriminator. Cannot be enumerated for variant generation.
 */
export interface UserDefinedDistribution {
  kind: 'userDefined';
  type: string;
  /** Free-form textual content of the element. */
  content: string;
}

/** XSD `DeterministicSingleParameterDistributionType` choice. */
export type DeterministicSingleDistributionType =
  | DistributionSet
  | DistributionRange
  | UserDefinedDistribution;

/** XSD `DeterministicSingleParameterDistribution`. */
export interface DeterministicSingleParameterDistribution {
  kind: 'singleParameter';
  parameterName: string;
  distribution: DeterministicSingleDistributionType;
}

// ---------------------------------------------------------------------------
// Deterministic — multi parameter
// ---------------------------------------------------------------------------

/** XSD `ParameterValueSet` — one explicit combination of assignments. */
export interface ParameterValueSet {
  assignments: ParameterAssignment[];
}

/**
 * XSD `DeterministicMultiParameterDistribution` (wraps `ValueSetDistribution`).
 * Each `ParameterValueSet` is one explicit row of the resulting product.
 */
export interface DeterministicMultiParameterDistribution {
  kind: 'multiParameter';
  valueSets: ParameterValueSet[];
}

/** XSD `DeterministicParameterDistribution` choice. */
export type DeterministicEntry =
  | DeterministicSingleParameterDistribution
  | DeterministicMultiParameterDistribution;

/** XSD `Deterministic`. */
export interface DeterministicDistribution {
  kind: 'deterministic';
  entries: DeterministicEntry[];
}

// ---------------------------------------------------------------------------
// Stochastic
// ---------------------------------------------------------------------------

/** XSD `ProbabilityDistributionSetElement`. */
export interface ProbabilityDistributionSetElement {
  value: string;
  weight: number;
}

/** XSD `ProbabilityDistributionSet`. */
export interface ProbabilityDistributionSet {
  kind: 'probabilitySet';
  elements: ProbabilityDistributionSetElement[];
}

/** XSD `NormalDistribution` — Gaussian with optional truncation range. */
export interface NormalDistribution {
  kind: 'normal';
  expectedValue: number;
  variance: number;
  range?: DistributionRangeBounds;
}

/** XSD `LogNormalDistribution` — same shape as normal (v1.2+). */
export interface LogNormalDistribution {
  kind: 'logNormal';
  expectedValue: number;
  variance: number;
  range?: DistributionRangeBounds;
}

/** XSD `UniformDistribution` — uniform over a required `Range`. */
export interface UniformDistribution {
  kind: 'uniform';
  range: DistributionRangeBounds;
}

/** XSD `PoissonDistribution` — Poisson with optional truncation range. */
export interface PoissonDistribution {
  kind: 'poisson';
  expectedValue: number;
  range?: DistributionRangeBounds;
}

/** XSD `HistogramBin` — a weighted value range. */
export interface HistogramBin {
  weight: number;
  range: DistributionRangeBounds;
}

/** XSD `Histogram` — weighted set of bins. */
export interface Histogram {
  kind: 'histogram';
  bins: HistogramBin[];
}

/** XSD `StochasticDistributionType` choice. */
export type StochasticDistributionType =
  | ProbabilityDistributionSet
  | NormalDistribution
  | LogNormalDistribution
  | UniformDistribution
  | PoissonDistribution
  | Histogram
  | UserDefinedDistribution;

/** XSD `StochasticDistribution`. */
export interface StochasticDistributionEntry {
  parameterName: string;
  distribution: StochasticDistributionType;
}

/** XSD `Stochastic`. */
export interface StochasticDistribution {
  kind: 'stochastic';
  numberOfTestRuns: number;
  /** XSD `randomSeed` (optional). */
  randomSeed?: number;
  distributions: StochasticDistributionEntry[];
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

/** XSD `DistributionDefinition` choice. */
export type DistributionDefinition = DeterministicDistribution | StochasticDistribution;

/**
 * A parsed parameter value distribution file (standalone `.xosc` whose
 * `<OpenSCENARIO>` root contains `<ParameterValueDistribution>`).
 */
export interface ParameterValueDistributionDocument {
  /** Internal UUID. */
  id: string;
  /** File metadata from `<FileHeader>`. */
  fileHeader: FileHeader;
  /** `<ScenarioFile filepath="...">` — path to the base scenario. */
  scenarioFilepath: string;
  /** The deterministic or stochastic distribution definition. */
  distribution: DistributionDefinition;
  /** Source file path (for display and re-saving). */
  _sourcePath?: string;
}
