import { describe, it, expect } from 'vitest';
import { XoscParser } from '../../parser/xosc-parser.js';
import { XoscRootMismatchError } from '../../parser/xosc-root-error.js';

const parser = new XoscParser();

const DISTRIBUTION_ROOT = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="3" date="" description="" author=""/>
  <ParameterValueDistribution>
    <ScenarioFile filepath="base.xosc"/>
    <Deterministic/>
  </ParameterValueDistribution>
</OpenSCENARIO>`;

const CATALOG_ROOT = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="3" date="" description="" author=""/>
  <Catalog name="VehicleCatalog"/>
</OpenSCENARIO>`;

const SCENARIO_ROOT = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="3" date="" description="" author=""/>
  <Entities/>
  <Storyboard>
    <Init><Actions/></Init>
  </Storyboard>
</OpenSCENARIO>`;

describe('XoscParser root-choice detection', () => {
  it('throws XoscRootMismatchError for a ParameterValueDistribution root', () => {
    expect(() => parser.parse(DISTRIBUTION_ROOT)).toThrow(XoscRootMismatchError);
    try {
      parser.parse(DISTRIBUTION_ROOT);
    } catch (err) {
      expect(err).toBeInstanceOf(XoscRootMismatchError);
      expect((err as XoscRootMismatchError).rootKind).toBe('parameterValueDistribution');
    }
  });

  it('throws XoscRootMismatchError for a Catalog root', () => {
    expect(() => parser.parse(CATALOG_ROOT)).toThrow(XoscRootMismatchError);
    try {
      parser.parse(CATALOG_ROOT);
    } catch (err) {
      expect(err).toBeInstanceOf(XoscRootMismatchError);
      expect((err as XoscRootMismatchError).rootKind).toBe('catalog');
    }
  });

  it('still parses a normal scenario root without throwing', () => {
    expect(() => parser.parse(SCENARIO_ROOT)).not.toThrow();
    const doc = parser.parse(SCENARIO_ROOT);
    expect(doc.storyboard).toBeDefined();
  });
});
