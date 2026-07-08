import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GlobalAction, ParameterAction, VariableAction, VariableDeclaration } from '@osce/shared';
import { parseGlobalAction } from '../../parser/parse-actions.js';
import { buildGlobalAction } from '../../serializer/build-actions.js';
import { createXoscXmlParser } from '../../parser/fxp-config.js';
import { createXoscXmlBuilder } from '../../serializer/fxp-builder-config.js';
import { XoscParser } from '../../parser/xosc-parser.js';
import { XoscSerializer } from '../../serializer/xosc-serializer.js';
import { EXAMPLES_DIR, FIXTURES_AVAILABLE } from '../test-helpers.js';

const xmlParser = createXoscXmlParser();
const xmlBuilder = createXoscXmlBuilder(false);

/**
 * Run a single GlobalAction through the real XML serialize → parse cycle:
 * model → build object → XML string → parsed object → model.
 * This exercises the actual fast-xml-parser config used in production,
 * so a non-XSD wrapper (e.g. <ByValue>) would surface as a parse failure.
 */
function roundTripGlobalAction(action: GlobalAction): { action: GlobalAction; xml: string } {
  const built = buildGlobalAction(action);
  const xml = xmlBuilder.build({ GlobalAction: built });
  const reparsed = xmlParser.parse(xml);
  return { action: parseGlobalAction(reparsed.GlobalAction), xml };
}

describe('ParameterAction modify round-trip (XSD ModifyRule)', () => {
  it('round-trips addValue without a ByValue wrapper', () => {
    const input: ParameterAction = {
      type: 'parameterAction',
      parameterRef: 'speedParam',
      actionType: 'modify',
      rule: 'addValue',
      modifyValue: 5,
    };

    const { action, xml } = roundTripGlobalAction(input);

    expect(xml).toContain('<Rule>');
    expect(xml).toContain('<AddValue value="5"');
    expect(xml).not.toContain('<ByValue'); // no non-XSD <ByValue> wrapper element
    expect(action).toEqual(input);
  });

  it('round-trips multiplyByValue', () => {
    const input: ParameterAction = {
      type: 'parameterAction',
      parameterRef: 'speedParam',
      actionType: 'modify',
      rule: 'multiplyByValue',
      modifyValue: 2,
    };

    const { action, xml } = roundTripGlobalAction(input);

    expect(xml).toContain('<MultiplyByValue value="2"');
    expect(xml).not.toContain('<ByValue'); // MultiplyByValue sits directly under <Rule>, no wrapper
    expect(action).toEqual(input);
  });
});

describe('VariableAction modify round-trip (XSD VariableModifyRule)', () => {
  it('round-trips addValue', () => {
    const input: VariableAction = {
      type: 'variableAction',
      variableRef: 'counter',
      actionType: 'modify',
      rule: 'addValue',
      modifyValue: 1,
    };

    const { action, xml } = roundTripGlobalAction(input);

    expect(xml).toContain('<AddValue value="1"');
    expect(xml).not.toContain('<ByValue');
    expect(action).toEqual(input);
  });

  it('round-trips multiplyByValue', () => {
    const input: VariableAction = {
      type: 'variableAction',
      variableRef: 'counter',
      actionType: 'modify',
      rule: 'multiplyByValue',
      modifyValue: 3,
    };

    const { action } = roundTripGlobalAction(input);
    expect(action).toEqual(input);
  });
});

describe.skipIf(!FIXTURES_AVAILABLE)('VariableDeclarations element order (XSD ScenarioDefinition sequence)', () => {
  const parser = new XoscParser();
  const serializer = new XoscSerializer();

  it('emits VariableDeclarations after ParameterDeclarations and before CatalogLocations', () => {
    const xml = readFileSync(resolve(EXAMPLES_DIR, 'CutIn.xosc'), 'utf-8');
    const doc = parser.parse(xml);

    const variable: VariableDeclaration = {
      id: 'var-1',
      name: 'myVar',
      variableType: 'double',
      value: '0',
    };
    doc.variableDeclarations = [variable];

    const out = serializer.serializeFormatted(doc);

    const paramIdx = out.indexOf('<ParameterDeclarations');
    const varIdx = out.indexOf('<VariableDeclarations');
    const catalogIdx = out.indexOf('<CatalogLocations');
    const storyboardIdx = out.indexOf('<Storyboard');

    expect(varIdx).toBeGreaterThan(-1);
    expect(varIdx).toBeGreaterThan(paramIdx);
    expect(varIdx).toBeLessThan(catalogIdx);
    expect(varIdx).toBeLessThan(storyboardIdx);
  });
});
