import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { XoscParser } from '../../parser/xosc-parser.js';
import { XoscSerializer } from '../../serializer/xosc-serializer.js';
import type { ScenarioDocument } from '@osce/shared';
import { REPO_ROOT } from '../test-helpers.js';

const parser = new XoscParser();
const serializer = new XoscSerializer();

function readXosc(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf-8');
}

/**
 * Deep clone a ScenarioDocument, stripping all `id` fields
 * (since UUIDs are regenerated on each parse) and `_editor` metadata.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripVolatile(doc: ScenarioDocument): any {
  return JSON.parse(
    JSON.stringify(doc, (key, value) => {
      if (key === 'id' || key === '_editor') return undefined;
      return value;
    }),
  );
}

describe('Round-trip: parse → serialize → parse', () => {
  const testFiles = [
    'Thirdparty/openscenario-v1.2.0/Examples/CutIn.xosc',
    'Thirdparty/openscenario-v1.2.0/Examples/SimpleOvertake.xosc',
    'Thirdparty/openscenario-v1.2.0/Examples/EndOfTrafficJam.xosc',
    'Thirdparty/openscenario-v1.2.0/Examples/DoubleLaneChanger.xosc',
  ];

  for (const file of testFiles) {
    it(`round-trips ${file.split('/').pop()}`, () => {
      let xml: string;
      try {
        xml = readXosc(file);
      } catch {
        // File may not exist in test environment
        return;
      }

      const doc1 = parser.parse(xml);
      const xml2 = serializer.serializeFormatted(doc1);
      const doc2 = parser.parse(xml2);

      expect(stripVolatile(doc1)).toEqual(stripVolatile(doc2));
    });
  }
});

describe('Serializer output', () => {
  it('produces valid XML declaration', () => {
    const xml = readXosc('Thirdparty/openscenario-v1.2.0/Examples/CutIn.xosc');
    const doc = parser.parse(xml);
    const output = serializer.serializeFormatted(doc);

    expect(output).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(output).toContain('<OpenSCENARIO');
    expect(output).toContain('</OpenSCENARIO>');
  });

  it('does not include _editor metadata', () => {
    const xml = readXosc('Thirdparty/openscenario-v1.2.0/Examples/CutIn.xosc');
    const doc = parser.parse(xml);
    const output = serializer.serializeFormatted(doc);

    expect(output).not.toContain('_editor');
    expect(output).not.toContain('formatVersion');
    expect(output).not.toContain('lastModified');
  });

  it('compact serialize produces no indentation', () => {
    const xml = readXosc('Thirdparty/openscenario-v1.2.0/Examples/CutIn.xosc');
    const doc = parser.parse(xml);
    const compact = serializer.serialize(doc);

    // Compact should not have indented lines (after the XML declaration)
    const lines = compact.split('\n').slice(1);
    for (const line of lines) {
      if (line.trim()) {
        expect(line).toBe(line.trimStart());
      }
    }
  });
});
