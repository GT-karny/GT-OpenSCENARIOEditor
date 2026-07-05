/**
 * Stage 3-E: semantic round-trip equality across the 1.9 fixtures.
 *
 * The lossless criterion is idempotence of serialize∘parse: once a document has
 * been through one round-trip, a second round-trip must reproduce it byte-for-
 * byte. If any attribute or child element is dropped (not modeled and not
 * passed through), the second serialize loses it and s2 !== s1. Because both
 * strings have already passed through fmtNum once, this is robust to float
 * formatting; the first parse→serialize may reorder children (accepted), but
 * from s1 onward the output is stable.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { XodrParser } from '../../parser/xodr-parser.js';
import { XodrSerializer } from '../../serializer/xodr-serializer.js';

const parser = new XodrParser();
const serializer = new XodrSerializer();
const FIXTURES_DIR = resolve(__dirname, '../../../../../test-fixtures/opendrive-v1.9');

const fixtures = readdirSync(FIXTURES_DIR)
  .filter((f) => f.endsWith('.xodr'))
  .sort();

function read(file: string): string {
  return readFileSync(resolve(FIXTURES_DIR, file), 'utf-8');
}

describe('semantic round-trip (serialize∘parse idempotence)', () => {
  for (const file of fixtures) {
    it(`${file}: second round-trip reproduces the first`, () => {
      const s1 = serializer.serializeFormatted(parser.parse(read(file)));
      const s2 = serializer.serializeFormatted(parser.parse(s1));
      expect(s2).toBe(s1);
    });
  }
});
