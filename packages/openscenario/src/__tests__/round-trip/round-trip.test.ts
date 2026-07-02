import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { XoscParser } from '../../parser/xosc-parser.js';
import { XoscSerializer } from '../../serializer/xosc-serializer.js';
import type { ScenarioDocument } from '@osce/shared';
import {
  EXAMPLES_DIR,
  XOSC_DIR,
  THIRDPARTY_DIR,
  GT_SIM_AVAILABLE,
  FIXTURES_AVAILABLE,
} from '../test-helpers.js';

const parser = new XoscParser();
const serializer = new XoscSerializer();

/**
 * Deep clone a ScenarioDocument, stripping all `id` fields
 * (since UUIDs are regenerated on each parse) and `_editor` metadata.
 */
function stripVolatile(doc: ScenarioDocument): unknown {
  return JSON.parse(
    JSON.stringify(doc, (key, value) => {
      if (key === 'id' || key === '_editor') return undefined;
      return value;
    }),
  );
}

/**
 * Run a parse → serialize → parse round-trip and assert structural equality.
 * A missing fixture is a hard failure (not a silent pass) so that fixture drift
 * is caught instead of masked.
 */
function expectRoundTrip(dir: string, file: string): void {
  const path = resolve(dir, file);
  let xml: string;
  try {
    xml = readFileSync(path, 'utf-8');
  } catch (err) {
    throw new Error(
      `Round-trip fixture missing: ${path}. ` +
        `Expected a committed test fixture. Original error: ${(err as Error).message}`,
    );
  }

  const doc1 = parser.parse(xml);
  const xml2 = serializer.serializeFormatted(doc1);
  const doc2 = parser.parse(xml2);

  expect(stripVolatile(doc1)).toEqual(stripVolatile(doc2));
}

describe.skipIf(!FIXTURES_AVAILABLE)('Round-trip: parse → serialize → parse', () => {
  // OpenSCENARIO v1.2.0 official examples.
  // Note: the *ParameterSet.xosc files are ParameterValueDistribution documents,
  // not scenarios — they are round-tripped separately in
  // parse-parameter-distribution.test.ts and are (correctly) rejected by
  // XoscParser with a XoscRootMismatchError.
  const exampleFiles = [
    'CloseVehicleCrossing.xosc',
    'CutIn.xosc',
    'SimpleOvertake.xosc',
    'EndOfTrafficJam.xosc',
    'DoubleLaneChanger.xosc',
    'EndofTrafficJamNeighboringLaneOccupied.xosc',
    'FastOvertakeWithReInitialization.xosc',
    'Overtaker.xosc',
    'SequentialEvents_0-100-0kph_Explicit.xosc',
    'SequentialEvents_0-100-0kph_Implicit.xosc',
    'SlowPrecedingVehicle.xosc',
    'TrafficJam.xosc',
    'SynchronizedArrivalToIntersection.xosc',
  ];

  for (const file of exampleFiles) {
    it(`round-trips ${file}`, () => {
      expectRoundTrip(EXAMPLES_DIR, file);
    });
  }

  // esmini scenarios
  const esminiFiles = ['cut-in.xosc', 'acc-test.xosc', 'alks-test.xosc'];

  for (const file of esminiFiles) {
    it(`round-trips esmini/${file}`, () => {
      expectRoundTrip(XOSC_DIR, file);
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

    const gtSimDir = resolve(THIRDPARTY_DIR, 'GT_Sim_v0.6.0-rc/resources/xosc');
    for (const file of gtSimFiles) {
      it(`round-trips GT_Sim/${file}`, () => {
        expectRoundTrip(gtSimDir, file);
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
