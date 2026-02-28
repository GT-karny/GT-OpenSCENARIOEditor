import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { XoscParser } from '../../parser/xosc-parser.js';
import { EXAMPLES_DIR, XOSC_DIR, THIRDPARTY_DIR, GT_SIM_AVAILABLE } from '../test-helpers.js';

const parser = new XoscParser();

function getXoscFiles(absDir: string, label: string): { absDir: string; label: string; files: string[] } {
  if (!existsSync(absDir)) return { absDir, label, files: [] };
  const files = readdirSync(absDir).filter((f) => f.endsWith('.xosc'));
  return { absDir, label, files };
}

describe('Parse all fixture .xosc files without throwing', () => {
  const groups = [
    getXoscFiles(EXAMPLES_DIR, 'openscenario-v1.2.0/Examples'),
    getXoscFiles(XOSC_DIR, 'esmini/xosc'),
  ];

  for (const { absDir, label, files } of groups) {
    if (files.length === 0) {
      it.skip(`no files found in ${label}`, () => {});
      continue;
    }

    describe(label, () => {
      for (const file of files) {
        it(`parses ${file} without error`, () => {
          const xml = readFileSync(resolve(absDir, file), 'utf-8');
          expect(() => parser.parse(xml)).not.toThrow();
        });
      }
    });
  }

  // GT_Sim scenarios (only when Thirdparty is available locally)
  describe.skipIf(!GT_SIM_AVAILABLE)('GT_Sim', () => {
    const gtSimDir = resolve(THIRDPARTY_DIR, 'GT_Sim_v0.6.0-rc/resources/xosc');
    const { files } = getXoscFiles(gtSimDir, 'GT_Sim');

    for (const file of files) {
      it(`parses ${file} without error`, () => {
        const xml = readFileSync(resolve(gtSimDir, file), 'utf-8');
        expect(() => parser.parse(xml)).not.toThrow();
      });
    }
  });
});
