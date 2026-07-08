/**
 * OpenDRIVE 1.9 (W5 fixup): <validity> @layer (e_layerType) on object/signal
 * laneValidity is modeled (OdrLaneValidity.layer) and the type carries an extra
 * bag, closing a silent attribute drop found by the W4 gap-matrix audit.
 */
import { describe, it, expect } from 'vitest';
import { XodrParser } from '../../parser/xodr-parser.js';
import { XodrSerializer } from '../../serializer/xodr-serializer.js';

const parser = new XodrParser();
const serializer = new XodrSerializer();

/** Minimal 1.9 road with one object carrying a `<validity>` (+ optional inner). */
function roadWithObjectValidity(validityXml: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OpenDRIVE>
  <header revMajor="1" revMinor="9" name="t" date="d"/>
  <road name="R" length="100" id="1" junction="-1">
    <link/>
    <planView><geometry s="0" x="0" y="0" hdg="0" length="100"><line/></geometry></planView>
    <elevationProfile/>
    <lateralProfile/>
    <lanes>
      <laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false"><width sOffset="0" a="3.5" b="0" c="0" d="0"/></lane></right>
      </laneSection>
    </lanes>
    <objects>
      <object id="o1" s="10" t="0" zOffset="0" type="pole" name="p" hdg="0" pitch="0" roll="0" length="0" width="0" height="1">
        ${validityXml}
      </object>
    </objects>
    <signals/>
  </road>
</OpenDRIVE>`;
}

const firstValidity = (xml: string) => parser.parse(xml).roads[0].objects[0].validity!;

describe('validity @layer (1.9)', () => {
  it('parses and round-trips <validity> @layer verbatim', () => {
    const xml = roadWithObjectValidity('<validity fromLane="-2" toLane="2" layer="permanent"/>');
    expect(firstValidity(xml)[0]).toMatchObject({ fromLane: -2, toLane: 2, layer: 'permanent' });

    const out = serializer.serializeFormatted(parser.parse(xml));
    expect(out).toContain('layer="permanent"');
    expect(firstValidity(out)[0]).toMatchObject({ fromLane: -2, toLane: 2, layer: 'permanent' });
  });

  it('omits @layer when absent (no spurious layer attribute)', () => {
    const xml = roadWithObjectValidity('<validity fromLane="-1" toLane="1"/>');
    expect(firstValidity(xml)[0].layer).toBeUndefined();
    expect(serializer.serializeFormatted(parser.parse(xml))).not.toContain('layer=');
  });

  it('rides an unknown validity attr through the extra bag', () => {
    const xml = roadWithObjectValidity('<validity fromLane="-1" toLane="1" futureAttr="xyz"/>');
    expect(firstValidity(xml)[0].extra?.attrs).toMatchObject({ futureAttr: 'xyz' });
    expect(serializer.serializeFormatted(parser.parse(xml))).toContain('futureAttr="xyz"');
  });
});
