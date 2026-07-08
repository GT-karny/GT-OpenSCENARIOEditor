/**
 * OpenDRIVE 1.9 Phase-2 (Wave W2) junction domain + crossSectionSurface:
 * round-trip coverage for the newly typed content — junction @type (4-type
 * union), <crossPath>, <roadSection>, connection @type, laneLink
 * @overlapZone/@fromLayer/@toLayer, and the <crossSectionSurface> strip system.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { XodrParser } from '../../parser/xodr-parser.js';
import { XodrSerializer } from '../../serializer/xodr-serializer.js';

const parser = new XodrParser();
const serializer = new XodrSerializer();
const FIXTURES_DIR = resolve(__dirname, '../../../../../test-fixtures/opendrive-v1.9');
const read = (f: string) => readFileSync(resolve(FIXTURES_DIR, f), 'utf-8');

/** Wrap junction XML in a minimal 1.9 document (with one trivial road). */
function odrWithJunction(junctionXml: string): string {
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
    <objects/>
    <signals/>
  </road>
  ${junctionXml}
</OpenDRIVE>`;
}

const firstJunction = (xml: string) => parser.parse(xml).junctions[0];
const roundTrip = (xml: string) => serializer.serializeFormatted(parser.parse(xml));
const CONNECTION = `<connection id="0" incomingRoad="1" connectingRoad="1" contactPoint="start"><laneLink from="-1" to="-1"/></connection>`;

describe('junction @type (4-type union)', () => {
  it('is undefined when @type is absent (common default)', () => {
    expect(firstJunction(odrWithJunction(`<junction id="9" name="j">${CONNECTION}</junction>`)).type).toBeUndefined();
  });

  for (const type of ['default', 'direct', 'crossing'] as const) {
    it(`round-trips @type="${type}"`, () => {
      // crossing requires a <roadSection> (minOccurs=1); others carry a connection.
      const body =
        type === 'crossing' ? `<roadSection id="0" roadId="1" sStart="10" sEnd="20"/>` : CONNECTION;
      const xml = odrWithJunction(`<junction id="9" name="j" type="${type}">${body}</junction>`);
      expect(firstJunction(xml).type).toBe(type);
      expect(parser.parse(roundTrip(xml)).junctions[0].type).toBe(type);
    });
  }

  it('preserves an unrecognized @type via extra with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const xml = odrWithJunction(`<junction id="9" name="j" type="roundabout">${CONNECTION}</junction>`);
    expect(firstJunction(xml).type).toBeUndefined();
    expect(warn).toHaveBeenCalled();
    expect(roundTrip(xml)).toContain('type="roundabout"');
    warn.mockRestore();
  });
});

describe('junction crossing <roadSection> (typed)', () => {
  it('round-trips id/roadId/sStart/sEnd', () => {
    const xml = odrWithJunction(
      `<junction id="9" name="j" type="crossing"><roadSection id="rs0" roadId="1" sStart="10" sEnd="20"/></junction>`,
    );
    expect(firstJunction(xml).roadSections![0]).toMatchObject({
      id: 'rs0',
      roadId: '1',
      sStart: 10,
      sEnd: 20,
    });
    expect(parser.parse(roundTrip(xml)).junctions[0].roadSections![0]).toMatchObject({
      id: 'rs0',
      roadId: '1',
      sStart: 10,
      sEnd: 20,
    });
  });
});

describe('junction <crossPath> + connection laneLink attrs (GT_21 fixture)', () => {
  const src = read('GT_21_common_junction_crosspath_19.xodr');

  it('parses crossPath attrs + start/end laneLinks', () => {
    const cp = parser.parse(src).junctions[0].crossPaths![0];
    expect(cp).toMatchObject({ id: '0', crossingRoad: '2', roadAtStart: '1', roadAtEnd: '1' });
    expect(cp.startLaneLink).toMatchObject({ s: 59, from: 2, to: -1 });
    expect(cp.endLaneLink).toMatchObject({ s: 59, from: -2, to: -1 });
  });

  it('parses connection laneLink @overlapZone/@fromLayer/@toLayer', () => {
    const ll = parser.parse(src).junctions[0].connections[0].laneLinks[0];
    expect(ll).toMatchObject({
      from: -1,
      to: -1,
      overlapZone: 0.5,
      fromLayer: 'permanent',
      toLayer: 'permanent',
    });
  });

  it('round-trips crossPath + laneLink attrs verbatim', () => {
    const out = roundTrip(src);
    expect(out).toContain('crossingRoad="2"');
    expect(out).toContain('<startLaneLink');
    expect(out).toContain('overlapZone="0.5"');
    expect(out).toContain('fromLayer="permanent"');
    const j = parser.parse(out).junctions[0];
    expect(j.crossPaths![0].startLaneLink.from).toBe(2);
    expect(j.connections[0].laneLinks[0].overlapZone).toBe(0.5);
    expect(j.connections[0].laneLinks[0].fromLayer).toBe('permanent');
  });
});

describe('connection @type', () => {
  it('round-trips a virtual connection @type="virtual"', () => {
    const xml = odrWithJunction(
      `<junction id="9" name="j" type="virtual" mainRoad="1" sStart="10" sEnd="20"><connection id="0" incomingRoad="1" connectingRoad="1" contactPoint="start" type="virtual"><laneLink from="-1" to="-1"/></connection></junction>`,
    );
    expect(firstJunction(xml).connections[0].type).toBe('virtual');
    expect(parser.parse(roundTrip(xml)).junctions[0].connections[0].type).toBe('virtual');
  });
});

describe('junction virtual-attrs schema guard (serializer)', () => {
  const VIRTUAL = odrWithJunction(
    `<junction id="9" name="j" type="virtual" mainRoad="1" sStart="10" sEnd="20" orientation="+"><connection id="0" incomingRoad="1" connectingRoad="1" contactPoint="start"><laneLink from="-1" to="-1"/></connection></junction>`,
  );

  it('emits virtual attrs only for a virtual junction', () => {
    expect(roundTrip(VIRTUAL)).toContain('mainRoad="1"');
  });

  it('drops stale virtual attrs when the type is switched away from virtual', () => {
    const doc = parser.parse(VIRTUAL);
    // Simulate a UI type switch that left the virtual attrs on the model.
    doc.junctions[0].type = 'default';
    const out = serializer.serializeFormatted(doc);
    expect(out).not.toContain('mainRoad="1"');
    expect(out).not.toContain('sStart="10"');
    expect(out).not.toContain('sEnd="20"');
    expect(out).not.toContain('orientation="+"');
  });
});

describe('connection emit tightening', () => {
  it('a direct-junction connection emits no connectingRoad="" and preserves @linkedRoad', () => {
    const xml = odrWithJunction(
      `<junction id="9" name="j" type="direct"><connection id="0" incomingRoad="1" linkedRoad="2" contactPoint="start"><laneLink from="-1" to="-1"/></connection></junction>`,
    );
    // @linkedRoad is typed (t_junction_connection_direct/@linkedRoad).
    expect(firstJunction(xml).connections[0].linkedRoad).toBe('2');
    const out = roundTrip(xml);
    expect(out).not.toContain('connectingRoad=""');
    expect(out).toContain('linkedRoad="2"');
    // Typed round-trip: no longer riding through extra.
    const conn = parser.parse(out).junctions[0].connections[0];
    expect(conn.linkedRoad).toBe('2');
    expect(conn.extra?.attrs?.linkedRoad).toBeUndefined();
  });
});

describe('crossSectionSurface (Ex_CrossSectionSurface fixture)', () => {
  const src = read('Ex_CrossSectionSurface_CrossFall_LeftTurn_1.xodr');

  it('parses typed strips (@id) and preserves tOffset + polynomial leaves', () => {
    const css = parser.parse(src).roads[0].crossSectionSurface!;
    expect(css).toBeDefined();
    expect(css.strips.map((s) => s.id)).toEqual([1, 2, -1]);
    expect(css.tOffset).toBeDefined();
    // strip 1 carries its <width>/<constant> polynomial children in extra.
    expect(css.strips[0].extra?.children?.map((c) => c.name).sort()).toEqual(['constant', 'width']);
  });

  it('round-trips the crossSectionSurface subtree losslessly', () => {
    const out = roundTrip(src);
    expect(out).toContain('<crossSectionSurface');
    expect(out).toContain('<surfaceStrips');
    expect(out).toContain('<strip id="1"');
    expect(out).toContain('<tOffset');
    expect(out).toContain('<coefficients');
    expect(parser.parse(out).roads[0].crossSectionSurface!.strips.map((s) => s.id)).toEqual([1, 2, -1]);
  });

  it('warns when crossSectionSurface coexists with superelevation (XSD assert)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenDRIVE>
  <header revMajor="1" revMinor="9" name="t" date="d"/>
  <road name="R" length="100" id="1" junction="-1">
    <link/>
    <planView><geometry s="0" x="0" y="0" hdg="0" length="100"><line/></geometry></planView>
    <elevationProfile/>
    <lateralProfile>
      <superelevation s="0" a="0" b="0" c="0" d="0"/>
      <crossSectionSurface>
        <surfaceStrips><strip id="1"><constant><coefficients s="0" a="0"/></constant></strip></surfaceStrips>
      </crossSectionSurface>
    </lateralProfile>
    <lanes>
      <laneSection s="0"><center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false"><width sOffset="0" a="3.5" b="0" c="0" d="0"/></lane></right>
      </laneSection>
    </lanes>
    <objects/>
    <signals/>
  </road>
</OpenDRIVE>`;
    parser.parse(xml);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
