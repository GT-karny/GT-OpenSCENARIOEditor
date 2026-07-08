import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { XodrParser } from '../../parser/xodr-parser.js';
import { XodrSerializer } from '../../serializer/xodr-serializer.js';

const parser = new XodrParser();
const serializer = new XodrSerializer();

const FIXTURES_DIR = resolve(__dirname, '../../../../../test-fixtures/esmini/xodr');

function roundtrip(filePath: string) {
  const originalXml = readFileSync(filePath, 'utf-8');
  const doc = parser.parse(originalXml);
  const serializedXml = serializer.serializeFormatted(doc);
  const reparsedDoc = parser.parse(serializedXml);
  return { doc, reparsedDoc, serializedXml };
}

describe('XodrSerializer roundtrip', () => {
  describe('straight_500m.xodr', () => {
    it('should produce a valid XML that parses back to the same structure', () => {
      const { doc, reparsedDoc } = roundtrip(resolve(FIXTURES_DIR, 'straight_500m.xodr'));

      // Header
      expect(reparsedDoc.header.revMajor).toBe(doc.header.revMajor);
      expect(reparsedDoc.header.revMinor).toBe(doc.header.revMinor);
      expect(reparsedDoc.header.name).toBe(doc.header.name);

      // Roads count
      expect(reparsedDoc.roads).toHaveLength(doc.roads.length);

      // Road attributes
      const road = doc.roads[0];
      const reRoad = reparsedDoc.roads[0];
      expect(reRoad.id).toBe(road.id);
      expect(reRoad.length).toBeCloseTo(road.length, 6);
      expect(reRoad.junction).toBe(road.junction);

      // PlanView
      expect(reRoad.planView).toHaveLength(road.planView.length);
      expect(reRoad.planView[0].type).toBe('line');
      expect(reRoad.planView[0].length).toBeCloseTo(road.planView[0].length, 6);

      // Elevation
      expect(reRoad.elevationProfile).toHaveLength(road.elevationProfile.length);

      // Lanes
      expect(reRoad.lanes).toHaveLength(road.lanes.length);
      expect(reRoad.lanes[0].leftLanes).toHaveLength(road.lanes[0].leftLanes.length);
      expect(reRoad.lanes[0].rightLanes).toHaveLength(road.lanes[0].rightLanes.length);
      expect(reRoad.lanes[0].centerLane.id).toBe(0);
    });

    it('should preserve lane widths', () => {
      const { doc, reparsedDoc } = roundtrip(resolve(FIXTURES_DIR, 'straight_500m.xodr'));
      const origLane = doc.roads[0].lanes[0].leftLanes[0];
      const reLane = reparsedDoc.roads[0].lanes[0].leftLanes[0];
      expect(reLane.width).toHaveLength(origLane.width.length);
      expect(reLane.width[0].a).toBeCloseTo(origLane.width[0].a, 6);
    });

    it('should preserve road marks', () => {
      const { doc, reparsedDoc } = roundtrip(resolve(FIXTURES_DIR, 'straight_500m.xodr'));
      // The first driving lane in left should have a roadMark
      const origLane = doc.roads[0].lanes[0].leftLanes.find((l) => l.roadMarks.length > 0);
      const reLane = reparsedDoc.roads[0].lanes[0].leftLanes.find((l) => l.roadMarks.length > 0);
      if (origLane && reLane) {
        expect(reLane.roadMarks[0].type).toBe(origLane.roadMarks[0].type);
        expect(reLane.roadMarks[0].color).toBe(origLane.roadMarks[0].color);
      }
    });
  });

  describe('curve_r100.xodr', () => {
    it('should roundtrip arc geometry', () => {
      const { doc, reparsedDoc } = roundtrip(resolve(FIXTURES_DIR, 'curve_r100.xodr'));

      expect(reparsedDoc.roads).toHaveLength(doc.roads.length);

      const road = doc.roads[0];
      const reRoad = reparsedDoc.roads[0];

      // PlanView with line + arc + line
      expect(reRoad.planView).toHaveLength(road.planView.length);

      // Check arc geometry
      const arc = road.planView.find((g) => g.type === 'arc');
      const reArc = reRoad.planView.find((g) => g.type === 'arc');
      expect(arc).toBeDefined();
      expect(reArc).toBeDefined();
      if (arc?.type !== 'arc' || reArc?.type !== 'arc') throw new Error('expected arc');
      expect(reArc.curvature).toBeCloseTo(arc.curvature, 8);
      expect(reArc!.s).toBeCloseTo(arc!.s, 6);
      expect(reArc!.x).toBeCloseTo(arc!.x, 6);
      expect(reArc!.y).toBeCloseTo(arc!.y, 6);
      expect(reArc!.length).toBeCloseTo(arc!.length, 6);
    });

    it('should roundtrip road objects', () => {
      const { doc, reparsedDoc } = roundtrip(resolve(FIXTURES_DIR, 'curve_r100.xodr'));

      expect(reparsedDoc.roads[0].objects).toHaveLength(doc.roads[0].objects.length);
      if (doc.roads[0].objects.length > 0) {
        expect(reparsedDoc.roads[0].objects[0].id).toBe(doc.roads[0].objects[0].id);
        expect(reparsedDoc.roads[0].objects[0].s).toBeCloseTo(doc.roads[0].objects[0].s, 6);
      }
    });
  });

  describe('straight_500m_signs.xodr', () => {
    it('should roundtrip signals', () => {
      const { doc, reparsedDoc } = roundtrip(
        resolve(FIXTURES_DIR, 'straight_500m_signs.xodr'),
      );

      const origSignals = doc.roads[0].signals;
      const reSignals = reparsedDoc.roads[0].signals;
      expect(reSignals).toHaveLength(origSignals.length);

      for (let i = 0; i < origSignals.length; i++) {
        expect(reSignals[i].id).toBe(origSignals[i].id);
        expect(reSignals[i].s).toBeCloseTo(origSignals[i].s, 6);
        expect(reSignals[i].t).toBeCloseTo(origSignals[i].t, 6);
        expect(reSignals[i].orientation).toBe(origSignals[i].orientation);
        expect(reSignals[i].country).toBe(origSignals[i].country);
      }
    });

    it('should roundtrip road type entries', () => {
      const { doc, reparsedDoc } = roundtrip(
        resolve(FIXTURES_DIR, 'straight_500m_signs.xodr'),
      );

      const origTypes = doc.roads[0].type;
      const reTypes = reparsedDoc.roads[0].type;
      expect(reTypes).toHaveLength(origTypes!.length);
      expect(reTypes![0].type).toBe(origTypes![0].type);
      expect(reTypes![0].speed?.max).toBe(origTypes![0].speed?.max);
      expect(reTypes![0].speed?.unit).toBe(origTypes![0].speed?.unit);
    });
  });

  describe('e6mini.xodr (complex road network)', () => {
    it('should roundtrip multiple roads', () => {
      const filePath = resolve(FIXTURES_DIR, 'e6mini.xodr');
      const { doc, reparsedDoc } = roundtrip(filePath);

      expect(reparsedDoc.roads).toHaveLength(doc.roads.length);

      // Verify all road IDs match
      const origIds = doc.roads.map((r) => r.id).sort();
      const reIds = reparsedDoc.roads.map((r) => r.id).sort();
      expect(reIds).toEqual(origIds);
    });

    it('should roundtrip junctions', () => {
      const filePath = resolve(FIXTURES_DIR, 'e6mini.xodr');
      const { doc, reparsedDoc } = roundtrip(filePath);

      expect(reparsedDoc.junctions).toHaveLength(doc.junctions.length);

      for (let i = 0; i < doc.junctions.length; i++) {
        expect(reparsedDoc.junctions[i].id).toBe(doc.junctions[i].id);
        expect(reparsedDoc.junctions[i].name).toBe(doc.junctions[i].name);
        expect(reparsedDoc.junctions[i].connections).toHaveLength(
          doc.junctions[i].connections.length,
        );
      }
    });

    it('should roundtrip road links', () => {
      const filePath = resolve(FIXTURES_DIR, 'e6mini.xodr');
      const { doc, reparsedDoc } = roundtrip(filePath);

      for (let i = 0; i < doc.roads.length; i++) {
        const origLink = doc.roads[i].link;
        const reLink = reparsedDoc.roads[i].link;

        if (origLink?.predecessor) {
          expect(reLink?.predecessor?.elementType).toBe(origLink.predecessor.elementType);
          expect(reLink?.predecessor?.elementId).toBe(origLink.predecessor.elementId);
          expect(reLink?.predecessor?.contactPoint).toBe(origLink.predecessor.contactPoint);
        }
        if (origLink?.successor) {
          expect(reLink?.successor?.elementType).toBe(origLink.successor.elementType);
          expect(reLink?.successor?.elementId).toBe(origLink.successor.elementId);
          expect(reLink?.successor?.contactPoint).toBe(origLink.successor.contactPoint);
        }
      }
    });
  });

  describe('geoReference preservation', () => {
    it('should preserve geoReference through roundtrip', () => {
      const { doc, reparsedDoc } = roundtrip(resolve(FIXTURES_DIR, 'straight_500m.xodr'));

      expect(doc.header.geoReference).toBeDefined();
      expect(reparsedDoc.header.geoReference).toBeDefined();
      // Content should match (trimmed)
      expect(reparsedDoc.header.geoReference!.trim()).toBe(
        doc.header.geoReference!.trim(),
      );
    });
  });

  describe('userData and include lossless round-trip', () => {
    /** Minimal valid XODR with userData on road and header, plus an include element. */
    const XML_WITH_USER_DATA = `<?xml version="1.0" encoding="UTF-8"?>
<OpenDRIVE>
  <header revMajor="1" revMinor="6" name="test" date="2024-01-01">
    <userData code="source" value="lidar-scan"/>
    <include file="./env.xodr"/>
  </header>
  <road name="R1" length="100" id="1" junction="-1">
    <link/>
    <planView>
      <geometry s="0" x="0" y="0" hdg="0" length="100"><line/></geometry>
    </planView>
    <elevationProfile/>
    <lateralProfile/>
    <lanes>
      <laneSection s="0">
        <center>
          <lane id="0" type="none" level="false">
            <roadMark sOffset="0" type="solid" color="standard"/>
          </lane>
        </center>
        <right>
          <lane id="-1" type="driving" level="false">
            <width sOffset="0" a="3.5" b="0" c="0" d="0"/>
            <roadMark sOffset="0" type="solid" color="standard"/>
          </lane>
        </right>
      </laneSection>
    </lanes>
    <objects/>
    <signals/>
    <userData code="survey" value="2024"/>
    <include file="./signals.xodr"/>
  </road>
</OpenDRIVE>`;

    it('should preserve road-level userData through roundtrip', () => {
      const doc = parser.parse(XML_WITH_USER_DATA);
      expect(doc.roads[0].userData).toEqual([{ code: 'survey', value: '2024' }]);

      const serialized = serializer.serialize(doc);
      const reparsed = parser.parse(serialized);
      expect(reparsed.roads[0].userData).toEqual(doc.roads[0].userData);
    });

    it('should preserve road-level includes through roundtrip', () => {
      const doc = parser.parse(XML_WITH_USER_DATA);
      expect(doc.roads[0].includes).toEqual([{ file: './signals.xodr' }]);

      const serialized = serializer.serialize(doc);
      const reparsed = parser.parse(serialized);
      expect(reparsed.roads[0].includes).toEqual(doc.roads[0].includes);
    });

    it('should preserve header-level userData through roundtrip', () => {
      const doc = parser.parse(XML_WITH_USER_DATA);
      expect(doc.header.userData).toEqual([{ code: 'source', value: 'lidar-scan' }]);

      const serialized = serializer.serialize(doc);
      const reparsed = parser.parse(serialized);
      expect(reparsed.header.userData).toEqual(doc.header.userData);
    });

    it('should preserve header-level includes through roundtrip', () => {
      const doc = parser.parse(XML_WITH_USER_DATA);
      expect(doc.header.includes).toEqual([{ file: './env.xodr' }]);

      const serialized = serializer.serialize(doc);
      const reparsed = parser.parse(serialized);
      expect(reparsed.header.includes).toEqual(doc.header.includes);
    });
  });

  describe('serialized XML structure', () => {
    it('should produce well-formed XML with declaration', () => {
      const { serializedXml } = roundtrip(resolve(FIXTURES_DIR, 'straight_500m.xodr'));
      expect(serializedXml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      expect(serializedXml).toContain('<OpenDRIVE>');
      expect(serializedXml).toContain('</OpenDRIVE>');
    });

    it('should contain geoReference with CDATA', () => {
      const { serializedXml } = roundtrip(resolve(FIXTURES_DIR, 'straight_500m.xodr'));
      expect(serializedXml).toContain('<![CDATA[');
      expect(serializedXml).toContain(']]>');
    });
  });
});
