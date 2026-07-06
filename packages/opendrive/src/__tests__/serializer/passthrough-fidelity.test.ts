/**
 * Stage 3-E: input→output fidelity for the consumption-tracking passthrough.
 *
 * Idempotence (semantic-roundtrip.test.ts) proves the round-trip is *stable*;
 * this proves it is *faithful to the source*: every element the source declares
 * survives serialization, and the gap-matrix ⚠ representatives (content that
 * used to be silently dropped) are specifically checked to reappear.
 *
 * Phase 2 (W1) closed the lanes-domain re-serialization losses: lane-link
 * multiplicity AND the per-element @layer are now modeled (see
 * GT_min_lanelink_multiplicity.xodr and Ex_Lane_MultiLaneLayer.xodr). Known
 * residual losses for the lanes domain: NONE.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
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

/** Element tag names present in an XML string, excluding comments. */
function tagSet(xml: string): Set<string> {
  const stripped = xml.replace(/<!--[\s\S]*?-->/g, '');
  return new Set([...stripped.matchAll(/<([A-Za-z_][\w.-]*)/g)].map((m) => m[1]));
}

function roundTrip(src: string): string {
  return serializer.serializeFormatted(parser.parse(src));
}

describe('passthrough fidelity (input → output)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  beforeAll(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterAll(() => warnSpy.mockRestore());

  describe('every source element tag survives serialization', () => {
    for (const file of fixtures) {
      it(file, () => {
        const src = read(file);
        const out = roundTrip(src);
        const missing = [...tagSet(src)].filter((t) => !tagSet(out).has(t));
        expect(missing, `${file}: element tags dropped on round-trip`).toEqual([]);
      });
    }
  });

  // gap-matrix ⚠ representatives: content the strict-whitelist parser used to
  // drop, now carried through `extra`. Each asserts source presence → output
  // presence for a specific unmodeled element/attribute.
  describe('gap-matrix ⚠ representatives round-trip', () => {
    const cases: { file: string; needle: string; label: string }[] = [
      { file: 'Ex_CrossSectionSurface_CrossFall_LeftTurn_1.xodr', needle: '<crossSectionSurface', label: 'crossSectionSurface (F1)' },
      { file: 'Ex_CrossSectionSurface_CrossFall_LeftTurn_1.xodr', needle: '<surfaceStrips', label: 'surfaceStrips (F1)' },
      { file: 'Ex_Objects.xodr', needle: '<skeleton', label: 'object skeleton (C1)' },
      { file: 'Ex_Objects.xodr', needle: 'roadMarkColor', label: 'material @roadMarkColor (C8)' },
      { file: 'GT_21_common_junction_crosspath_19.xodr', needle: '<crossPath', label: 'junction crossPath (E9)' },
      { file: 'GT_g2_lanes_layer_19.xodr', needle: '<style', label: 'lane userData vendor payload' },
      { file: 'Ex_Bidirectional_Junction.xodr', needle: 'country', label: 'road type @country (F5)' },
    ];
    for (const { file, needle, label } of cases) {
      it(label, () => {
        const src = read(file);
        expect(src, `${file} fixture should contain ${needle}`).toContain(needle);
        expect(roundTrip(src), `${label}: dropped on round-trip`).toContain(needle);
      });
    }
  });

  it('preserves header @version/@vendor and an unmodeled header child', () => {
    const src = `<?xml version="1.0" encoding="UTF-8"?>
<OpenDRIVE>
  <header revMajor="1" revMinor="8" name="t" date="d" version="1.23" vendor="ACME">
    <license name="CC-BY"/>
  </header>
</OpenDRIVE>`;
    const doc = parser.parse(src);
    expect(doc.header.version).toBe('1.23');
    expect(doc.header.vendor).toBe('ACME');
    const out = serializer.serializeFormatted(doc);
    expect(out).toContain('version="1.23"');
    expect(out).toContain('vendor="ACME"');
    // Declared revMinor is preserved (not normalized to 6 on round-trip).
    expect(out).toContain('revMinor="8"');
    // Unmodeled <license> child (1.9) rides through as passthrough.
    expect(out).toContain('<license');
    expect(out).toContain('CC-BY');
  });
});
