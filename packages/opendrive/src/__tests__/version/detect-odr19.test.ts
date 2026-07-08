/**
 * OpenDRIVE 1.9 construct detection + version-resolving serializer output.
 * Each 1.9 construct is detected; a clean pre-1.9 document detects nothing;
 * `resolveVersion` bumps the emitted @revMinor while leaving the default path
 * (and thus idempotence) untouched.
 */
import { describe, it, expect } from 'vitest';
import { XodrParser } from '../../parser/xodr-parser.js';
import { XodrSerializer } from '../../serializer/xodr-serializer.js';
import { detectOdr19Constructs, willResolveToOdr19 } from '../../version/detect-odr19.js';

const parser = new XodrParser();
const serializer = new XodrSerializer();

/**
 * Wrap body XML in a minimal document with a chosen header minor. `road`
 * defaults to a plain drivable road; extra top-level content (junctions) can be
 * appended via `tail`.
 */
function doc(opts: {
  minor?: number;
  road?: string;
  tail?: string;
}): string {
  const minor = opts.minor ?? 6;
  const road =
    opts.road ??
    `<road name="R" length="100" id="1" junction="-1">
      <link/>
      <planView><geometry s="0" x="0" y="0" hdg="0" length="100"><line/></geometry></planView>
      <elevationProfile/><lateralProfile/>
      <lanes><laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false"><width sOffset="0" a="3.5" b="0" c="0" d="0"/></lane></right>
      </laneSection></lanes>
      <objects/><signals/>
    </road>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<OpenDRIVE>
  <header revMajor="1" revMinor="${minor}" name="t" date="d"/>
  ${road}
  ${opts.tail ?? ''}
</OpenDRIVE>`;
}

const constructs = (xml: string) => detectOdr19Constructs(parser.parse(xml));

describe('detectOdr19Constructs', () => {
  it('returns [] for a clean pre-1.9 document', () => {
    expect(constructs(doc({}))).toEqual([]);
  });

  it('detects a crossing junction + its roadSection', () => {
    const found = constructs(
      doc({
        tail: `<junction id="9" name="j" type="crossing"><roadSection id="0" roadId="1" sStart="10" sEnd="20"/></junction>`,
      }),
    );
    expect(found).toContain('crossing junction');
    expect(found).toContain('junction roadSection');
  });

  it('detects a direct junction via connection @linkedRoad', () => {
    const found = constructs(
      doc({
        tail: `<junction id="9" name="j" type="direct"><connection id="0" incomingRoad="1" linkedRoad="2" contactPoint="start"><laneLink from="-1" to="-1"/></connection></junction>`,
      }),
    );
    expect(found).toContain('direct junction');
  });

  it('detects a virtual junction + virtual connection', () => {
    const found = constructs(
      doc({
        tail: `<junction id="9" name="j" type="virtual" mainRoad="1" sStart="0" sEnd="5"><connection id="0" incomingRoad="1" connectingRoad="1" contactPoint="start" type="virtual"><laneLink from="-1" to="-1"/></connection></junction>`,
      }),
    );
    expect(found).toContain('virtual junction');
    expect(found).toContain('virtual connection');
  });

  it('detects laneLink overlapZone/layer', () => {
    const found = constructs(
      doc({
        tail: `<junction id="9" name="j" type="direct"><connection id="0" incomingRoad="1" linkedRoad="2" contactPoint="start"><laneLink from="-1" to="-1" overlapZone="5" fromLayer="temporary"/></connection></junction>`,
      }),
    );
    expect(found).toContain('connection laneLink overlapZone');
    expect(found).toContain('connection laneLink layer');
  });

  it('detects lane direction/roadWorks and a 1.9 lane type', () => {
    const road = `<road name="R" length="100" id="1" junction="-1">
      <link/>
      <planView><geometry s="0" x="0" y="0" hdg="0" length="100"><line/></geometry></planView>
      <elevationProfile/><lateralProfile/>
      <lanes><laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="walking" level="false" direction="reversed" roadWorks="true"><width sOffset="0" a="3.5" b="0" c="0" d="0"/></lane></right>
      </laneSection></lanes>
      <objects/><signals/>
    </road>`;
    const found = constructs(doc({ road }));
    expect(found).toContain('lane direction');
    expect(found).toContain('lane roadWorks');
    expect(found).toContain('lane type "walking"');
  });

  it('detects lane access restrictions', () => {
    const road = `<road name="R" length="100" id="1" junction="-1">
      <link/>
      <planView><geometry s="0" x="0" y="0" hdg="0" length="100"><line/></geometry></planView>
      <elevationProfile/><lateralProfile/>
      <lanes><laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false"><width sOffset="0" a="3.5" b="0" c="0" d="0"/><access sOffset="0" rule="deny"><restriction type="truck"/></access></lane></right>
      </laneSection></lanes>
      <objects/><signals/>
    </road>`;
    expect(constructs(doc({ road }))).toContain('lane access restrictions');
  });

  it('detects a road-type speed literal', () => {
    const road = `<road name="R" length="100" id="1" junction="-1">
      <link/>
      <type s="0" type="motorway"><speed max="no limit"/></type>
      <planView><geometry s="0" x="0" y="0" hdg="0" length="100"><line/></geometry></planView>
      <elevationProfile/><lateralProfile/>
      <lanes><laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false"><width sOffset="0" a="3.5" b="0" c="0" d="0"/></lane></right>
      </laneSection></lanes>
      <objects/><signals/>
    </road>`;
    expect(constructs(doc({ road }))).toContain('road-type speed literal');
  });

  it('detects validity @layer on a signal', () => {
    const road = `<road name="R" length="100" id="1" junction="-1">
      <link/>
      <planView><geometry s="0" x="0" y="0" hdg="0" length="100"><line/></geometry></planView>
      <elevationProfile/><lateralProfile/>
      <lanes><laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false"><width sOffset="0" a="3.5" b="0" c="0" d="0"/></lane></right>
      </laneSection></lanes>
      <objects/>
      <signals><signal id="s1" s="10" t="0" name="" dynamic="no" orientation="+" zOffset="0" country="DEU" type="1" subtype="-1" value="0" unit="km/h" height="0" width="0"><validity fromLane="-1" toLane="-1" layer="temporary"/></signal></signals>
    </road>`;
    expect(constructs(doc({ road }))).toContain('validity layer');
  });
});

describe('resolveVersion serializer output', () => {
  const XML_16_WITH_19 = doc({
    minor: 6,
    tail: `<junction id="9" name="j" type="crossing"><roadSection id="0" roadId="1" sStart="10" sEnd="20"/></junction>`,
  });

  it('willResolveToOdr19 is true for a 1.6 header with 1.9 content', () => {
    expect(willResolveToOdr19(parser.parse(XML_16_WITH_19))).toBe(true);
  });

  it('bumps revMinor to 9 when resolveVersion is set', () => {
    const out = serializer.serializeFormatted(parser.parse(XML_16_WITH_19), {
      resolveVersion: true,
    });
    expect(out).toContain('revMinor="9"');
    expect(out).not.toContain('revMinor="6"');
  });

  it('keeps the declared version verbatim without the option', () => {
    const out = serializer.serializeFormatted(parser.parse(XML_16_WITH_19));
    expect(out).toContain('revMinor="6"');
  });

  it('does not bump a clean 1.6 document even with the option', () => {
    const parsed = parser.parse(doc({ minor: 6 }));
    expect(willResolveToOdr19(parsed)).toBe(false);
    const out = serializer.serializeFormatted(parsed, { resolveVersion: true });
    expect(out).toContain('revMinor="6"');
  });
});
