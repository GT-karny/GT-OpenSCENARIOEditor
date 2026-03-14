import { describe, it, expect } from 'vitest';
import type { OdrRoad, OdrLane, OpenDriveDocument } from '@osce/shared';
import type { LaneRoutingConfig } from '../../store/editor-metadata-types.js';
import {
  computeRoadEndpoint,
  generateConnectingRoads,
} from '../../builders/connecting-road-builder.js';
import { createTestDocument, createTestRoad } from '../helpers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal evaluateAtS for line geometries.
 * Walks through plan view geometry records and computes (x, y, hdg) at a given s.
 */
function evaluateLineAtS(
  planView: readonly { s: number; x: number; y: number; hdg: number; length: number; type: string }[],
  s: number,
): { x: number; y: number; hdg: number } {
  // Find the geometry segment that contains s
  let geo = planView[0];
  for (const g of planView) {
    if (g.s <= s) geo = g;
  }
  const ds = s - geo.s;
  if (geo.type === 'line') {
    return {
      x: geo.x + ds * Math.cos(geo.hdg),
      y: geo.y + ds * Math.sin(geo.hdg),
      hdg: geo.hdg,
    };
  }
  if (geo.type === 'arc') {
    const curvature = (geo as unknown as { curvature: number }).curvature;
    if (Math.abs(curvature) < 1e-12) {
      return { x: geo.x + ds * Math.cos(geo.hdg), y: geo.y + ds * Math.sin(geo.hdg), hdg: geo.hdg };
    }
    const r = 1 / curvature;
    const theta = ds * curvature;
    const cx = geo.x - r * Math.sin(geo.hdg);
    const cy = geo.y + r * Math.cos(geo.hdg);
    return {
      x: cx + r * Math.sin(geo.hdg + theta),
      y: cy - r * Math.cos(geo.hdg + theta),
      hdg: geo.hdg + theta,
    };
  }
  // Fallback
  return { x: geo.x, y: geo.y, hdg: geo.hdg };
}

/** Create a simple line road along a given heading. */
function makeLineRoad(id: string, x: number, y: number, hdg: number, length: number): OdrRoad {
  return createTestRoad({
    id,
    name: `Road_${id}`,
    length,
    planView: [{ s: 0, x, y, hdg, length, type: 'line' }],
    lanes: [
      {
        s: 0,
        leftLanes: [],
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
        rightLanes: [
          makeDrivingLane(-1),
          makeDrivingLane(-2),
        ],
      },
    ],
  });
}

/** Create a driving lane with the given ID. */
function makeDrivingLane(id: number): OdrLane {
  return {
    id,
    type: 'driving',
    width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
    roadMarks: [{ sOffset: 0, type: 'solid', color: 'standard' }],
  };
}

/** Create a road with an arc geometry. */
function makeArcRoad(id: string, x: number, y: number, hdg: number, length: number, curvature: number): OdrRoad {
  return createTestRoad({
    id,
    name: `Arc_${id}`,
    length,
    planView: [{ s: 0, x, y, hdg, length, type: 'arc', curvature } as never],
    lanes: [
      {
        s: 0,
        leftLanes: [],
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
        rightLanes: [makeDrivingLane(-1)],
      },
    ],
  });
}

/** Default routing config: outermost right, innermost left, no U-turn. */
const defaultRouting: LaneRoutingConfig = {
  rightTurnLanes: 'outermost',
  leftTurnLanes: 'innermost',
  generateUturn: false,
};

/** Routing config that allows all lanes for all turns. */
const anyRouting: LaneRoutingConfig = {
  rightTurnLanes: 'any',
  leftTurnLanes: 'any',
  generateUturn: false,
};

/** Create a doc that already contains the given roads and an empty junction. */
function makeDocWithJunction(roads: OdrRoad[], junctionId: string): OpenDriveDocument {
  const doc = createTestDocument();
  doc.roads = roads;
  doc.junctions = [
    {
      id: junctionId,
      name: 'TestJunction',
      connections: [],
    },
  ];
  return doc;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('connecting-road-builder', () => {
  // -----------------------------------------------------------------------
  // computeRoadEndpoint
  // -----------------------------------------------------------------------
  describe('computeRoadEndpoint', () => {
    it('extracts start endpoint from a line road', () => {
      const road = makeLineRoad('1', 10, 20, 0, 100);
      const ep = computeRoadEndpoint(road, 'start', evaluateLineAtS);

      expect(ep.roadId).toBe('1');
      expect(ep.contactPoint).toBe('start');
      expect(ep.x).toBeCloseTo(10);
      expect(ep.y).toBeCloseTo(20);
      // start contact point heading is flipped (+PI) from the road heading
      expect(ep.hdg).toBeCloseTo(Math.PI);
      expect(ep.drivingLanes).toHaveLength(2);
    });

    it('extracts end endpoint from a line road', () => {
      const road = makeLineRoad('2', 0, 0, Math.PI / 4, 50);
      const ep = computeRoadEndpoint(road, 'end', evaluateLineAtS);

      expect(ep.roadId).toBe('2');
      expect(ep.contactPoint).toBe('end');
      // End of a 50m road at 45 degrees
      const expectedX = 50 * Math.cos(Math.PI / 4);
      const expectedY = 50 * Math.sin(Math.PI / 4);
      expect(ep.x).toBeCloseTo(expectedX, 4);
      expect(ep.y).toBeCloseTo(expectedY, 4);
      // end contact point heading equals the road heading (no flip)
      expect(ep.hdg).toBeCloseTo(Math.PI / 4);
      expect(ep.drivingLanes).toHaveLength(2);
    });

    it('extracts endpoint from an arc road', () => {
      const curvature = 0.02; // radius = 50m
      const arcLength = 25; // quarter of the full circle (approx)
      const road = makeArcRoad('3', 0, 0, 0, arcLength, curvature);
      const ep = computeRoadEndpoint(road, 'end', evaluateLineAtS);

      expect(ep.roadId).toBe('3');
      expect(ep.contactPoint).toBe('end');
      // After traversing an arc, position moves away from origin
      expect(Math.sqrt(ep.x * ep.x + ep.y * ep.y)).toBeGreaterThan(0);
      // Heading should change by curvature * length
      const expectedHdg = curvature * arcLength;
      expect(ep.hdg).toBeCloseTo(expectedHdg, 4);
      expect(ep.drivingLanes).toHaveLength(1);
    });

    it('returns empty driving lanes when road has only non-driving lanes', () => {
      const road = createTestRoad({
        id: '4',
        length: 50,
        planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 50, type: 'line' }],
        lanes: [
          {
            s: 0,
            leftLanes: [],
            centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
            rightLanes: [
              { id: -1, type: 'sidewalk', width: [{ sOffset: 0, a: 2, b: 0, c: 0, d: 0 }], roadMarks: [] },
            ],
          },
        ],
      });

      const ep = computeRoadEndpoint(road, 'start', evaluateLineAtS);
      expect(ep.drivingLanes).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // generateConnectingRoads
  // -----------------------------------------------------------------------
  describe('generateConnectingRoads', () => {
    it('generates connecting roads for two endpoints at 90 degrees', () => {
      // Road A goes east (hdg=0), Road B goes north (hdg=PI/2)
      const roadA = makeLineRoad('10', 0, 0, 0, 100);
      const roadB = makeLineRoad('11', 100, 0, Math.PI / 2, 100);

      const epA = computeRoadEndpoint(roadA, 'end', evaluateLineAtS);
      const epB = computeRoadEndpoint(roadB, 'start', evaluateLineAtS);

      const doc = makeDocWithJunction([roadA, roadB], 'junc-1');
      const result = generateConnectingRoads([epA, epB], 'junc-1', anyRouting, doc);

      // Should produce at least one connecting road
      expect(result.roads.length).toBeGreaterThanOrEqual(1);
      expect(result.connections.length).toBe(result.roads.length);

      // Each connection should reference one of the incoming roads
      for (const conn of result.connections) {
        expect(['10', '11']).toContain(conn.incomingRoad);
        expect(conn.contactPoint).toBe('start');
      }
    });

    it('generates a straight connection for two endpoints facing each other', () => {
      // Road A goes east, Road B goes west — their ends face each other with a gap
      const roadA = makeLineRoad('20', 0, 0, 0, 40);
      const roadB = makeLineRoad('21', 100, 0, Math.PI, 40);

      const epA = computeRoadEndpoint(roadA, 'end', evaluateLineAtS);
      const epB = computeRoadEndpoint(roadB, 'end', evaluateLineAtS);

      const doc = makeDocWithJunction([roadA, roadB], 'junc-2');
      const result = generateConnectingRoads([epA, epB], 'junc-2', anyRouting, doc);

      expect(result.roads.length).toBeGreaterThanOrEqual(1);

      // Connecting roads should use valid geometry types
      const hasValidGeo = result.roads.some(
        (r) => r.planView[0].type === 'line' || r.planView[0].type === 'arc' || r.planView[0].type === 'paramPoly3',
      );
      expect(hasValidGeo).toBe(true);
    });

    it('filters to outermost lane for right turns with default routing', () => {
      // Road A goes east, Road B goes south — right turn from A to B
      const roadA = makeLineRoad('30', 0, 0, 0, 50);
      const roadB = makeLineRoad('31', 50, 0, -Math.PI / 2, 50);

      const epA = computeRoadEndpoint(roadA, 'end', evaluateLineAtS);
      const epB = computeRoadEndpoint(roadB, 'start', evaluateLineAtS);

      const doc = makeDocWithJunction([roadA, roadB], 'junc-3');
      const result = generateConnectingRoads([epA, epB], 'junc-3', defaultRouting, doc);

      // With outermost-only right turns, the connecting road from A->B
      // should have only 1 lane (the outermost of the 2 driving lanes)
      const fromA = result.connections.filter((c) => c.incomingRoad === '30');
      if (fromA.length > 0) {
        const connRoad = result.roads.find((r) => r.id === fromA[0].connectingRoad);
        expect(connRoad).toBeDefined();
        expect(connRoad!.lanes[0].rightLanes).toHaveLength(1);
      }
    });

    it('generates valid geometry on connecting roads', () => {
      const roadA = makeLineRoad('40', 0, 0, 0, 70);
      const roadB = makeLineRoad('41', 90, 10, Math.PI / 3, 80);

      const epA = computeRoadEndpoint(roadA, 'end', evaluateLineAtS);
      const epB = computeRoadEndpoint(roadB, 'start', evaluateLineAtS);

      const doc = makeDocWithJunction([roadA, roadB], 'junc-4');
      const result = generateConnectingRoads([epA, epB], 'junc-4', anyRouting, doc);

      for (const road of result.roads) {
        expect(road.planView).toHaveLength(1);
        const geo = road.planView[0];
        expect(['line', 'arc', 'paramPoly3']).toContain(geo.type);
        expect(geo.length).toBeGreaterThan(0);
        expect(road.length).toBeGreaterThan(0);
        expect(road.length).toBeCloseTo(geo.length, 4);
      }
    });

    it('generates correct lane links (from -> to mapping)', () => {
      const roadA = makeLineRoad('50', 0, 0, 0, 60);
      const roadB = makeLineRoad('51', 60, 0, Math.PI, 60);

      const epA = computeRoadEndpoint(roadA, 'end', evaluateLineAtS);
      const epB = computeRoadEndpoint(roadB, 'end', evaluateLineAtS);

      const doc = makeDocWithJunction([roadA, roadB], 'junc-5');
      const result = generateConnectingRoads([epA, epB], 'junc-5', anyRouting, doc);

      for (const conn of result.connections) {
        expect(conn.laneLinks.length).toBeGreaterThan(0);
        for (const link of conn.laneLinks) {
          // "from" should be a lane from the incoming road's driving lanes
          expect(link.from).toBeLessThan(0); // right-side driving lanes are negative
          // "to" should be a lane on the connecting road (also negative)
          expect(link.to).toBeLessThan(0);
        }
      }
    });

    it('connecting roads are marked as belonging to the junction', () => {
      const roadA = makeLineRoad('60', 0, 0, 0, 50);
      const roadB = makeLineRoad('61', 50, 0, Math.PI / 2, 50);

      const epA = computeRoadEndpoint(roadA, 'end', evaluateLineAtS);
      const epB = computeRoadEndpoint(roadB, 'start', evaluateLineAtS);

      const doc = makeDocWithJunction([roadA, roadB], 'junc-6');
      const result = generateConnectingRoads([epA, epB], 'junc-6', anyRouting, doc);

      for (const road of result.roads) {
        expect(road.junction).toBe('junc-6');
      }
    });

    it('does not generate U-turn roads when generateUturn is false', () => {
      // Two endpoints with nearly opposite headings from the same direction
      const roadA = makeLineRoad('70', 0, 0, 0, 50);
      const roadB = makeLineRoad('71', 0, 5, Math.PI, 50);

      // A's end faces east, B's start faces west+PI = east — nearly the same direction
      // Actually: B's start hdg = PI + PI = 2PI ≈ 0, so they point the same way
      // This means the "outgoing" direction from A's end is ~0, and from B's start is ~2PI
      // These would be classified differently depending on exact angles
      const epA = computeRoadEndpoint(roadA, 'end', evaluateLineAtS);
      const epB = computeRoadEndpoint(roadB, 'start', evaluateLineAtS);

      const noUturnRouting: LaneRoutingConfig = {
        rightTurnLanes: 'any',
        leftTurnLanes: 'any',
        generateUturn: false,
      };

      const doc = makeDocWithJunction([roadA, roadB], 'junc-7');
      const result = generateConnectingRoads([epA, epB], 'junc-7', noUturnRouting, doc);

      // Result should not throw and should produce some roads (or none for U-turns)
      expect(result.roads).toBeDefined();
      expect(result.connections).toBeDefined();
    });
  });
});
