/**
 * Junction round-trip: <crossPath> was originally preserved via `junction.extra`
 * (passthrough). Phase 2 (W2) models it typed on `junction.crossPaths`; this
 * suite now asserts the typed capture plus continued serialize survival and
 * subtree idempotence.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { XodrParser } from '../../parser/xodr-parser.js';
import { XodrSerializer } from '../../serializer/xodr-serializer.js';

const parser = new XodrParser();
const serializer = new XodrSerializer();
const FIXTURES_DIR = resolve(__dirname, '../../../../../test-fixtures/opendrive-v1.9');

function read(file: string): string {
  return readFileSync(resolve(FIXTURES_DIR, file), 'utf-8');
}

describe('junction crossPath (typed)', () => {
  it('parses <crossPath> into the typed junction.crossPaths', () => {
    const doc = parser.parse(read('GT_21_common_junction_crosspath_19.xodr'));
    const withCrossPath = doc.junctions.find((j) => j.crossPaths && j.crossPaths.length > 0);
    expect(withCrossPath, 'expected a junction carrying a typed crossPath').toBeDefined();
    const cp = withCrossPath!.crossPaths![0];
    expect(cp.crossingRoad).toBe('2');
    expect(cp.startLaneLink.from).toBe(2);
    expect(cp.endLaneLink.to).toBe(-1);
  });

  it('re-emits crossPath so it survives serialize', () => {
    const src = read('GT_21_common_junction_crosspath_19.xodr');
    expect(src).toContain('<crossPath');

    const serialized = serializer.serializeFormatted(parser.parse(src));
    // The unmodeled crossPath element (with its crossingRoad attr) is preserved.
    expect(serialized).toContain('<crossPath');
    expect(serialized).toContain('crossingRoad');
  });

  it('serialize∘parse is idempotent for the junction subtree', () => {
    const src = read('GT_21_common_junction_crosspath_19.xodr');
    const s1 = serializer.serializeFormatted(parser.parse(src));
    const s2 = serializer.serializeFormatted(parser.parse(s1));
    // Idempotence proves nothing modeled OR passed-through is lost on re-round-trip.
    // (Scoped to junctions here; the full-document idempotence test lands with 3-B.)
    const junction1 = s1.slice(s1.indexOf('<junction'));
    const junction2 = s2.slice(s2.indexOf('<junction'));
    expect(junction2).toBe(junction1);
  });
});
