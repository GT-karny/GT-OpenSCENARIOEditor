/**
 * Regression test for FIX B1: virtual-junction attributes must round-trip.
 *
 * OpenDRIVE 1.9 t_junction_virtual carries @mainRoad/@sStart/@sEnd/@orientation.
 * Previously these were dropped on parse, producing schema-invalid output when a
 * virtual junction was loaded and saved again.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { XodrParser } from '../../parser/xodr-parser.js';
import { XodrSerializer } from '../../serializer/xodr-serializer.js';

const parser = new XodrParser();
const serializer = new XodrSerializer();

const VIRTUAL_JUNCTION_FIXTURE = resolve(
  __dirname,
  '../../../../../Thirdparty/GT_Sim/GT_esmini/test/odr_fixtures/handauthored/23_virtual_junction_17.xodr',
);

/** Minimal inline fallback if the GT_Sim fixture is unavailable. */
const INLINE_VIRTUAL_JUNCTION = `<?xml version="1.0" encoding="UTF-8"?>
<OpenDRIVE>
  <header revMajor="1" revMinor="7" name="virtual" date="2024-01-01"/>
  <road name="mainRoad" length="200" id="1" junction="-1">
    <link/>
    <planView>
      <geometry s="0" x="0" y="0" hdg="0" length="200"><line/></geometry>
    </planView>
    <elevationProfile/>
    <lateralProfile/>
    <lanes>
      <laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false"><width sOffset="0" a="3.5" b="0" c="0" d="0"/></lane></right>
      </laneSection>
    </lanes>
    <objects/>
    <signals/>
  </road>
  <junction name="virtualJunction" type="virtual" id="888" mainRoad="1" sStart="95" sEnd="105" orientation="+">
    <connection id="0" incomingRoad="1" connectingRoad="1" contactPoint="start">
      <laneLink from="-1" to="-1"/>
    </connection>
  </junction>
</OpenDRIVE>`;

describe('FIX B1 — virtual junction attribute round-trip', () => {
  function loadXml(): string {
    if (existsSync(VIRTUAL_JUNCTION_FIXTURE)) {
      return readFileSync(VIRTUAL_JUNCTION_FIXTURE, 'utf-8');
    }
    return INLINE_VIRTUAL_JUNCTION;
  }

  it('parses mainRoad/sStart/sEnd/orientation on a virtual junction', () => {
    const doc = parser.parse(loadXml());
    const virtual = doc.junctions.find((j) => j.type === 'virtual');
    expect(virtual).toBeDefined();
    expect(virtual!.mainRoad).toBe('1');
    expect(virtual!.sStart).toBeCloseTo(95, 6);
    expect(virtual!.sEnd).toBeCloseTo(105, 6);
    expect(virtual!.orientation).toBe('+');
  });

  it('preserves virtual-junction attributes through parse → serialize → reparse', () => {
    const doc = parser.parse(loadXml());
    const serialized = serializer.serializeFormatted(doc);
    const reparsed = parser.parse(serialized);

    const orig = doc.junctions.find((j) => j.type === 'virtual')!;
    const round = reparsed.junctions.find((j) => j.type === 'virtual')!;

    expect(round.mainRoad).toBe(orig.mainRoad);
    expect(round.sStart).toBeCloseTo(orig.sStart!, 6);
    expect(round.sEnd).toBeCloseTo(orig.sEnd!, 6);
    expect(round.orientation).toBe(orig.orientation);
  });

  it('does not emit virtual attributes for a plain junction', () => {
    const doc = parser.parse(INLINE_VIRTUAL_JUNCTION);
    // Add a plain default junction with no virtual attributes.
    doc.junctions.push({
      id: '999',
      name: 'plain',
      type: 'default',
      connections: [],
    });
    const serialized = serializer.serializeFormatted(doc);
    const reparsed = parser.parse(serialized);
    const plain = reparsed.junctions.find((j) => j.id === '999')!;
    expect(plain.mainRoad).toBeUndefined();
    expect(plain.sStart).toBeUndefined();
    expect(plain.sEnd).toBeUndefined();
    expect(plain.orientation).toBeUndefined();
  });
});
