/**
 * Stage 3-A: consumption-tracking passthrough, exemplar-migrated on <junction>.
 *
 * A crossing/common junction carries a <crossPath> child that the typed model
 * does not understand. Before passthrough it was dropped on load->save; now the
 * node tracker captures it into `junction.extra` and the serializer re-emits it,
 * so it survives the round-trip.
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

describe('junction passthrough (extra)', () => {
  it('captures an unmodeled <crossPath> child into junction.extra', () => {
    const doc = parser.parse(read('GT_21_common_junction_crosspath_19.xodr'));
    const withCrossPath = doc.junctions.find((j) =>
      j.extra?.children?.some((c) => c.name === 'crossPath'),
    );
    expect(withCrossPath, 'expected a junction carrying a crossPath in extra').toBeDefined();
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
