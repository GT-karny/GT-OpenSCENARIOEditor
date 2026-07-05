/**
 * Regression test for FIX B2: dual <lanes> layer (permanent + temporary).
 *
 * OpenDRIVE 1.9 permits up to two <lanes> elements per road (permanent +
 * temporary). Previously the parser read raw.lanes as a single object, so when
 * fast-xml-parser yielded an array (two layers) ALL lanes were lost. The fix
 * parses the permanent layer normally and preserves the temporary layer raw.
 */

import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { XodrParser } from '../../parser/xodr-parser.js';
import { XodrSerializer } from '../../serializer/xodr-serializer.js';

const parser = new XodrParser();
const serializer = new XodrSerializer();

const DUAL_LANES_FIXTURE = resolve(
  __dirname,
  '../../../../../Thirdparty/GT_Sim/GT_esmini/test/odr_fixtures/generated/g2_lanes_layer_19.xodr',
);

/** Single-layer road — behavior must be unchanged (no regression). */
const SINGLE_LANES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<OpenDRIVE>
  <header revMajor="1" revMinor="7" name="single" date="2024-01-01"/>
  <road name="R1" length="100" id="1" junction="-1">
    <link/>
    <planView>
      <geometry s="0" x="0" y="0" hdg="0" length="100"><line/></geometry>
    </planView>
    <elevationProfile/>
    <lateralProfile/>
    <lanes>
      <laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right>
          <lane id="-1" type="driving" level="false"><width sOffset="0" a="3.5" b="0" c="0" d="0"/></lane>
          <lane id="-2" type="driving" level="false"><width sOffset="0" a="3.5" b="0" c="0" d="0"/></lane>
        </right>
      </laneSection>
    </lanes>
    <objects/>
    <signals/>
  </road>
</OpenDRIVE>`;

/** Dual-layer inline fallback (permanent + temporary). */
const DUAL_LANES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<OpenDRIVE>
  <header revMajor="1" revMinor="9" name="dual" date="2024-01-01"/>
  <road name="R1" length="500" id="1" junction="-1">
    <link/>
    <planView>
      <geometry s="0" x="0" y="0" hdg="0" length="500"><line/></geometry>
    </planView>
    <elevationProfile/>
    <lateralProfile/>
    <lanes layer="permanent">
      <laneSection s="0">
        <center><lane id="0" type="driving" level="false"/></center>
        <left><lane id="1" type="driving" level="false"><width sOffset="0" a="3.0" b="0" c="0" d="0"/></lane></left>
        <right><lane id="-1" type="driving" level="false"><width sOffset="0" a="3.0" b="0" c="0" d="0"/></lane></right>
      </laneSection>
    </lanes>
    <lanes layer="temporary">
      <laneSection s="0" length="500">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false"><width sOffset="0" a="3.5" b="0" c="0" d="0"/></lane></right>
      </laneSection>
    </lanes>
    <objects/>
    <signals/>
  </road>
</OpenDRIVE>`;

describe('FIX B2 — dual <lanes> layer', () => {
  it('single-layer road still parses all lanes (no regression)', () => {
    const doc = parser.parse(SINGLE_LANES_XML);
    const road = doc.roads[0];
    expect(road.lanes).toHaveLength(1);
    expect(road.lanes[0].rightLanes).toHaveLength(2);
    expect(road.temporaryLanesRaw).toBeUndefined();
  });

  it('single-layer road serializes without a @layer attribute (byte-shape unchanged)', () => {
    const doc = parser.parse(SINGLE_LANES_XML);
    const serialized = serializer.serializeFormatted(doc);
    expect(serialized).not.toContain('layer=');
  });

  it('dual-layer road parses the permanent lanes (NOT zero lanes)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const xml = existsSync(DUAL_LANES_FIXTURE)
      ? readFileSync(DUAL_LANES_FIXTURE, 'utf-8')
      : DUAL_LANES_XML;
    const doc = parser.parse(xml);
    const road = doc.roads[0];

    // Permanent lanes must be present (the bug produced zero lane sections).
    expect(road.lanes.length).toBeGreaterThan(0);
    const totalLanes =
      road.lanes[0].leftLanes.length + road.lanes[0].rightLanes.length;
    expect(totalLanes).toBeGreaterThan(0);

    // Temporary layer preserved raw + warning emitted.
    expect(road.temporaryLanesRaw).toBeDefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('round-trips the temporary layer (re-emits both <lanes> elements)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const doc = parser.parse(DUAL_LANES_XML);
    const serialized = serializer.serializeFormatted(doc);

    // Both layers present in output.
    expect(serialized).toContain('layer="permanent"');
    expect(serialized).toContain('layer="temporary"');

    // Reparse: permanent lanes intact, temporary still preserved.
    const reparsed = parser.parse(serialized);
    const road = reparsed.roads[0];
    expect(road.lanes.length).toBeGreaterThan(0);
    const totalLanes =
      road.lanes[0].leftLanes.length + road.lanes[0].rightLanes.length;
    expect(totalLanes).toBeGreaterThan(0);
    expect(road.temporaryLanesRaw).toBeDefined();
    warn.mockRestore();
  });
});
