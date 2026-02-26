import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { XoscParser } from '../../parser/xosc-parser.js';
import { REPO_ROOT } from '../test-helpers.js';

const parser = new XoscParser();

function getXoscFiles(dir: string): string[] {
  const absDir = resolve(REPO_ROOT, dir);
  if (!existsSync(absDir)) return [];
  return readdirSync(absDir)
    .filter((f) => f.endsWith('.xosc'))
    .map((f) => join(dir, f));
}

describe('Parse all Thirdparty .xosc files without throwing', () => {
  const dirs = [
    'Thirdparty/openscenario-v1.2.0/Examples',
    'Thirdparty/esmini-demo_Windows/esmini-demo/resources/xosc',
  ];

  for (const dir of dirs) {
    const files = getXoscFiles(dir);

    if (files.length === 0) {
      it.skip(`no files found in ${dir}`, () => {});
      continue;
    }

    describe(dir.split('/').pop()!, () => {
      for (const file of files) {
        it(`parses ${file.split('/').pop()} without error`, () => {
          const xml = readFileSync(resolve(REPO_ROOT, file), 'utf-8');
          expect(() => parser.parse(xml)).not.toThrow();
        });
      }
    });
  }
});
