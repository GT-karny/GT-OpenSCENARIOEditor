import type {
  DeterministicDistribution,
  DeterministicSingleDistributionType,
  DistributionDefinition,
  DistributionRangeBounds,
  Histogram,
  ParameterValueDistributionDocument,
  ProbabilityDistributionSet,
  StochasticDistribution,
  StochasticDistributionType,
  UserDefinedDistribution,
} from '@osce/shared';
import { createXoscXmlBuilder } from './fxp-builder-config.js';
import { buildFileHeader } from './build-file-header.js';
import { buildAttrs } from '../utils/xml-helpers.js';

export function serializeParameterValueDistribution(
  doc: ParameterValueDistributionDocument,
  formatted = true,
): string {
  const builder = createXoscXmlBuilder(formatted);

  const pvd: Record<string, unknown> = {
    ScenarioFile: buildAttrs({ filepath: doc.scenarioFilepath }),
    ...buildDistributionDefinition(doc.distribution),
  };

  const xmlObj: Record<string, unknown> = {
    OpenSCENARIO: {
      FileHeader: buildFileHeader(doc.fileHeader),
      ParameterValueDistribution: pvd,
    },
  };

  const xmlDecl = '<?xml version="1.0" encoding="UTF-8"?>\n';
  return xmlDecl + builder.build(xmlObj);
}

export function serializeParameterValueDistributionFormatted(
  doc: ParameterValueDistributionDocument,
): string {
  return serializeParameterValueDistribution(doc, true);
}

function buildDistributionDefinition(
  distribution: DistributionDefinition,
): Record<string, unknown> {
  if (distribution.kind === 'deterministic') {
    return { Deterministic: buildDeterministic(distribution) };
  }
  return { Stochastic: buildStochastic(distribution) };
}

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

function buildDeterministic(distribution: DeterministicDistribution): Record<string, unknown> {
  const multi = distribution.entries.filter((e) => e.kind === 'multiParameter');
  const single = distribution.entries.filter((e) => e.kind === 'singleParameter');

  const result: Record<string, unknown> = {};

  if (multi.length > 0) {
    result.DeterministicMultiParameterDistribution = multi.map((e) => ({
      ValueSetDistribution: {
        ParameterValueSet: e.valueSets.map((set) => ({
          ParameterAssignment: set.assignments.map((a) =>
            buildAttrs({ parameterRef: a.parameterRef, value: a.value }),
          ),
        })),
      },
    }));
  }

  if (single.length > 0) {
    result.DeterministicSingleParameterDistribution = single.map((e) => ({
      ...buildAttrs({ parameterName: e.parameterName }),
      ...buildSingleDistributionType(e.distribution),
    }));
  }

  return result;
}

function buildSingleDistributionType(
  distribution: DeterministicSingleDistributionType,
): Record<string, unknown> {
  switch (distribution.kind) {
    case 'set':
      return {
        DistributionSet: {
          Element: distribution.values.map((value) => buildAttrs({ value })),
        },
      };
    case 'range':
      return {
        DistributionRange: {
          ...buildAttrs({ stepWidth: distribution.stepWidth }),
          Range: buildRange(distribution.range),
        },
      };
    case 'userDefined':
      return { UserDefinedDistribution: buildUserDefinedDistribution(distribution) };
  }
}

// ---------------------------------------------------------------------------
// Stochastic
// ---------------------------------------------------------------------------

function buildStochastic(distribution: StochasticDistribution): Record<string, unknown> {
  return {
    ...buildAttrs({
      numberOfTestRuns: distribution.numberOfTestRuns,
      randomSeed: distribution.randomSeed,
    }),
    StochasticDistribution: distribution.distributions.map((d) => ({
      ...buildAttrs({ parameterName: d.parameterName }),
      ...buildStochasticDistributionType(d.distribution),
    })),
  };
}

function buildStochasticDistributionType(
  distribution: StochasticDistributionType,
): Record<string, unknown> {
  switch (distribution.kind) {
    case 'probabilitySet':
      return { ProbabilityDistributionSet: buildProbabilityDistributionSet(distribution) };
    case 'normal':
      return {
        NormalDistribution: {
          ...buildAttrs({
            expectedValue: distribution.expectedValue,
            variance: distribution.variance,
          }),
          ...buildOptionalRange(distribution.range),
        },
      };
    case 'logNormal':
      return {
        LogNormalDistribution: {
          ...buildAttrs({
            expectedValue: distribution.expectedValue,
            variance: distribution.variance,
          }),
          ...buildOptionalRange(distribution.range),
        },
      };
    case 'uniform':
      return { UniformDistribution: { Range: buildRange(distribution.range) } };
    case 'poisson':
      return {
        PoissonDistribution: {
          ...buildAttrs({ expectedValue: distribution.expectedValue }),
          ...buildOptionalRange(distribution.range),
        },
      };
    case 'histogram':
      return { Histogram: buildHistogram(distribution) };
    case 'userDefined':
      return { UserDefinedDistribution: buildUserDefinedDistribution(distribution) };
  }
}

function buildProbabilityDistributionSet(
  distribution: ProbabilityDistributionSet,
): Record<string, unknown> {
  return {
    Element: distribution.elements.map((el) =>
      buildAttrs({ value: el.value, weight: el.weight }),
    ),
  };
}

function buildHistogram(distribution: Histogram): Record<string, unknown> {
  return {
    Bin: distribution.bins.map((bin) => ({
      ...buildAttrs({ weight: bin.weight }),
      Range: buildRange(bin.range),
    })),
  };
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function buildRange(range: DistributionRangeBounds): Record<string, string> {
  return buildAttrs({ lowerLimit: range.lowerLimit, upperLimit: range.upperLimit });
}

function buildOptionalRange(
  range: DistributionRangeBounds | undefined,
): Record<string, unknown> {
  return range ? { Range: buildRange(range) } : {};
}

function buildUserDefinedDistribution(
  distribution: UserDefinedDistribution,
): Record<string, unknown> {
  return {
    ...buildAttrs({ type: distribution.type }),
    '#text': distribution.content,
  };
}
