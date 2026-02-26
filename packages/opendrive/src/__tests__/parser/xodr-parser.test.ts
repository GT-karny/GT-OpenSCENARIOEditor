import { describe, it, expect } from 'vitest';
import { XodrParser } from '../../parser/xodr-parser.js';

const parser = new XodrParser();

const STRAIGHT_ROAD_XML = `<?xml version="1.0" standalone="yes"?>
<OpenDRIVE>
  <header revMajor="1" revMinor="4" name="StraightRoad" version="1.00"
          date="2024-01-01" north="0.0" south="0.0" east="0.0" west="0.0">
    <geoReference><![CDATA[+proj=utm +zone=32]]></geoReference>
  </header>
  <road name="Road1" length="500.0" id="1" junction="-1">
    <link>
      <predecessor elementType="road" elementId="0" contactPoint="end"/>
      <successor elementType="junction" elementId="100"/>
    </link>
    <type s="0.0" type="motorway">
      <speed max="33.33" unit="m/s"/>
    </type>
    <planView>
      <geometry s="0.0" x="0.0" y="0.0" hdg="0.0" length="500.0">
        <line/>
      </geometry>
    </planView>
    <elevationProfile>
      <elevation s="0.0" a="0.0" b="0.0" c="0.0" d="0.0"/>
    </elevationProfile>
    <lateralProfile/>
    <lanes>
      <laneSection s="0.0">
        <left>
          <lane id="1" type="driving" level="false">
            <width sOffset="0.0" a="3.5" b="0.0" c="0.0" d="0.0"/>
            <roadMark sOffset="0.0" type="solid" color="white" width="0.15"/>
          </lane>
        </left>
        <center>
          <lane id="0" type="driving" level="false">
            <roadMark sOffset="0.0" type="broken" color="standard" width="0.12"/>
          </lane>
        </center>
        <right>
          <lane id="-1" type="driving" level="false">
            <width sOffset="0.0" a="3.5" b="0.0" c="0.0" d="0.0"/>
            <roadMark sOffset="0.0" type="solid" color="white" width="0.15"/>
          </lane>
        </right>
      </laneSection>
    </lanes>
    <objects>
      <object id="1" name="pole" type="pole" s="10" t="5" zOffset="0"/>
    </objects>
    <signals>
      <signal id="1" name="stop" s="490" t="-4" orientation="+" dynamic="no" country="US" type="206"/>
    </signals>
  </road>
  <controller id="1" name="ctrl1">
    <control signalId="1" type=""/>
  </controller>
  <junction id="100" name="jct1" type="default">
    <connection id="1" incomingRoad="1" connectingRoad="2" contactPoint="start">
      <laneLink from="1" to="1"/>
      <laneLink from="-1" to="-1"/>
    </connection>
  </junction>
</OpenDRIVE>`;

describe('XodrParser', () => {
  describe('parse header', () => {
    it('should parse header attributes', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      expect(doc.header.revMajor).toBe(1);
      expect(doc.header.revMinor).toBe(4);
      expect(doc.header.name).toBe('StraightRoad');
      expect(doc.header.date).toBe('2024-01-01');
      expect(doc.header.north).toBe(0.0);
    });

    it('should parse geoReference CDATA', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      expect(doc.header.geoReference).toBe('+proj=utm +zone=32');
    });
  });

  describe('parse roads', () => {
    it('should parse road count and attributes', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      expect(doc.roads).toHaveLength(1);
      expect(doc.roads[0].id).toBe('1');
      expect(doc.roads[0].name).toBe('Road1');
      expect(doc.roads[0].length).toBe(500.0);
      expect(doc.roads[0].junction).toBe('-1');
    });

    it('should parse road links', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      const link = doc.roads[0].link;
      expect(link).toBeDefined();
      expect(link!.predecessor?.elementType).toBe('road');
      expect(link!.predecessor?.elementId).toBe('0');
      expect(link!.predecessor?.contactPoint).toBe('end');
      expect(link!.successor?.elementType).toBe('junction');
      expect(link!.successor?.elementId).toBe('100');
    });

    it('should parse road type entries', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      const types = doc.roads[0].type;
      expect(types).toBeDefined();
      expect(types).toHaveLength(1);
      expect(types![0].s).toBe(0);
      expect(types![0].type).toBe('motorway');
      expect(types![0].speed?.max).toBe(33.33);
      expect(types![0].speed?.unit).toBe('m/s');
    });
  });

  describe('parse geometry', () => {
    it('should parse line geometry', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      const geom = doc.roads[0].planView;
      expect(geom).toHaveLength(1);
      expect(geom[0].type).toBe('line');
      expect(geom[0].s).toBe(0);
      expect(geom[0].x).toBe(0);
      expect(geom[0].y).toBe(0);
      expect(geom[0].hdg).toBe(0);
      expect(geom[0].length).toBe(500);
    });

    it('should parse arc geometry', () => {
      const xml = `<OpenDRIVE>
        <header revMajor="1" revMinor="4" name="" date=""/>
        <road name="" length="100" id="1" junction="-1">
          <planView>
            <geometry s="0" x="0" y="0" hdg="0" length="100">
              <arc curvature="0.01"/>
            </geometry>
          </planView>
          <lanes><laneSection s="0"><center><lane id="0" type="none"/></center></laneSection></lanes>
        </road>
      </OpenDRIVE>`;
      const doc = parser.parse(xml);
      expect(doc.roads[0].planView[0].type).toBe('arc');
      expect(doc.roads[0].planView[0].curvature).toBe(0.01);
    });

    it('should parse spiral geometry', () => {
      const xml = `<OpenDRIVE>
        <header revMajor="1" revMinor="4" name="" date=""/>
        <road name="" length="50" id="1" junction="-1">
          <planView>
            <geometry s="0" x="0" y="0" hdg="0" length="50">
              <spiral curvStart="0.0" curvEnd="0.02"/>
            </geometry>
          </planView>
          <lanes><laneSection s="0"><center><lane id="0" type="none"/></center></laneSection></lanes>
        </road>
      </OpenDRIVE>`;
      const doc = parser.parse(xml);
      expect(doc.roads[0].planView[0].type).toBe('spiral');
      expect(doc.roads[0].planView[0].curvStart).toBe(0);
      expect(doc.roads[0].planView[0].curvEnd).toBe(0.02);
    });

    it('should parse paramPoly3 geometry', () => {
      const xml = `<OpenDRIVE>
        <header revMajor="1" revMinor="4" name="" date=""/>
        <road name="" length="100" id="1" junction="-1">
          <planView>
            <geometry s="0" x="0" y="0" hdg="0" length="100">
              <paramPoly3 aU="0" bU="1" cU="0" dU="0" aV="0" bV="0" cV="0.001" dV="0" pRange="arcLength"/>
            </geometry>
          </planView>
          <lanes><laneSection s="0"><center><lane id="0" type="none"/></center></laneSection></lanes>
        </road>
      </OpenDRIVE>`;
      const doc = parser.parse(xml);
      const g = doc.roads[0].planView[0];
      expect(g.type).toBe('paramPoly3');
      expect(g.aU).toBe(0);
      expect(g.bU).toBe(1);
      expect(g.cV).toBe(0.001);
      expect(g.pRange).toBe('arcLength');
    });
  });

  describe('parse lanes', () => {
    it('should parse lane sections with left/center/right lanes', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      const sections = doc.roads[0].lanes;
      expect(sections).toHaveLength(1);

      const sec = sections[0];
      expect(sec.s).toBe(0);
      expect(sec.leftLanes).toHaveLength(1);
      expect(sec.centerLane.id).toBe(0);
      expect(sec.rightLanes).toHaveLength(1);
    });

    it('should parse lane width', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      const leftLane = doc.roads[0].lanes[0].leftLanes[0];
      expect(leftLane.id).toBe(1);
      expect(leftLane.type).toBe('driving');
      expect(leftLane.width).toHaveLength(1);
      expect(leftLane.width[0].a).toBe(3.5);
      expect(leftLane.width[0].b).toBe(0);
    });

    it('should parse road marks', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      const leftLane = doc.roads[0].lanes[0].leftLanes[0];
      expect(leftLane.roadMarks).toHaveLength(1);
      expect(leftLane.roadMarks[0].type).toBe('solid');
      expect(leftLane.roadMarks[0].color).toBe('white');
      expect(leftLane.roadMarks[0].width).toBe(0.15);
    });
  });

  describe('parse elevation', () => {
    it('should parse elevation profile', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      expect(doc.roads[0].elevationProfile).toHaveLength(1);
      expect(doc.roads[0].elevationProfile[0].s).toBe(0);
      expect(doc.roads[0].elevationProfile[0].a).toBe(0);
    });

    it('should handle empty lateral profile', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      expect(doc.roads[0].lateralProfile).toHaveLength(0);
    });
  });

  describe('parse objects and signals', () => {
    it('should parse road objects', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      expect(doc.roads[0].objects).toHaveLength(1);
      expect(doc.roads[0].objects[0].id).toBe('1');
      expect(doc.roads[0].objects[0].name).toBe('pole');
      expect(doc.roads[0].objects[0].s).toBe(10);
      expect(doc.roads[0].objects[0].t).toBe(5);
    });

    it('should parse signals', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      expect(doc.roads[0].signals).toHaveLength(1);
      expect(doc.roads[0].signals[0].id).toBe('1');
      expect(doc.roads[0].signals[0].orientation).toBe('+');
      expect(doc.roads[0].signals[0].country).toBe('US');
    });
  });

  describe('parse controllers', () => {
    it('should parse controllers', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      expect(doc.controllers).toHaveLength(1);
      expect(doc.controllers[0].id).toBe('1');
      expect(doc.controllers[0].name).toBe('ctrl1');
      expect(doc.controllers[0].controls).toHaveLength(1);
      expect(doc.controllers[0].controls[0].signalId).toBe('1');
    });
  });

  describe('parse junctions', () => {
    it('should parse junctions and connections', () => {
      const doc = parser.parse(STRAIGHT_ROAD_XML);
      expect(doc.junctions).toHaveLength(1);
      const jct = doc.junctions[0];
      expect(jct.id).toBe('100');
      expect(jct.name).toBe('jct1');
      expect(jct.type).toBe('default');
      expect(jct.connections).toHaveLength(1);
      expect(jct.connections[0].incomingRoad).toBe('1');
      expect(jct.connections[0].connectingRoad).toBe('2');
      expect(jct.connections[0].contactPoint).toBe('start');
      expect(jct.connections[0].laneLinks).toHaveLength(2);
      expect(jct.connections[0].laneLinks[0].from).toBe(1);
      expect(jct.connections[0].laneLinks[0].to).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle minimal valid OpenDRIVE', () => {
      const xml = `<OpenDRIVE>
        <header revMajor="1" revMinor="4" name="" date=""/>
        <road name="" length="100" id="1" junction="-1">
          <planView>
            <geometry s="0" x="0" y="0" hdg="0" length="100"><line/></geometry>
          </planView>
          <lanes>
            <laneSection s="0">
              <center><lane id="0" type="none"/></center>
            </laneSection>
          </lanes>
        </road>
      </OpenDRIVE>`;
      const doc = parser.parse(xml);
      expect(doc.roads).toHaveLength(1);
      expect(doc.roads[0].objects).toHaveLength(0);
      expect(doc.roads[0].signals).toHaveLength(0);
      expect(doc.roads[0].elevationProfile).toHaveLength(0);
      expect(doc.roads[0].lateralProfile).toHaveLength(0);
      expect(doc.controllers).toHaveLength(0);
      expect(doc.junctions).toHaveLength(0);
    });

    it('should handle lane links', () => {
      const xml = `<OpenDRIVE>
        <header revMajor="1" revMinor="4" name="" date=""/>
        <road name="" length="100" id="1" junction="-1">
          <planView>
            <geometry s="0" x="0" y="0" hdg="0" length="100"><line/></geometry>
          </planView>
          <lanes>
            <laneSection s="0">
              <left>
                <lane id="1" type="driving">
                  <link><predecessor id="1"/><successor id="2"/></link>
                  <width sOffset="0" a="3.5" b="0" c="0" d="0"/>
                </lane>
              </left>
              <center><lane id="0" type="none"/></center>
            </laneSection>
          </lanes>
        </road>
      </OpenDRIVE>`;
      const doc = parser.parse(xml);
      const lane = doc.roads[0].lanes[0].leftLanes[0];
      expect(lane.link).toBeDefined();
      expect(lane.link!.predecessorId).toBe(1);
      expect(lane.link!.successorId).toBe(2);
    });
  });
});
