import { describe, it, expect } from 'vitest';
import type { OpenDriveDocument } from '@osce/shared';
import { XodrSerializer } from '../../serializer/xodr-serializer.js';

const serializer = new XodrSerializer();

function minimalDoc(): OpenDriveDocument {
  return {
    header: {
      revMajor: 1,
      revMinor: 6,
      name: 'TestRoad',
      date: '2024-01-01',
    },
    roads: [],
    controllers: [],
    junctions: [],
  };
}

describe('XodrSerializer', () => {
  describe('XML declaration', () => {
    it('should start with XML declaration', () => {
      const xml = serializer.serialize(minimalDoc());
      expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    });
  });

  describe('header', () => {
    it('should serialize header attributes', () => {
      const xml = serializer.serializeFormatted(minimalDoc());
      expect(xml).toContain('revMajor="1"');
      expect(xml).toContain('revMinor="6"');
      expect(xml).toContain('name="TestRoad"');
      expect(xml).toContain('date="2024-01-01"');
    });

    it('should serialize optional bounding box attributes', () => {
      const doc = minimalDoc();
      doc.header.north = 100.5;
      doc.header.south = -50.25;
      doc.header.east = 200;
      doc.header.west = -100;
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('north="100.5"');
      expect(xml).toContain('south="-50.25"');
      expect(xml).toContain('east="200"');
      expect(xml).toContain('west="-100"');
    });

    it('should omit optional attributes when undefined', () => {
      const xml = serializer.serializeFormatted(minimalDoc());
      expect(xml).not.toContain('north=');
      expect(xml).not.toContain('south=');
      expect(xml).not.toContain('east=');
      expect(xml).not.toContain('west=');
    });

    it('should serialize geoReference with CDATA', () => {
      const doc = minimalDoc();
      doc.header.geoReference = '+proj=utm +zone=32';
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('<geoReference>');
      expect(xml).toContain('<![CDATA[+proj=utm +zone=32]]>');
    });
  });

  describe('road', () => {
    it('should serialize a simple road with line geometry', () => {
      const doc = minimalDoc();
      doc.roads = [
        {
          id: '1',
          name: 'Road1',
          length: 500,
          junction: '-1',
          planView: [
            { s: 0, x: 0, y: 0, hdg: 0, length: 500, type: 'line' },
          ],
          elevationProfile: [],
          lateralProfile: [],
          laneOffset: [],
          lanes: [
            {
              s: 0,
              leftLanes: [],
              centerLane: { id: 0, type: 'driving', width: [], roadMarks: [] },
              rightLanes: [],
            },
          ],
          objects: [],
          signals: [],
        },
      ];
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('id="1"');
      expect(xml).toContain('name="Road1"');
      expect(xml).toContain('length="500"');
      expect(xml).toContain('junction="-1"');
      expect(xml).toContain('<line');
    });

    it('should serialize road rule attribute', () => {
      const doc = minimalDoc();
      doc.roads = [
        {
          id: '1',
          name: '',
          length: 100,
          junction: '-1',
          rule: 'RHT',
          planView: [
            { s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' },
          ],
          elevationProfile: [],
          lateralProfile: [],
          laneOffset: [],
          lanes: [
            {
              s: 0,
              leftLanes: [],
              centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
              rightLanes: [],
            },
          ],
          objects: [],
          signals: [],
        },
      ];
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('rule="RHT"');
    });

    it('should serialize road links', () => {
      const doc = minimalDoc();
      doc.roads = [
        {
          id: '1',
          name: '',
          length: 100,
          junction: '-1',
          link: {
            predecessor: { elementType: 'road', elementId: '0', contactPoint: 'end' },
            successor: { elementType: 'junction', elementId: '100' },
          },
          planView: [
            { s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' },
          ],
          elevationProfile: [],
          lateralProfile: [],
          laneOffset: [],
          lanes: [
            {
              s: 0,
              leftLanes: [],
              centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
              rightLanes: [],
            },
          ],
          objects: [],
          signals: [],
        },
      ];
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('elementType="road"');
      expect(xml).toContain('elementId="0"');
      expect(xml).toContain('contactPoint="end"');
      expect(xml).toContain('elementType="junction"');
      expect(xml).toContain('elementId="100"');
    });

    it('should serialize road type entries with speed', () => {
      const doc = minimalDoc();
      doc.roads = [
        {
          id: '1',
          name: '',
          length: 100,
          junction: '-1',
          type: [{ s: 0, type: 'motorway', speed: { max: 33.33, unit: 'm/s' } }],
          planView: [
            { s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' },
          ],
          elevationProfile: [],
          lateralProfile: [],
          laneOffset: [],
          lanes: [
            {
              s: 0,
              leftLanes: [],
              centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
              rightLanes: [],
            },
          ],
          objects: [],
          signals: [],
        },
      ];
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('type="motorway"');
      expect(xml).toContain('max="33.33"');
      expect(xml).toContain('unit="m/s"');
    });
  });

  describe('geometry types', () => {
    function roadWithGeometry(geom: OpenDriveDocument['roads'][0]['planView'][0]): OpenDriveDocument {
      const doc = minimalDoc();
      doc.roads = [
        {
          id: '1',
          name: '',
          length: 100,
          junction: '-1',
          planView: [geom],
          elevationProfile: [],
          lateralProfile: [],
          laneOffset: [],
          lanes: [
            {
              s: 0,
              leftLanes: [],
              centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
              rightLanes: [],
            },
          ],
          objects: [],
          signals: [],
        },
      ];
      return doc;
    }

    it('should serialize arc geometry', () => {
      const doc = roadWithGeometry({
        s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'arc', curvature: 0.01,
      });
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('<arc');
      expect(xml).toContain('curvature="0.01"');
    });

    it('should serialize spiral geometry', () => {
      const doc = roadWithGeometry({
        s: 0, x: 0, y: 0, hdg: 0, length: 50, type: 'spiral', curvStart: 0, curvEnd: 0.02,
      });
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('<spiral');
      expect(xml).toContain('curvStart="0"');
      expect(xml).toContain('curvEnd="0.02"');
    });

    it('should serialize poly3 geometry', () => {
      const doc = roadWithGeometry({
        s: 0, x: 0, y: 0, hdg: 0, length: 100,
        type: 'poly3', a: 0, b: 1, c: 0.001, d: 0,
      });
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('<poly3');
      expect(xml).toContain('a="0"');
      expect(xml).toContain('b="1"');
      expect(xml).toContain('c="0.001"');
    });

    it('should serialize paramPoly3 geometry', () => {
      const doc = roadWithGeometry({
        s: 0, x: 0, y: 0, hdg: 0, length: 100,
        type: 'paramPoly3',
        aU: 0, bU: 1, cU: 0, dU: 0,
        aV: 0, bV: 0, cV: 0.001, dV: 0,
        pRange: 'arcLength',
      });
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('<paramPoly3');
      expect(xml).toContain('aU="0"');
      expect(xml).toContain('bU="1"');
      expect(xml).toContain('cV="0.001"');
      expect(xml).toContain('pRange="arcLength"');
    });
  });

  describe('lanes', () => {
    it('should serialize lane sections with left/center/right', () => {
      const doc = minimalDoc();
      doc.roads = [
        {
          id: '1',
          name: '',
          length: 100,
          junction: '-1',
          planView: [
            { s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' },
          ],
          elevationProfile: [],
          lateralProfile: [],
          laneOffset: [],
          lanes: [
            {
              s: 0,
              leftLanes: [
                {
                  id: 1,
                  type: 'driving',
                  level: false,
                  width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
                  roadMarks: [{ sOffset: 0, type: 'solid', color: 'white', width: 0.15 }],
                },
              ],
              centerLane: {
                id: 0,
                type: 'driving',
                width: [],
                roadMarks: [{ sOffset: 0, type: 'broken', color: 'standard', width: 0.12 }],
              },
              rightLanes: [
                {
                  id: -1,
                  type: 'driving',
                  level: false,
                  width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
                  roadMarks: [{ sOffset: 0, type: 'solid', color: 'white', width: 0.15 }],
                },
              ],
            },
          ],
          objects: [],
          signals: [],
        },
      ];
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('<left>');
      expect(xml).toContain('<center>');
      expect(xml).toContain('<right>');
      expect(xml).toContain('id="1"');
      expect(xml).toContain('id="0"');
      expect(xml).toContain('id="-1"');
    });

    it('should serialize lane offsets', () => {
      const doc = minimalDoc();
      doc.roads = [
        {
          id: '1',
          name: '',
          length: 100,
          junction: '-1',
          planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
          elevationProfile: [],
          lateralProfile: [],
          laneOffset: [{ s: 0, a: 0, b: 0, c: 0.0042, d: -5.6e-5 }],
          lanes: [
            {
              s: 0,
              leftLanes: [],
              centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
              rightLanes: [],
            },
          ],
          objects: [],
          signals: [],
        },
      ];
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('<laneOffset');
      expect(xml).toContain('c="0.0042"');
    });

    it('should serialize lane links', () => {
      const doc = minimalDoc();
      doc.roads = [
        {
          id: '1',
          name: '',
          length: 100,
          junction: '-1',
          planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
          elevationProfile: [],
          lateralProfile: [],
          laneOffset: [],
          lanes: [
            {
              s: 0,
              leftLanes: [
                {
                  id: 1,
                  type: 'driving',
                  width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
                  roadMarks: [],
                  link: { predecessorId: 1, successorId: 2 },
                },
              ],
              centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
              rightLanes: [],
            },
          ],
          objects: [],
          signals: [],
        },
      ];
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('<predecessor');
      expect(xml).toContain('id="1"');
      expect(xml).toContain('<successor');
      expect(xml).toContain('id="2"');
    });
  });

  describe('elevation and lateral profile', () => {
    it('should serialize elevation profile', () => {
      const doc = minimalDoc();
      doc.roads = [
        {
          id: '1',
          name: '',
          length: 100,
          junction: '-1',
          planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
          elevationProfile: [{ s: 0, a: 10, b: 0.01, c: 0, d: 0 }],
          lateralProfile: [],
          laneOffset: [],
          lanes: [
            {
              s: 0,
              leftLanes: [],
              centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
              rightLanes: [],
            },
          ],
          objects: [],
          signals: [],
        },
      ];
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('<elevationProfile>');
      expect(xml).toContain('<elevation');
      expect(xml).toContain('a="10"');
      expect(xml).toContain('b="0.01"');
    });

    it('should serialize superelevation in lateral profile', () => {
      const doc = minimalDoc();
      doc.roads = [
        {
          id: '1',
          name: '',
          length: 100,
          junction: '-1',
          planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
          elevationProfile: [],
          lateralProfile: [{ s: 0, a: 0.03, b: 0, c: 0, d: 0 }],
          laneOffset: [],
          lanes: [
            {
              s: 0,
              leftLanes: [],
              centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
              rightLanes: [],
            },
          ],
          objects: [],
          signals: [],
        },
      ];
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('<lateralProfile>');
      expect(xml).toContain('<superelevation');
      expect(xml).toContain('a="0.03"');
    });
  });

  describe('objects and signals', () => {
    it('should serialize road objects', () => {
      const doc = minimalDoc();
      doc.roads = [
        {
          id: '1',
          name: '',
          length: 100,
          junction: '-1',
          planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
          elevationProfile: [],
          lateralProfile: [],
          laneOffset: [],
          lanes: [
            {
              s: 0,
              leftLanes: [],
              centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
              rightLanes: [],
            },
          ],
          objects: [{ id: '1', name: 'pole', type: 'pole', s: 10, t: 5, zOffset: 0 }],
          signals: [],
        },
      ];
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('<objects>');
      expect(xml).toContain('<object');
      expect(xml).toContain('name="pole"');
    });

    it('should serialize signals', () => {
      const doc = minimalDoc();
      doc.roads = [
        {
          id: '1',
          name: '',
          length: 100,
          junction: '-1',
          planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
          elevationProfile: [],
          lateralProfile: [],
          laneOffset: [],
          lanes: [
            {
              s: 0,
              leftLanes: [],
              centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
              rightLanes: [],
            },
          ],
          objects: [],
          signals: [
            {
              id: '1',
              name: 'stop',
              s: 490,
              t: -4,
              orientation: '+',
              dynamic: 'no',
              country: 'US',
              type: '206',
            },
          ],
        },
      ];
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('<signals>');
      expect(xml).toContain('<signal');
      expect(xml).toContain('name="stop"');
      expect(xml).toContain('orientation="+"');
      expect(xml).toContain('country="US"');
    });

    it('should omit optional signal attributes when undefined', () => {
      const doc = minimalDoc();
      doc.roads = [
        {
          id: '1',
          name: '',
          length: 100,
          junction: '-1',
          planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
          elevationProfile: [],
          lateralProfile: [],
          laneOffset: [],
          lanes: [
            {
              s: 0,
              leftLanes: [],
              centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
              rightLanes: [],
            },
          ],
          objects: [],
          signals: [{ id: '1', s: 0, t: 0, orientation: '+' }],
        },
      ];
      const xml = serializer.serializeFormatted(doc);
      expect(xml).not.toContain('pitch=');
      expect(xml).not.toContain('roll=');
      expect(xml).not.toContain('width=');
      expect(xml).not.toContain('height=');
    });
  });

  describe('controllers', () => {
    it('should serialize controllers', () => {
      const doc = minimalDoc();
      doc.controllers = [
        {
          id: '1',
          name: 'ctrl1',
          sequence: 1,
          controls: [{ signalId: '1', type: '' }],
        },
      ];
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('<controller');
      expect(xml).toContain('name="ctrl1"');
      expect(xml).toContain('sequence="1"');
      expect(xml).toContain('<control');
      expect(xml).toContain('signalId="1"');
    });
  });

  describe('junctions', () => {
    it('should serialize junctions with connections and lane links', () => {
      const doc = minimalDoc();
      doc.junctions = [
        {
          id: '100',
          name: 'jct1',
          type: 'default',
          connections: [
            {
              id: '1',
              incomingRoad: '1',
              connectingRoad: '2',
              contactPoint: 'start',
              laneLinks: [
                { from: 1, to: 1 },
                { from: -1, to: -1 },
              ],
            },
          ],
        },
      ];
      const xml = serializer.serializeFormatted(doc);
      expect(xml).toContain('<junction');
      expect(xml).toContain('id="100"');
      expect(xml).toContain('name="jct1"');
      expect(xml).toContain('type="default"');
      expect(xml).toContain('<connection');
      expect(xml).toContain('incomingRoad="1"');
      expect(xml).toContain('connectingRoad="2"');
      expect(xml).toContain('contactPoint="start"');
      expect(xml).toContain('<laneLink');
    });
  });

  describe('serialize vs serializeFormatted', () => {
    it('serialize should produce compact XML', () => {
      const xml = serializer.serialize(minimalDoc());
      // Compact XML should not have indentation newlines between elements
      // (header will have its own line due to XML decl, but body should be compact)
      const bodyLines = xml.split('\n').filter((l) => l.trim().length > 0);
      // Compact: fewer lines than formatted
      const formattedXml = serializer.serializeFormatted(minimalDoc());
      const formattedLines = formattedXml.split('\n').filter((l) => l.trim().length > 0);
      expect(bodyLines.length).toBeLessThan(formattedLines.length);
    });
  });
});
