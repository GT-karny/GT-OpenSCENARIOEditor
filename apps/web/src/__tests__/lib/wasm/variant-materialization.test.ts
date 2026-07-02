import { describe, it, expect } from 'vitest';
import { createDefaultDocument } from '@osce/scenario-engine';
import type { ScenarioDocument } from '@osce/shared';
import { materializeVariant } from '../../../lib/wasm/variant-materialization';

/** A document with two declared parameters to override. */
function docWithParams(): ScenarioDocument {
  const doc = createDefaultDocument();
  return {
    ...doc,
    parameterDeclarations: [
      { id: 'p1', name: 'EgoSpeed', parameterType: 'double', value: '10' },
      { id: 'p2', name: 'Gap', parameterType: 'double', value: '5' },
    ],
  };
}

describe('materializeVariant', () => {
  it('overrides matching declaration values in the serialized XML', () => {
    const doc = docWithParams();
    const { xml } = materializeVariant(doc, { EgoSpeed: '30', Gap: '12' });
    expect(xml).toContain('name="EgoSpeed"');
    expect(xml).toContain('value="30"');
    expect(xml).toContain('value="12"');
    // The original defaults must not survive the override.
    expect(xml).not.toContain('value="10"');
    expect(xml).not.toContain('value="5"');
  });

  it('does not mutate the input document', () => {
    const doc = docWithParams();
    materializeVariant(doc, { EgoSpeed: '99' });
    expect(doc.parameterDeclarations[0].value).toBe('10');
  });

  it('reports variant keys with no matching declaration as unmatched', () => {
    const doc = docWithParams();
    const { unmatched } = materializeVariant(doc, { EgoSpeed: '30', Missing: '1' });
    expect(unmatched).toEqual(['Missing']);
  });

  it('leaves unrelated declarations untouched', () => {
    const doc = docWithParams();
    const { xml, unmatched } = materializeVariant(doc, { EgoSpeed: '30' });
    expect(unmatched).toEqual([]);
    // Gap keeps its default value.
    expect(xml).toContain('value="5"');
  });
});
