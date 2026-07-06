/**
 * OpenDRIVE 1.9 fixture load smoke test (Phase 0-B item 7).
 *
 * Every `.xodr` under `test-fixtures/opendrive-v1.9/` is enumerated at test time
 * (drop a new fixture in the directory and it is auto-covered) and must:
 *   1. Parse without throwing.
 *   2. Produce a non-empty document (>= 1 road) with lanes NOT all lost
 *      (permanent lanes present even when a temporary 1.9 lane layer exists).
 *   3. Round-trip: serialize -> reparse -> structurally stable (road & junction
 *      count; virtual-junction @mainRoad/@sStart/@sEnd/@orientation preserved).
 *
 * These fixtures exercise the Phase 0-B parser fixes:
 *   - Dual <lanes> (1.9 lane layers): both layers typed — permanent flat on
 *     OdrRoad, temporary on OdrRoad.temporaryLanes.
 *   - Virtual junctions round-trip @mainRoad/@sStart/@sEnd/@orientation.
 *   - Unknown planView geometry primitives throw explicitly (no standard sample
 *     hits this — all copied fixtures use line/arc/spiral/poly3/paramPoly3).
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { XodrParser } from '../../parser/xodr-parser.js';
import { XodrSerializer } from '../../serializer/xodr-serializer.js';

const parser = new XodrParser();
const serializer = new XodrSerializer();

const FIXTURES_DIR = resolve(__dirname, '../../../../../test-fixtures/opendrive-v1.9');

/**
 * Fixtures with a temporary 1.9 lane layer. Listed so the assertions can be
 * targeted; console.warn is spied globally to keep suite output clean.
 */
const TEMP_LAYER_FIXTURES = new Set([
  'Ex_Lane_MultiLaneLayer.xodr',
  'Ex_Motorway_roadworks_temporary_layer_lane_offset.xodr',
  'GT_g2_lanes_layer_19.xodr',
]);

/**
 * Fixtures that contain a virtual junction whose 1.9 attributes must round-trip.
 * `orientation` is optional per schema (Ex_Pedestrian_Crossing omits it), so it
 * is only asserted equal, not required to be defined.
 */
const VIRTUAL_JUNCTION_FIXTURES = new Set([
  'GT_23_virtual_junction_17.xodr',
  'Ex_Pedestrian_Crossing.xodr',
]);

const fixtureFiles = readdirSync(FIXTURES_DIR)
  .filter((f) => f.endsWith('.xodr'))
  .sort();

function readFixture(file: string): string {
  return readFileSync(resolve(FIXTURES_DIR, file), 'utf-8');
}

describe('OpenDRIVE 1.9 fixtures — load smoke test', () => {
  // Temporary-layer fixtures emit an expected console.warn on parse; silence it
  // so the suite output stays clean, but keep the spy so it can be asserted.
  let warnSpy: ReturnType<typeof vi.spyOn>;
  beforeAll(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterAll(() => {
    warnSpy.mockRestore();
  });

  it('directory contains fixtures to test', () => {
    expect(fixtureFiles.length).toBeGreaterThan(0);
  });

  for (const file of fixtureFiles) {
    describe(file, () => {
      it('parses without throwing and yields at least one road', () => {
        let doc;
        try {
          doc = parser.parse(readFixture(file));
        } catch (e) {
          throw new Error(`Parsing fixture "${file}" threw: ${(e as Error).message}`);
        }
        expect(doc.roads.length, `${file}: expected at least one road`).toBeGreaterThan(0);
      });

      it('does not lose lanes (permanent lanes present)', () => {
        const doc = parser.parse(readFixture(file));
        // At least one road must carry lane sections with real lanes. This guards
        // the dual-<lanes> fix: the permanent layer must survive even when a
        // temporary layer is present.
        const roadWithLanes = doc.roads.find((r) => {
          const sec = r.lanes[0];
          return sec && sec.leftLanes.length + sec.rightLanes.length > 0;
        });
        expect(
          roadWithLanes,
          `${file}: no road has non-empty permanent lanes (lanes lost?)`,
        ).toBeDefined();

        if (TEMP_LAYER_FIXTURES.has(file)) {
          // The temporary 1.9 layer must be parsed into the typed model on some road.
          const withTemp = doc.roads.some((r) => r.temporaryLanes !== undefined);
          expect(withTemp, `${file}: temporary lane layer not parsed`).toBe(true);
        }
      });

      it('round-trips: serialize -> reparse is structurally stable', () => {
        const doc = parser.parse(readFixture(file));
        const serialized = serializer.serializeFormatted(doc);
        const reparsed = parser.parse(serialized);

        expect(reparsed.roads.length, `${file}: road count changed`).toBe(doc.roads.length);
        expect(reparsed.junctions.length, `${file}: junction count changed`).toBe(
          doc.junctions.length,
        );

        // Road IDs stable (order-independent).
        expect(reparsed.roads.map((r) => r.id).sort()).toEqual(doc.roads.map((r) => r.id).sort());
        // Junction IDs stable.
        expect(reparsed.junctions.map((j) => j.id).sort()).toEqual(
          doc.junctions.map((j) => j.id).sort(),
        );

        if (VIRTUAL_JUNCTION_FIXTURES.has(file)) {
          const origVirtual = doc.junctions.filter((j) => j.type === 'virtual');
          expect(origVirtual.length, `${file}: expected a virtual junction`).toBeGreaterThan(0);

          for (const orig of origVirtual) {
            const round = reparsed.junctions.find((j) => j.id === orig.id);
            expect(round, `${file}: virtual junction ${orig.id} missing after round-trip`).toBeDefined();
            expect(round!.type).toBe('virtual');
            expect(round!.mainRoad).toBe(orig.mainRoad);
            if (orig.sStart !== undefined) {
              expect(round!.sStart).toBeCloseTo(orig.sStart, 6);
            }
            if (orig.sEnd !== undefined) {
              expect(round!.sEnd).toBeCloseTo(orig.sEnd, 6);
            }
            expect(round!.orientation).toBe(orig.orientation);
          }
        }
      });
    });
  }
});
