import type {
  DeterministicDistribution,
  DeterministicEntry,
  DeterministicSingleDistributionType,
  DistributionDefinition,
  DistributionRangeBounds,
  Histogram,
  HistogramBin,
  ParameterValueDistributionDocument,
  ParameterValueSet,
  ProbabilityDistributionSet,
  StochasticDistribution,
  StochasticDistributionEntry,
  StochasticDistributionType,
  UserDefinedDistribution,
} from '@osce/shared';
import { generateId } from '@osce/shared';
import { XMLParser } from 'fast-xml-parser';
import { parseFileHeader } from './parse-file-header.js';
import type { RawXml } from '../utils/xml-helpers.js';
import {
  child,
  children,
  numAttr,
  optNumAttr,
  rawKeys,
  strAttr,
} from '../utils/xml-helpers.js';

/**
 * Elements that can appear multiple times inside a
 * `<ParameterValueDistribution>` document. A dedicated parser config is needed
 * because the scenario parser does not treat these as arrays (and `Element`,
 * `Bin`, `ParameterValueSet`, etc. are specific to distributions).
 */
const DISTRIBUTION_ARRAY_ELEMENTS = new Set([
  'DeterministicMultiParameterDistribution',
  'DeterministicSingleParameterDistribution',
  'ParameterValueSet',
  'ParameterAssignment',
  'StochasticDistribution',
  'Element',
  'Bin',
]);

function createDistributionXmlParser(): XMLParser {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name: string, _jpath: string, _isLeafNode: boolean, isAttribute: boolean) => {
      if (isAttribute) return false;
      return DISTRIBUTION_ARRAY_ELEMENTS.has(name);
    },
    parseTagValue: false,
    parseAttributeValue: false,
    preserveOrder: false,
    allowBooleanAttributes: true,
    trimValues: true,
  });
}

export function parseParameterValueDistributionXml(
  xml: string,
): ParameterValueDistributionDocument {
  const parser = createDistributionXmlParser();
  const raw = parser.parse(xml) as RawXml;
  const root = child(raw, 'OpenSCENARIO');

  if (!root) {
    throw new Error('Invalid OpenSCENARIO XML: missing <OpenSCENARIO> root element');
  }

  const pvd = child(root, 'ParameterValueDistribution');
  if (!pvd) {
    throw new Error(
      'Invalid parameter distribution XML: missing <ParameterValueDistribution> under <OpenSCENARIO>',
    );
  }

  const scenarioFile = child(pvd, 'ScenarioFile');
  const scenarioFilepath = strAttr(scenarioFile, 'filepath');

  return {
    id: generateId(),
    fileHeader: parseFileHeader(child(root, 'FileHeader')),
    scenarioFilepath,
    distribution: parseDistributionDefinition(pvd),
  };
}

function parseDistributionDefinition(pvd: RawXml): DistributionDefinition {
  const deterministic = child(pvd, 'Deterministic');
  if (deterministic) {
    return parseDeterministic(deterministic);
  }
  const stochastic = child(pvd, 'Stochastic');
  if (stochastic) {
    return parseStochastic(stochastic);
  }
  throw new Error(
    `Invalid <ParameterValueDistribution>: expected <Deterministic> or <Stochastic>, found [${rawKeys(
      pvd,
    ).join(', ')}]`,
  );
}

// ---------------------------------------------------------------------------
// Deterministic
// ---------------------------------------------------------------------------

function parseDeterministic(raw: RawXml): DeterministicDistribution {
  const entries: DeterministicEntry[] = [];

  for (const multi of children(raw, 'DeterministicMultiParameterDistribution')) {
    entries.push(parseMultiParameter(multi));
  }
  for (const single of children(raw, 'DeterministicSingleParameterDistribution')) {
    entries.push(parseSingleParameter(single));
  }

  return { kind: 'deterministic', entries };
}

function parseMultiParameter(raw: RawXml): DeterministicEntry {
  const valueSetDist = child(raw, 'ValueSetDistribution');
  const valueSets: ParameterValueSet[] = children(valueSetDist, 'ParameterValueSet').map(
    (set) => ({
      assignments: children(set, 'ParameterAssignment').map((pa) => ({
        parameterRef: strAttr(pa, 'parameterRef'),
        value: strAttr(pa, 'value'),
      })),
    }),
  );
  return { kind: 'multiParameter', valueSets };
}

function parseSingleParameter(raw: RawXml): DeterministicEntry {
  return {
    kind: 'singleParameter',
    parameterName: strAttr(raw, 'parameterName'),
    distribution: parseSingleDistributionType(raw),
  };
}

function parseSingleDistributionType(raw: RawXml): DeterministicSingleDistributionType {
  const set = child(raw, 'DistributionSet');
  if (set) {
    return {
      kind: 'set',
      values: children(set, 'Element').map((el) => strAttr(el, 'value')),
    };
  }

  const range = child(raw, 'DistributionRange');
  if (range) {
    return {
      kind: 'range',
      stepWidth: numAttr(range, 'stepWidth'),
      range: parseRange(child(range, 'Range')),
    };
  }

  const userDefined = child(raw, 'UserDefinedDistribution');
  if (userDefined) {
    return parseUserDefinedDistribution(userDefined);
  }

  throw new Error(
    `Invalid <DeterministicSingleParameterDistribution>: expected DistributionSet, DistributionRange or UserDefinedDistribution, found [${rawKeys(
      raw,
    ).join(', ')}]`,
  );
}

// ---------------------------------------------------------------------------
// Stochastic
// ---------------------------------------------------------------------------

function parseStochastic(raw: RawXml): StochasticDistribution {
  const distributions: StochasticDistributionEntry[] = children(
    raw,
    'StochasticDistribution',
  ).map((d) => ({
    parameterName: strAttr(d, 'parameterName'),
    distribution: parseStochasticDistributionType(d),
  }));

  return {
    kind: 'stochastic',
    numberOfTestRuns: numAttr(raw, 'numberOfTestRuns'),
    randomSeed: optNumAttr(raw, 'randomSeed'),
    distributions,
  };
}

function parseStochasticDistributionType(raw: RawXml): StochasticDistributionType {
  const probabilitySet = child(raw, 'ProbabilityDistributionSet');
  if (probabilitySet) {
    return parseProbabilityDistributionSet(probabilitySet);
  }

  const normal = child(raw, 'NormalDistribution');
  if (normal) {
    return {
      kind: 'normal',
      expectedValue: numAttr(normal, 'expectedValue'),
      variance: numAttr(normal, 'variance'),
      range: parseOptionalRange(child(normal, 'Range')),
    };
  }

  const logNormal = child(raw, 'LogNormalDistribution');
  if (logNormal) {
    return {
      kind: 'logNormal',
      expectedValue: numAttr(logNormal, 'expectedValue'),
      variance: numAttr(logNormal, 'variance'),
      range: parseOptionalRange(child(logNormal, 'Range')),
    };
  }

  const uniform = child(raw, 'UniformDistribution');
  if (uniform) {
    return { kind: 'uniform', range: parseRange(child(uniform, 'Range')) };
  }

  const poisson = child(raw, 'PoissonDistribution');
  if (poisson) {
    return {
      kind: 'poisson',
      expectedValue: numAttr(poisson, 'expectedValue'),
      range: parseOptionalRange(child(poisson, 'Range')),
    };
  }

  const histogram = child(raw, 'Histogram');
  if (histogram) {
    return parseHistogram(histogram);
  }

  const userDefined = child(raw, 'UserDefinedDistribution');
  if (userDefined) {
    return parseUserDefinedDistribution(userDefined);
  }

  throw new Error(
    `Invalid <StochasticDistribution>: unknown distribution type, found [${rawKeys(raw).join(
      ', ',
    )}]`,
  );
}

function parseProbabilityDistributionSet(raw: RawXml): ProbabilityDistributionSet {
  return {
    kind: 'probabilitySet',
    elements: children(raw, 'Element').map((el) => ({
      value: strAttr(el, 'value'),
      weight: numAttr(el, 'weight'),
    })),
  };
}

function parseHistogram(raw: RawXml): Histogram {
  const bins: HistogramBin[] = children(raw, 'Bin').map((bin) => ({
    weight: numAttr(bin, 'weight'),
    range: parseRange(child(bin, 'Range')),
  }));
  return { kind: 'histogram', bins };
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function parseRange(raw: RawXml | undefined): DistributionRangeBounds {
  return {
    lowerLimit: numAttr(raw, 'lowerLimit'),
    upperLimit: numAttr(raw, 'upperLimit'),
  };
}

function parseOptionalRange(raw: RawXml | undefined): DistributionRangeBounds | undefined {
  return raw ? parseRange(raw) : undefined;
}

function parseUserDefinedDistribution(raw: RawXml): UserDefinedDistribution {
  // UserDefinedDistribution is a simpleContent string with a `type` attribute.
  // fast-xml-parser stores element text under the `#text` key.
  const content = raw['#text'];
  return {
    kind: 'userDefined',
    type: strAttr(raw, 'type'),
    content: typeof content === 'string' ? content : '',
  };
}
