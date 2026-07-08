/**
 * OpenDRIVE 1.9 Phase-4 (Wave X4): typed signal <semantics> (t_signals_semantics).
 * Round-trip coverage for the flattened entry model — kinds, typed attributes,
 * participant categories, empty block, and unknown-child passthrough via extra.
 */
import { describe, it, expect, vi } from 'vitest';
import { XodrParser } from '../../parser/xodr-parser.js';
import { XodrSerializer } from '../../serializer/xodr-serializer.js';
import type { OdrSignalSemantics, OdrSemanticsEntry } from '@osce/shared';

const parser = new XodrParser();
const serializer = new XodrSerializer();

/** Wrap a <signal> in a minimal 1.9 document with one trivial road. */
function odrWithSignal(signalXml: string): string {
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
    <signals>
      <signal id="100" name="S" s="10" t="-5" zOffset="2" orientation="+" dynamic="no" type="274" subtype="50">
        ${signalXml}
      </signal>
    </signals>
  </road>
</OpenDRIVE>`;
}

const firstSignal = (xml: string) => parser.parse(xml).roads[0].signals![0];
const semanticsOf = (xml: string): OdrSignalSemantics => firstSignal(xml).semantics!;
const roundTrip = (xml: string) => serializer.serializeFormatted(parser.parse(xml));

const RICH = `<semantics>
  <speed type="maximum" value="50" unit="km/h"/>
  <lane type="noOvertakeTrucks"/>
  <priority type="priorityRoad"/>
  <prohibited>
    <animal/>
    <vehicle><type>heavyTruck</type></vehicle>
  </prohibited>
  <supplementaryTime type="time" value="8"/>
  <supplementaryAllows><person><type>pedestrian</type></person></supplementaryAllows>
  <supplementaryDistance type="for" value="300" unit="m"/>
  <supplementaryEnvironment type="rain"/>
</semantics>`;

describe('signal <semantics> parse', () => {
  it('flattens every kind into an ordered entries array', () => {
    const sem = semanticsOf(odrWithSignal(RICH));
    expect(sem.entries.map((e) => e.kind)).toEqual([
      'speed',
      'lane',
      'priority',
      'prohibited',
      'supplementaryTime',
      'supplementaryAllows',
      'supplementaryDistance',
      'supplementaryEnvironment',
    ]);
  });

  it('parses typed speed attributes', () => {
    const speed = semanticsOf(odrWithSignal(RICH)).entries[0];
    expect(speed).toMatchObject({ kind: 'speed', type: 'maximum', value: 50, unit: 'km/h' });
  });

  it('parses lane/priority/supplementary typed attributes', () => {
    const e = semanticsOf(odrWithSignal(RICH)).entries;
    expect(e[1]).toMatchObject({ kind: 'lane', type: 'noOvertakeTrucks' });
    expect(e[2]).toMatchObject({ kind: 'priority', type: 'priorityRoad' });
    expect(e[4]).toMatchObject({ kind: 'supplementaryTime', type: 'time', value: 8 });
    expect(e[6]).toMatchObject({ kind: 'supplementaryDistance', type: 'for', value: 300, unit: 'm' });
    expect(e[7]).toMatchObject({ kind: 'supplementaryEnvironment', type: 'rain' });
  });

  it('parses prohibited participants with categories', () => {
    const prohibited = semanticsOf(odrWithSignal(RICH)).entries[3] as Extract<
      OdrSemanticsEntry,
      { kind: 'prohibited' }
    >;
    expect(prohibited.participants).toEqual([
      { kind: 'animal' },
      { kind: 'vehicle', category: 'heavyTruck' },
    ]);
  });

  it('parses supplementaryAllows person participant', () => {
    const allows = semanticsOf(odrWithSignal(RICH)).entries[5] as Extract<
      OdrSemanticsEntry,
      { kind: 'supplementaryAllows' }
    >;
    expect(allows.participants).toEqual([{ kind: 'person', category: 'pedestrian' }]);
  });
});

describe('signal <semantics> round-trip', () => {
  it('re-serializes every attribute and participant verbatim', () => {
    const out = roundTrip(odrWithSignal(RICH));
    expect(out).toContain('<semantics>');
    expect(out).toContain('type="maximum"');
    expect(out).toContain('value="50"');
    expect(out).toContain('unit="km/h"');
    expect(out).toContain('type="noOvertakeTrucks"');
    expect(out).toContain('<animal');
    expect(out).toContain('heavyTruck');
    expect(out).toContain('pedestrian');
    expect(out).toContain('unit="m"');
  });

  it('is idempotent through the model (parse∘serialize∘parse deep-equals)', () => {
    const a = semanticsOf(odrWithSignal(RICH));
    const b = semanticsOf(roundTrip(odrWithSignal(RICH)));
    expect(b).toEqual(a);
  });

  it('preserves an empty <semantics/> as an entry-less block', () => {
    const sem = semanticsOf(odrWithSignal('<semantics/>'));
    expect(sem.entries).toEqual([]);
    expect(roundTrip(odrWithSignal('<semantics/>'))).toContain('semantics');
  });
});

describe('signal <semantics> passthrough', () => {
  it('rides an unknown child inside <semantics> through extra', () => {
    const xml = odrWithSignal('<semantics><vendorTag foo="1"/></semantics>');
    const sem = semanticsOf(xml);
    expect(sem.entries).toEqual([]);
    expect(sem.extra?.children?.some((c) => c.name === 'vendorTag')).toBe(true);
    expect(roundTrip(xml)).toContain('<vendorTag');
  });

  it('rides an unknown @type on a speed entry through extra (typed field left undefined)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const xml = odrWithSignal('<semantics><speed type="bogus" value="30"/></semantics>');
    const speed = semanticsOf(xml).entries[0] as Extract<OdrSemanticsEntry, { kind: 'speed' }>;
    expect(speed.type).toBeUndefined();
    expect(speed.value).toBe(30);
    expect(speed.extra?.attrs?.type).toBe('bogus');
    expect(roundTrip(xml)).toContain('type="bogus"');
    warnSpy.mockRestore();
  });
});
