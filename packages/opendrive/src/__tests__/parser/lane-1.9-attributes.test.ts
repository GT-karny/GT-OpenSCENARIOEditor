/**
 * OpenDRIVE 1.9 Phase-2 (Wave W1) lane-domain modeling: round-trip coverage for
 * the newly typed content — lane attributes (direction, advisory, the dynamic
 * flags, roadWorks), lane-link multiplicity, access <restriction> children,
 * laneSection @length, special speed @max literals, and the restricted
 * center-lane content model.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { XodrParser } from '../../parser/xodr-parser.js';
import { XodrSerializer } from '../../serializer/xodr-serializer.js';

const parser = new XodrParser();
const serializer = new XodrSerializer();

const MULTIPLICITY_FIXTURE = resolve(
  __dirname,
  '../../../../../test-fixtures/opendrive-v1.9/GT_min_lanelink_multiplicity.xodr',
);

/** Wrap a `<lanes>` inner body (and optional road `<type>`) in a minimal 1.9 road. */
function roadXml(lanesInner: string, typeInner = ''): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OpenDRIVE>
  <header revMajor="1" revMinor="9" name="t" date="d"/>
  <road rule="RHT" name="R" length="100" id="1" junction="-1">
    <link/>
    ${typeInner}
    <planView><geometry s="0" x="0" y="0" hdg="0" length="100"><line/></geometry></planView>
    <elevationProfile/>
    <lateralProfile/>
    <lanes>${lanesInner}</lanes>
    <objects/>
    <signals/>
  </road>
</OpenDRIVE>`;
}

const firstRightLane = (xml: string) =>
  parser.parse(xml).roads[0].lanes[0].rightLanes[0];

describe('1.9 lane attributes (direction/advisory/dynamic*/roadWorks)', () => {
  const xml = roadXml(`
    <laneSection s="0">
      <center><lane id="0" type="none" level="false"/></center>
      <right>
        <lane id="-1" type="driving" advisory="both" direction="reversed"
              dynamicLaneType="true" dynamicLaneDirection="false" roadWorks="true" level="false">
          <width sOffset="0" a="3.5" b="0" c="0" d="0"/>
        </lane>
      </right>
    </laneSection>`);

  it('parses each new attribute into its typed field', () => {
    const lane = firstRightLane(xml);
    expect(lane.advisory).toBe('both');
    expect(lane.direction).toBe('reversed');
    expect(lane.dynamicLaneType).toBe(true);
    expect(lane.dynamicLaneDirection).toBe(false);
    expect(lane.roadWorks).toBe(true);
  });

  it('re-emits the attributes on round-trip', () => {
    const out = serializer.serializeFormatted(parser.parse(xml));
    expect(out).toContain('advisory="both"');
    expect(out).toContain('direction="reversed"');
    expect(out).toContain('dynamicLaneType="true"');
    expect(out).toContain('dynamicLaneDirection="false"');
    expect(out).toContain('roadWorks="true"');
    const re = parser.parse(out).roads[0].lanes[0].rightLanes[0];
    expect(re).toMatchObject({
      advisory: 'both',
      direction: 'reversed',
      dynamicLaneType: true,
      dynamicLaneDirection: false,
      roadWorks: true,
    });
  });

  it('leaves an out-of-enum direction untyped but round-trips it via extra', () => {
    const bad = roadXml(`
      <laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" direction="sideways" level="false">
          <width sOffset="0" a="3.5" b="0" c="0" d="0"/></lane></right>
      </laneSection>`);
    const lane = firstRightLane(bad);
    expect(lane.direction).toBeUndefined();
    const out = serializer.serializeFormatted(parser.parse(bad));
    expect(out).toContain('direction="sideways"');
  });
});

describe('1.9 lane access restrictions', () => {
  const xml = roadXml(`
    <laneSection s="0">
      <center><lane id="0" type="none" level="false"/></center>
      <right>
        <lane id="-1" type="driving" level="false">
          <width sOffset="0" a="3.5" b="0" c="0" d="0"/>
          <access sOffset="0" rule="deny" restriction="autonomousTraffic">
            <restriction type="bus"/>
            <restriction type="taxi"/>
          </access>
        </lane>
      </right>
    </laneSection>`);

  it('parses @restriction plus <restriction> children', () => {
    const access = firstRightLane(xml).access![0];
    expect(access.rule).toBe('deny');
    expect(access.restriction).toBe('autonomousTraffic');
    expect(access.restrictions).toEqual([{ type: 'bus' }, { type: 'taxi' }]);
  });

  it('round-trips the restriction children', () => {
    const out = serializer.serializeFormatted(parser.parse(xml));
    expect(out).toContain('<restriction type="bus"');
    expect(out).toContain('<restriction type="taxi"');
    const re = parser.parse(out).roads[0].lanes[0].rightLanes[0].access![0];
    expect(re.restrictions).toEqual([{ type: 'bus' }, { type: 'taxi' }]);
  });

  it('omits @restriction entirely when absent (no empty restriction="")', () => {
    const noAttr = roadXml(`
      <laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false">
          <width sOffset="0" a="3.5" b="0" c="0" d="0"/>
          <access sOffset="0" rule="allow"><restriction type="pedestrian"/></access>
        </lane></right>
      </laneSection>`);
    const access = firstRightLane(noAttr).access![0];
    expect(access.restriction).toBeUndefined();
    const out = serializer.serializeFormatted(parser.parse(noAttr));
    expect(out).not.toContain('restriction=""');
    expect(out).toContain('<restriction type="pedestrian"');
  });

  it('rides an <access> userData child through the extra bag', () => {
    const xml = roadXml(`
      <laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false">
          <width sOffset="0" a="3.5" b="0" c="0" d="0"/>
          <access sOffset="0" rule="deny" restriction="bus"><userData code="x" value="y"/></access>
        </lane></right>
      </laneSection>`);
    const access = firstRightLane(xml).access![0];
    expect(access.extra?.children?.some((c) => c.name === 'userData')).toBe(true);
    expect(serializer.serializeFormatted(parser.parse(xml))).toContain('<userData');
  });

  it('rides an out-of-enum @rule through the extra bag', () => {
    const xml = roadXml(`
      <laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false">
          <width sOffset="0" a="3.5" b="0" c="0" d="0"/>
          <access sOffset="0" rule="maybe"><restriction type="bus"/></access>
        </lane></right>
      </laneSection>`);
    const access = firstRightLane(xml).access![0];
    expect(access.rule).toBeUndefined();
    expect(access.extra?.attrs).toMatchObject({ rule: 'maybe' });
    expect(serializer.serializeFormatted(parser.parse(xml))).toContain('rule="maybe"');
  });

  it('accepts a <restriction> without @type and emits no type=""', () => {
    const xml = roadXml(`
      <laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false">
          <width sOffset="0" a="3.5" b="0" c="0" d="0"/>
          <access sOffset="0" rule="allow"><restriction/></access>
        </lane></right>
      </laneSection>`);
    expect(firstRightLane(xml).access![0].restrictions![0].type).toBeUndefined();
    expect(serializer.serializeFormatted(parser.parse(xml))).not.toContain('type=""');
  });
});

describe('lane-link multiplicity + @layer (GT_min_lanelink_multiplicity fixture)', () => {
  const src = readFileSync(MULTIPLICITY_FIXTURE, 'utf-8');

  it('captures every <predecessor> with its @layer and preserves them on round-trip', () => {
    const doc = parser.parse(src);
    const lane = doc.roads[0].lanes[1].rightLanes[0];
    expect(lane.link?.predecessors).toEqual([
      { id: -1, layer: 'permanent' },
      { id: -2, layer: 'permanent' },
    ]);
    expect(lane.link?.successors).toEqual([]);

    const out = serializer.serializeFormatted(doc);
    expect((out.match(/<predecessor /g) ?? []).length).toBe(2);
    expect((out.match(/layer="permanent"/g) ?? []).length).toBe(2);

    const re = parser.parse(out).roads[0].lanes[1].rightLanes[0];
    expect(re.link?.predecessors).toEqual([
      { id: -1, layer: 'permanent' },
      { id: -2, layer: 'permanent' },
    ]);
  });

  it('carries an out-of-enum lane-link @layer string verbatim (xs:string)', () => {
    const xml = roadXml(`
      <laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false">
          <link><predecessor id="-1" layer="custom_layer"/></link>
          <width sOffset="0" a="3.5" b="0" c="0" d="0"/>
        </lane></right>
      </laneSection>`);
    expect(firstRightLane(xml).link?.predecessors).toEqual([{ id: -1, layer: 'custom_layer' }]);

    const out = serializer.serializeFormatted(parser.parse(xml));
    expect(out).toContain('layer="custom_layer"');
    const re = parser.parse(out).roads[0].lanes[0].rightLanes[0];
    expect(re.link?.predecessors).toEqual([{ id: -1, layer: 'custom_layer' }]);
  });
});

describe('lane-link @layer distinguishes same-id links (Ex_Lane_MultiLaneLayer)', () => {
  const FIXTURE = resolve(
    __dirname,
    '../../../../../test-fixtures/opendrive-v1.9/Ex_Lane_MultiLaneLayer.xodr',
  );

  it('round-trips same-id successors that differ only by @layer, verbatim', () => {
    const doc = parser.parse(readFileSync(FIXTURE, 'utf-8'));
    const road = doc.roads.find((r) => r.id === '1')!;
    // Median lane -1 links to lane -1 in BOTH the permanent and temporary layer.
    expect(road.lanes[0].rightLanes[0].link?.successors).toEqual([
      { id: -1, layer: 'permanent' },
      { id: -1, layer: 'temporary' },
    ]);

    const re = parser.parse(serializer.serializeFormatted(doc)).roads.find((r) => r.id === '1')!;
    expect(re.lanes[0].rightLanes[0].link?.successors).toEqual([
      { id: -1, layer: 'permanent' },
      { id: -1, layer: 'temporary' },
    ]);
  });
});

describe('special speed @max literals', () => {
  it('preserves "no limit" verbatim on road-type speed (not on lanes)', () => {
    const doc = parser.parse(readFileSync(MULTIPLICITY_FIXTURE, 'utf-8'));
    const road = doc.roads[0];
    expect(road.type?.[0].speed?.max).toBe('no limit');

    const out = serializer.serializeFormatted(doc);
    // Only the road-type speed carries the literal — no lane speed does.
    expect((out.match(/max="no limit"/g) ?? []).length).toBe(1);

    const re = parser.parse(out).roads[0];
    expect(re.type?.[0].speed?.max).toBe('no limit');
  });

  it('rejects a special literal on a LANE speed (schema-invalid): 0 + warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const xml = roadXml(`
      <laneSection s="0">
        <center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false">
          <width sOffset="0" a="3.5" b="0" c="0" d="0"/>
          <speed sOffset="0" max="no limit" unit="m/s"/>
        </lane></right>
      </laneSection>`);
    expect(firstRightLane(xml).speed?.[0].max).toBe(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('laneSection @length (temporary layer)', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenDRIVE>
  <header revMajor="1" revMinor="9" name="t" date="d"/>
  <road name="R" length="100" id="1" junction="-1">
    <link/>
    <planView><geometry s="0" x="0" y="0" hdg="0" length="100"><line/></geometry></planView>
    <elevationProfile/>
    <lateralProfile/>
    <lanes layer="permanent">
      <laneSection s="0"><center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false"><width sOffset="0" a="3.5" b="0" c="0" d="0"/></lane></right>
      </laneSection>
    </lanes>
    <lanes layer="temporary">
      <laneSection s="0" length="50"><center><lane id="0" type="none" level="false"/></center>
        <right><lane id="-1" type="driving" level="false"><width sOffset="0" a="3.5" b="0" c="0" d="0"/></lane></right>
      </laneSection>
    </lanes>
    <objects/>
    <signals/>
  </road>
</OpenDRIVE>`;

  it('consumes @length into the typed field and round-trips it', () => {
    const doc = parser.parse(xml);
    expect(doc.roads[0].temporaryLanes?.sections[0].length).toBe(50);
    const out = serializer.serializeFormatted(doc);
    expect(out).toContain('length="50"');
    const re = parser.parse(out);
    expect(re.roads[0].temporaryLanes?.sections[0].length).toBe(50);
  });
});

describe('center-lane restricted content model (1.9)', () => {
  it('emits only link + roadMark, dropping content the XSD forbids on center', () => {
    const xml = roadXml(`
      <laneSection s="0">
        <center><lane id="0" type="driving" level="false">
          <roadMark sOffset="0" type="solid" color="standard"/>
        </lane></center>
        <right><lane id="-1" type="driving" level="false">
          <width sOffset="0" a="3.5" b="0" c="0" d="0"/></lane></right>
      </laneSection>`);
    const doc = parser.parse(xml);
    // Inject content that the center content model (link + roadMark only) forbids.
    doc.roads[0].lanes[0].centerLane.width = [{ sOffset: 0, a: 1, b: 0, c: 0, d: 0 }];
    doc.roads[0].lanes[0].centerLane.speed = [{ sOffset: 0, max: 30, unit: 'm/s' }];

    const out = serializer.serializeFormatted(doc);
    const centerBlock = out.slice(out.indexOf('<center>'), out.indexOf('</center>'));
    expect(centerBlock).toContain('type="solid"'); // roadMark kept
    expect(centerBlock).not.toContain('<width'); // width dropped
    expect(centerBlock).not.toContain('<speed'); // speed dropped
  });
});
