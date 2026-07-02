import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseParameterValueDistributionXml } from '../parser/parse-parameter-distribution.js';
import { serializeParameterValueDistribution } from '../serializer/build-parameter-distribution.js';
import { THIRDPARTY_DIR } from './test-helpers.js';

const HEADER = `<FileHeader revMajor="1" revMinor="3" date="2024-01-01" description="dist" author="test"/>`;

/** Compare two parsed documents ignoring the per-parse `id`. */
function expectSameDoc(
  a: { id: string },
  b: { id: string },
): void {
  const { id: _idA, ...restA } = a;
  const { id: _idB, ...restB } = b;
  expect(restA).toEqual(restB);
}

function wrap(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  ${HEADER}
  <ParameterValueDistribution>
    <ScenarioFile filepath="base.xosc"/>
    ${inner}
  </ParameterValueDistribution>
</OpenSCENARIO>`;
}

// --- Deterministic fixtures ---

const DETERMINISTIC_XML = wrap(`
    <Deterministic>
      <DeterministicMultiParameterDistribution>
        <ValueSetDistribution>
          <ParameterValueSet>
            <ParameterAssignment parameterRef="TimeOfDay" value="2024-03-21T12:00:00"/>
            <ParameterAssignment parameterRef="Azimuth" value="3.1415"/>
          </ParameterValueSet>
          <ParameterValueSet>
            <ParameterAssignment parameterRef="TimeOfDay" value="2024-03-21T17:00:00"/>
            <ParameterAssignment parameterRef="Azimuth" value="4.5"/>
          </ParameterValueSet>
        </ValueSetDistribution>
      </DeterministicMultiParameterDistribution>
      <DeterministicSingleParameterDistribution parameterName="EgoSpeed">
        <DistributionSet>
          <Element value="10.0"/>
          <Element value="22.0"/>
          <Element value="25.0"/>
        </DistributionSet>
      </DeterministicSingleParameterDistribution>
      <DeterministicSingleParameterDistribution parameterName="A1Speed">
        <DistributionRange stepWidth="1.0">
          <Range lowerLimit="15.0" upperLimit="25.0"/>
        </DistributionRange>
      </DeterministicSingleParameterDistribution>
      <DeterministicSingleParameterDistribution parameterName="Mode">
        <UserDefinedDistribution type="custom">payload</UserDefinedDistribution>
      </DeterministicSingleParameterDistribution>
    </Deterministic>`);

// --- Stochastic fixtures (all 7 stochastic types) ---

const STOCHASTIC_XML = wrap(`
    <Stochastic numberOfTestRuns="100" randomSeed="1">
      <StochasticDistribution parameterName="P1">
        <ProbabilityDistributionSet>
          <Element value="10.0" weight="1"/>
          <Element value="22.0" weight="3"/>
          <Element value="25.0" weight="5"/>
        </ProbabilityDistributionSet>
      </StochasticDistribution>
      <StochasticDistribution parameterName="P2">
        <NormalDistribution expectedValue="22.222" variance="10.0">
          <Range lowerLimit="15.0" upperLimit="30.0"/>
        </NormalDistribution>
      </StochasticDistribution>
      <StochasticDistribution parameterName="P3">
        <LogNormalDistribution expectedValue="1.0" variance="0.5">
          <Range lowerLimit="0.1" upperLimit="10.0"/>
        </LogNormalDistribution>
      </StochasticDistribution>
      <StochasticDistribution parameterName="P4">
        <UniformDistribution>
          <Range lowerLimit="0.0" upperLimit="5.0"/>
        </UniformDistribution>
      </StochasticDistribution>
      <StochasticDistribution parameterName="P5">
        <PoissonDistribution expectedValue="3.0">
          <Range lowerLimit="0.0" upperLimit="10.0"/>
        </PoissonDistribution>
      </StochasticDistribution>
      <StochasticDistribution parameterName="P6">
        <Histogram>
          <Bin weight="1.0">
            <Range lowerLimit="0.0" upperLimit="1.0"/>
          </Bin>
          <Bin weight="2.0">
            <Range lowerLimit="1.0" upperLimit="2.0"/>
          </Bin>
        </Histogram>
      </StochasticDistribution>
      <StochasticDistribution parameterName="P7">
        <UserDefinedDistribution type="external">ref://data</UserDefinedDistribution>
      </StochasticDistribution>
    </Stochastic>`);

describe('parseParameterValueDistributionXml — Deterministic', () => {
  it('parses the file header, scenario file and distribution kind', () => {
    const doc = parseParameterValueDistributionXml(DETERMINISTIC_XML);
    expect(doc.fileHeader.description).toBe('dist');
    expect(doc.scenarioFilepath).toBe('base.xosc');
    expect(doc.distribution.kind).toBe('deterministic');
  });

  it('parses multi-parameter value sets', () => {
    const doc = parseParameterValueDistributionXml(DETERMINISTIC_XML);
    if (doc.distribution.kind !== 'deterministic') throw new Error('expected deterministic');
    const multi = doc.distribution.entries.find((e) => e.kind === 'multiParameter');
    expect(multi).toBeDefined();
    if (multi?.kind === 'multiParameter') {
      expect(multi.valueSets).toHaveLength(2);
      expect(multi.valueSets[0].assignments).toHaveLength(2);
      expect(multi.valueSets[0].assignments[0]).toEqual({
        parameterRef: 'TimeOfDay',
        value: '2024-03-21T12:00:00',
      });
    }
  });

  it('parses single-parameter set / range / userDefined', () => {
    const doc = parseParameterValueDistributionXml(DETERMINISTIC_XML);
    if (doc.distribution.kind !== 'deterministic') throw new Error('expected deterministic');
    const singles = doc.distribution.entries.filter((e) => e.kind === 'singleParameter');
    expect(singles).toHaveLength(3);

    const set = singles.find((s) => s.kind === 'singleParameter' && s.parameterName === 'EgoSpeed');
    if (set?.kind === 'singleParameter' && set.distribution.kind === 'set') {
      expect(set.distribution.values).toEqual(['10.0', '22.0', '25.0']);
    } else {
      throw new Error('expected DistributionSet');
    }

    const range = singles.find(
      (s) => s.kind === 'singleParameter' && s.parameterName === 'A1Speed',
    );
    if (range?.kind === 'singleParameter' && range.distribution.kind === 'range') {
      expect(range.distribution.stepWidth).toBe(1.0);
      expect(range.distribution.range).toEqual({ lowerLimit: 15.0, upperLimit: 25.0 });
    } else {
      throw new Error('expected DistributionRange');
    }

    const ud = singles.find((s) => s.kind === 'singleParameter' && s.parameterName === 'Mode');
    if (ud?.kind === 'singleParameter' && ud.distribution.kind === 'userDefined') {
      expect(ud.distribution.type).toBe('custom');
      expect(ud.distribution.content).toBe('payload');
    } else {
      throw new Error('expected UserDefinedDistribution');
    }
  });

  it('round-trips deterministic: parse → serialize → parse', () => {
    const doc1 = parseParameterValueDistributionXml(DETERMINISTIC_XML);
    const xml = serializeParameterValueDistribution(doc1);
    const doc2 = parseParameterValueDistributionXml(xml);
    expectSameDoc(doc2, doc1);
  });
});

describe('parseParameterValueDistributionXml — Stochastic', () => {
  it('parses stochastic header attrs and all 7 distribution types', () => {
    const doc = parseParameterValueDistributionXml(STOCHASTIC_XML);
    if (doc.distribution.kind !== 'stochastic') throw new Error('expected stochastic');
    expect(doc.distribution.numberOfTestRuns).toBe(100);
    expect(doc.distribution.randomSeed).toBe(1);
    expect(doc.distribution.distributions).toHaveLength(7);

    const kinds = doc.distribution.distributions.map((d) => d.distribution.kind);
    expect(kinds).toEqual([
      'probabilitySet',
      'normal',
      'logNormal',
      'uniform',
      'poisson',
      'histogram',
      'userDefined',
    ]);
  });

  it('parses stochastic detail values', () => {
    const doc = parseParameterValueDistributionXml(STOCHASTIC_XML);
    if (doc.distribution.kind !== 'stochastic') throw new Error('expected stochastic');
    const byName = (name: string) =>
      doc.distribution.kind === 'stochastic'
        ? doc.distribution.distributions.find((d) => d.parameterName === name)?.distribution
        : undefined;

    const p1 = byName('P1');
    if (p1?.kind === 'probabilitySet') {
      expect(p1.elements).toHaveLength(3);
      expect(p1.elements[2]).toEqual({ value: '25.0', weight: 5 });
    } else {
      throw new Error('expected probabilitySet');
    }

    const p2 = byName('P2');
    if (p2?.kind === 'normal') {
      expect(p2.expectedValue).toBe(22.222);
      expect(p2.variance).toBe(10.0);
      expect(p2.range).toEqual({ lowerLimit: 15.0, upperLimit: 30.0 });
    } else {
      throw new Error('expected normal');
    }

    const p5 = byName('P5');
    if (p5?.kind === 'poisson') {
      expect(p5.expectedValue).toBe(3.0);
      expect(p5.range).toEqual({ lowerLimit: 0.0, upperLimit: 10.0 });
    } else {
      throw new Error('expected poisson');
    }

    const p6 = byName('P6');
    if (p6?.kind === 'histogram') {
      expect(p6.bins).toHaveLength(2);
      expect(p6.bins[1]).toEqual({ weight: 2.0, range: { lowerLimit: 1.0, upperLimit: 2.0 } });
    } else {
      throw new Error('expected histogram');
    }
  });

  it('round-trips stochastic: parse → serialize → parse', () => {
    const doc1 = parseParameterValueDistributionXml(STOCHASTIC_XML);
    const xml = serializeParameterValueDistribution(doc1);
    const doc2 = parseParameterValueDistributionXml(xml);
    expectSameDoc(doc2, doc1);
  });

  it('treats randomSeed as optional', () => {
    const xml = wrap(`
      <Stochastic numberOfTestRuns="5">
        <StochasticDistribution parameterName="P">
          <UniformDistribution><Range lowerLimit="0" upperLimit="1"/></UniformDistribution>
        </StochasticDistribution>
      </Stochastic>`);
    const doc = parseParameterValueDistributionXml(xml);
    if (doc.distribution.kind !== 'stochastic') throw new Error('expected stochastic');
    expect(doc.distribution.randomSeed).toBeUndefined();
  });
});

describe('parseParameterValueDistributionXml — errors', () => {
  it('throws when <ParameterValueDistribution> is missing', () => {
    const xml = `<?xml version="1.0"?><OpenSCENARIO>${HEADER}</OpenSCENARIO>`;
    expect(() => parseParameterValueDistributionXml(xml)).toThrow('ParameterValueDistribution');
  });

  it('throws when neither Deterministic nor Stochastic is present', () => {
    const xml = wrap('');
    expect(() => parseParameterValueDistributionXml(xml)).toThrow(
      /Deterministic.*Stochastic|Stochastic.*Deterministic/,
    );
  });
});

// --- Real ASAM v1.3.1 example fixtures (local only) ---

const EXAMPLES_131 = resolve(
  THIRDPARTY_DIR,
  'openscenario-v1.3.1/ASAM_OpenSCENARIO_v1.3.1_Examples',
);

describe.skipIf(!existsSync(EXAMPLES_131))('ASAM v1.3.1 example distribution files', () => {
  it('round-trips SlowPrecedingVehicleDeterministicParameterSet.xosc', () => {
    const xml = readFileSync(
      resolve(EXAMPLES_131, 'SlowPrecedingVehicleDeterministicParameterSet.xosc'),
      'utf-8',
    );
    const doc1 = parseParameterValueDistributionXml(xml);
    expect(doc1.scenarioFilepath).toBe('SlowPrecedingVehicle.xosc');
    expect(doc1.distribution.kind).toBe('deterministic');
    const doc2 = parseParameterValueDistributionXml(serializeParameterValueDistribution(doc1));
    expectSameDoc(doc2, doc1);
  });

  it('round-trips SlowPrecedingVehicleStochasticParameterSet.xosc', () => {
    const xml = readFileSync(
      resolve(EXAMPLES_131, 'SlowPrecedingVehicleStochasticParameterSet.xosc'),
      'utf-8',
    );
    const doc1 = parseParameterValueDistributionXml(xml);
    expect(doc1.distribution.kind).toBe('stochastic');
    const doc2 = parseParameterValueDistributionXml(serializeParameterValueDistribution(doc1));
    expectSameDoc(doc2, doc1);
  });
});
