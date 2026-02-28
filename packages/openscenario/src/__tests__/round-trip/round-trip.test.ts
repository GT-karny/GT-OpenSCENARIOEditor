import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { XoscParser } from '../../parser/xosc-parser.js';
import { XoscSerializer } from '../../serializer/xosc-serializer.js';
import type { ScenarioDocument } from '@osce/shared';
import { EXAMPLES_DIR, XOSC_DIR, THIRDPARTY_DIR, GT_SIM_AVAILABLE } from '../test-helpers.js';

const parser = new XoscParser();
const serializer = new XoscSerializer();

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
  // OpenSCENARIO v1.2.0 official examples
  // Excluded: CloseVehicleCrossing (Polyline trajectory not yet supported)
  // Excluded: SynchronizedArrivalToIntersection (AssignRouteAction not yet supported)
  const exampleFiles = [
    'CutIn.xosc',
    'SimpleOvertake.xosc',
    'EndOfTrafficJam.xosc',
    'DoubleLaneChanger.xosc',
    'EndOfTrafficJamParameterSet.xosc',
    'EndofTrafficJamNeighboringLaneOccupied.xosc',
    'FastOvertakeWithReInitialization.xosc',
    'Overtaker.xosc',
    'SequentialEvents_0-100-0kph_Explicit.xosc',
    'SequentialEvents_0-100-0kph_Implicit.xosc',
    'SlowPrecedingVehicle.xosc',
    'SlowPrecedingVehicleDeterministicParameterSet.xosc',
    'SlowPrecedingVehicleStochasticParameterSet.xosc',
    'TrafficJam.xosc',
  ];

  for (const file of exampleFiles) {
    it(`round-trips ${file}`, () => {
      let xml: string;
      try {
        xml = readFileSync(resolve(EXAMPLES_DIR, file), 'utf-8');
      } catch {
        return;
      }

      const doc1 = parser.parse(xml);
      const xml2 = serializer.serializeFormatted(doc1);
      const doc2 = parser.parse(xml2);

      expect(stripVolatile(doc1)).toEqual(stripVolatile(doc2));
    });
  }

  // esmini scenarios
  const esminiFiles = ['cut-in.xosc', 'acc-test.xosc', 'alks-test.xosc'];

  for (const file of esminiFiles) {
    it(`round-trips esmini/${file}`, () => {
      let xml: string;
      try {
        xml = readFileSync(resolve(XOSC_DIR, file), 'utf-8');
      } catch {
        return;
      }

      const doc1 = parser.parse(xml);
      const xml2 = serializer.serializeFormatted(doc1);
      const doc2 = parser.parse(xml2);

      expect(stripVolatile(doc1)).toEqual(stripVolatile(doc2));
    });
  }

  // GT_Sim scenarios (only when Thirdparty is available locally)
  describe.skipIf(!GT_SIM_AVAILABLE)('GT_Sim scenarios', () => {
    const gtSimFiles = [
      'alks_cut-in.xosc',
      'alks_cut-out.xosc',
      'alks_decelerate.xosc',
      'car_walk.xosc',
      'cut-in_environment.xosc',
    ];

    for (const file of gtSimFiles) {
      it(`round-trips GT_Sim/${file}`, () => {
        let xml: string;
        try {
          xml = readFileSync(resolve(THIRDPARTY_DIR, 'GT_Sim_v0.6.0-rc/resources/xosc', file), 'utf-8');
        } catch {
          return;
        }

        const doc1 = parser.parse(xml);
        const xml2 = serializer.serializeFormatted(doc1);
        const doc2 = parser.parse(xml2);

        expect(stripVolatile(doc1)).toEqual(stripVolatile(doc2));
      });
    }
  });
});

describe('Serializer output', () => {
  it('produces valid XML declaration', () => {
    const xml = readFileSync(resolve(EXAMPLES_DIR, 'CutIn.xosc'), 'utf-8');
    const doc = parser.parse(xml);
    const output = serializer.serializeFormatted(doc);

    expect(output).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(output).toContain('<OpenSCENARIO');
    expect(output).toContain('</OpenSCENARIO>');
  });

  it('does not include _editor metadata', () => {
    const xml = readFileSync(resolve(EXAMPLES_DIR, 'CutIn.xosc'), 'utf-8');
    const doc = parser.parse(xml);
    const output = serializer.serializeFormatted(doc);

    expect(output).not.toContain('_editor');
    expect(output).not.toContain('formatVersion');
    expect(output).not.toContain('lastModified');
  });

  it('compact serialize produces no indentation', () => {
    const xml = readFileSync(resolve(EXAMPLES_DIR, 'CutIn.xosc'), 'utf-8');
    const doc = parser.parse(xml);
    const compact = serializer.serialize(doc);

    const lines = compact.split('\n').slice(1);
    for (const line of lines) {
      if (line.trim()) {
        expect(line).toBe(line.trimStart());
      }
    }
  });
});
