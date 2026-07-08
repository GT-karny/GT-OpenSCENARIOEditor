/**
 * Stage 0 (1.9-P1 item 2): explicit XSD child-order assertions.
 *
 * The semantic round-trip suite proves re-parse equivalence but is blind to
 * sibling order, so these string-level checks pin the emit order to the 1.9 XSD
 * sequences that strict validators enforce:
 *  - g_additionalData: dataQuality → include → userData (Core)
 *  - t_header: geoReference, offset, license, g_additionalData, defaultRegulations
 *  - t_road_signals_signal position choice: positionInertial before positionRoad
 *  - t_junction_priority: both @high and @low are required attributes
 */
import { describe, it, expect } from 'vitest';
import type { OpenDriveDocument, OdrRoad } from '@osce/shared';
import { XodrSerializer } from '../../serializer/xodr-serializer.js';

const serializer = new XodrSerializer();

/** Assert the given needles appear in the XML in the listed order. */
function expectOrder(xml: string, needles: string[]): void {
  let last = -1;
  for (const needle of needles) {
    const idx = xml.indexOf(needle);
    expect(idx, `"${needle}" should be present`).toBeGreaterThan(-1);
    expect(idx, `"${needle}" should follow "${needles[needles.indexOf(needle) - 1] ?? ''}"`).toBeGreaterThan(last);
    last = idx;
  }
}

function baseDoc(): OpenDriveDocument {
  return {
    header: { revMajor: 1, revMinor: 9, name: 'Order', date: 'd' },
    roads: [],
    controllers: [],
    junctions: [],
  };
}

function roadWithLine(extra: Partial<OdrRoad>): OdrRoad {
  return {
    id: '1',
    name: '',
    length: 100,
    junction: '-1',
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
    elevationProfile: [],
    lateralProfile: [],
    laneOffset: [],
    lanes: [
      { s: 0, leftLanes: [], centerLane: { id: 0, type: 'none', width: [], roadMarks: [] }, rightLanes: [] },
    ],
    objects: [],
    signals: [],
    ...extra,
  };
}

describe('XSD child-order (1.9)', () => {
  it('header: geoReference, offset, license, dataQuality, include, userData, defaultRegulations', () => {
    const doc = baseDoc();
    doc.header.geoReference = '+proj=utm';
    doc.header.offset = { x: 0, y: 0, z: 0, hdg: 0 };
    doc.header.dataQuality = { error: { xyAbsolute: 0.1, zAbsolute: 0.1, xyRelative: 0, zRelative: 0 } };
    doc.header.includes = [{ file: 'a.xml' }];
    doc.header.userData = [{ code: 'c', value: 'v' }];
    doc.header.extra = {
      children: [
        { name: 'license', raw: { '@_name': 'CC-BY' }, index: 2 },
        { name: 'defaultRegulations', raw: { roadRegulation: { '@_type': 'x' } }, index: 6 },
      ],
    };
    const xml = serializer.serializeFormatted(doc);
    expectOrder(xml, [
      '<geoReference',
      '<offset',
      '<license',
      '<dataQuality',
      '<include',
      '<userData',
      '<defaultRegulations',
    ]);
  });

  it('road g_additionalData: dataQuality before include before userData', () => {
    const doc = baseDoc();
    doc.roads = [
      roadWithLine({
        dataQuality: { error: { xyAbsolute: 0.1, zAbsolute: 0.1, xyRelative: 0, zRelative: 0 } },
        includes: [{ file: 'a.xml' }],
        userData: [{ code: 'c', value: 'v' }],
      }),
    ];
    const xml = serializer.serializeFormatted(doc);
    expectOrder(xml, ['<dataQuality', '<include', '<userData']);
  });

  it('signal position choice: positionInertial before positionRoad', () => {
    const doc = baseDoc();
    doc.roads = [
      roadWithLine({
        signals: [
          {
            id: '1',
            s: 10,
            t: 0,
            orientation: '+',
            positionRoad: { roadId: '1', s: 10, t: 0, zOffset: 0, hOffset: 0 },
            positionInertial: { x: 1, y: 2, z: 3, hdg: 0 },
          },
        ],
      }),
    ];
    const xml = serializer.serializeFormatted(doc);
    expectOrder(xml, ['<positionInertial', '<positionRoad']);
  });

  it('junction priority: emits both @high and @low', () => {
    const doc = baseDoc();
    doc.junctions = [
      {
        id: '100',
        name: 'j',
        type: 'default',
        connections: [],
        priority: [{ high: '1', low: '2' }],
      },
    ];
    const xml = serializer.serializeFormatted(doc);
    const m = xml.match(/<priority[^>]*\/?>/);
    expect(m, 'a <priority> element is emitted').not.toBeNull();
    expect(m![0]).toContain('high="1"');
    expect(m![0]).toContain('low="2"');
  });
});
