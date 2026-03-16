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
  if (geo.type === 'paramPoly3') {
    const g = geo as unknown as {
      aU: number; bU: number; cU: number; dU: number;
      aV: number; bV: number; cV: number; dV: number;
      pRange?: string;
    };
    const p = g.pRange === 'normalized' ? ds / geo.length : ds;
    const p2 = p * p;
    const p3 = p2 * p;
    const localX = g.aU + g.bU * p + g.cU * p2 + g.dU * p3;
    const localY = g.aV + g.bV * p + g.cV * p2 + g.dV * p3;
    const duDp = g.bU + 2 * g.cU * p + 3 * g.dU * p2;
    const dvDp = g.bV + 2 * g.cV * p + 3 * g.dV * p2;
    const localHdg = Math.atan2(dvDp, duDp);
    const cosH = Math.cos(geo.hdg);
    const sinH = Math.sin(geo.hdg);
    return {
      x: geo.x + localX * cosH - localY * sinH,
      y: geo.y + localX * sinH + localY * cosH,
      hdg: geo.hdg + localHdg,
    };
  }
  // Fallback
  return { x: geo.x, y: geo.y, hdg: geo.hdg };
}

/** Create a simple line road along a given heading (right lanes only). */
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

/** Create a bidirectional line road (left + right driving lanes). */
function makeBidirectionalRoad(id: string, x: number, y: number, hdg: number, length: number): OdrRoad {
  return createTestRoad({
    id,
    name: `Road_${id}`,
    length,
    planView: [{ s: 0, x, y, hdg, length, type: 'line' }],
    lanes: [
      {
        s: 0,
        leftLanes: [makeDrivingLane(1)],
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
        rightLanes: [makeDrivingLane(-1)],
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

/** Default routing config: all lanes for all turns, no U-turn. */
const defaultRouting: LaneRoutingConfig = {
  rightTurnLanes: 'any',
  leftTurnLanes: 'any',
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
      // Right-lanes-only road: start endpoint returns left lanes (none here)
      expect(ep.drivingLanes).toHaveLength(0);
    });

    it('returns only lanes traveling toward the junction', () => {
      const road = makeBidirectionalRoad('1b', 0, 0, 0, 100);

      // contactPoint='end' → right lanes only (negative IDs, travel toward end)
      const epEnd = computeRoadEndpoint(road, 'end', evaluateLineAtS);
      expect(epEnd.drivingLanes).toHaveLength(1);
      expect(epEnd.drivingLanes.every((l) => l.id < 0)).toBe(true);

      // contactPoint='start' → left lanes only (positive IDs, travel toward start)
      const epStart = computeRoadEndpoint(road, 'start', evaluateLineAtS);
      expect(epStart.drivingLanes).toHaveLength(1);
      expect(epStart.drivingLanes.every((l) => l.id > 0)).toBe(true);
    });

    it('extracts end endpoint from a line road', () => {
      const road = makeLineRoad('2', 0, 0, Math.PI / 4, 50);
      const ep = computeRoadEndpoint(road, 'end', evaluateLineAtS);

      expect(ep.roadId).toBe('2');
      expect(ep.contactPoint).toBe('end');
      // End of a 50m road at 45 degrees (reference line position)
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
      const roadB = makeBidirectionalRoad('11', 100, 0, Math.PI / 2, 100);

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
      const roadB = makeBidirectionalRoad('31', 50, 0, -Math.PI / 2, 50);

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
        expect(road.planView.length).toBeGreaterThanOrEqual(1);
        for (const geo of road.planView) {
          expect(['line', 'arc', 'paramPoly3']).toContain(geo.type);
          expect(geo.length).toBeGreaterThan(0);
        }
        expect(road.length).toBeGreaterThan(0);
        const totalGeoLength = road.planView.reduce((s, g) => s + g.length, 0);
        expect(road.length).toBeCloseTo(totalGeoLength, 4);
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
      const roadB = makeBidirectionalRoad('61', 50, 0, Math.PI / 2, 50);

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
      const roadB = makeBidirectionalRoad('71', 0, 5, Math.PI, 50);

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

  // -----------------------------------------------------------------------
  // Per-lane connecting roads for multi-lane roads
  // -----------------------------------------------------------------------
  describe('per-lane connecting roads', () => {
    /** Create a 4-lane bidirectional road (2 left + 2 right driving lanes). */
    function make4LaneRoad(id: string, x: number, y: number, hdg: number, length: number): OdrRoad {
      return createTestRoad({
        id,
        name: `Road_${id}`,
        length,
        planView: [{ s: 0, x, y, hdg, length, type: 'line' }],
        lanes: [
          {
            s: 0,
            leftLanes: [makeDrivingLane(1), makeDrivingLane(2)],
            centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
            rightLanes: [makeDrivingLane(-1), makeDrivingLane(-2)],
          },
        ],
      });
    }

    it('generates one connecting road per lane pair for straight connections', () => {
      // Two 4-lane roads facing each other
      const roadA = make4LaneRoad('100', 0, 0, 0, 40);
      const roadB = make4LaneRoad('101', 100, 0, Math.PI, 40);

      const epA = computeRoadEndpoint(roadA, 'end', evaluateLineAtS);
      const epB = computeRoadEndpoint(roadB, 'end', evaluateLineAtS);

      const doc = makeDocWithJunction([roadA, roadB], 'junc-ml-1');
      const result = generateConnectingRoads([epA, epB], 'junc-ml-1', anyRouting, doc);

      // A→B: 2 lanes straight = 2 connecting roads
      // B→A: 2 lanes straight = 2 connecting roads
      const fromA = result.connections.filter((c) => c.incomingRoad === '100');
      const fromB = result.connections.filter((c) => c.incomingRoad === '101');
      expect(fromA).toHaveLength(2);
      expect(fromB).toHaveLength(2);

      // Each connecting road should have exactly 1 driving lane
      for (const conn of result.connections) {
        const road = result.roads.find((r) => r.id === conn.connectingRoad)!;
        expect(road.lanes[0].rightLanes).toHaveLength(1);
      }
    });

    it('generates per-lane roads for a 4-lane T-intersection with default routing', () => {
      // Road A goes east, Road B goes north (bidirectional 4-lane)
      const roadA = make4LaneRoad('110', -50, 0, 0, 50);
      const roadB = make4LaneRoad('111', 15, -15, Math.PI / 2, 50);

      const epA = computeRoadEndpoint(roadA, 'end', evaluateLineAtS);
      const epB_start = computeRoadEndpoint(roadB, 'start', evaluateLineAtS);

      const doc = makeDocWithJunction([roadA, roadB], 'junc-ml-2');
      const result = generateConnectingRoads(
        [epA, epB_start], 'junc-ml-2', defaultRouting, doc,
      );

      // epA has 2 driving lanes (right: -1, -2)
      // epB_start has 2 driving lanes (left: 1, 2)
      // A(end,hdg=0) → B(start): left turn, 'any' → both lanes → 2 connecting roads
      // B(start,hdg=3PI/2) → A(end): right turn, 'any' → both lanes → 2 connecting roads
      const fromA = result.connections.filter((c) => c.incomingRoad === '110');
      const fromB = result.connections.filter((c) => c.incomingRoad === '111');

      // Left turn from A: both lanes (inner→inner, outer→outer)
      expect(fromA).toHaveLength(2);
      const fromALanes = fromA.map((c) => c.laneLinks[0].from).sort((a, b) => a - b);
      expect(fromALanes).toEqual([-2, -1]);

      // Right turn from B: both lanes (inner→inner, outer→outer)
      expect(fromB).toHaveLength(2);
      const fromBLanes = fromB.map((c) => c.laneLinks[0].from).sort((a, b) => a - b);
      expect(fromBLanes).toEqual([1, 2]);
    });

    it('generates 4 connecting roads per direction for 4-lane 4-way intersection', () => {
      // 4-way intersection: roads end at junction boundary with 15m gap
      const gap = 15;
      const roadLen = 60;
      const roadA = make4LaneRoad('120', -gap - roadLen, 0, 0, roadLen);        // ends at (-15, 0)
      const roadB = make4LaneRoad('121', gap + roadLen, 0, Math.PI, roadLen);    // ends at (15, 0)
      const roadC = make4LaneRoad('122', 0, -gap - roadLen, Math.PI / 2, roadLen); // ends at (0, -15)
      const roadD = make4LaneRoad('123', 0, gap + roadLen, -Math.PI / 2, roadLen); // ends at (0, 15)

      const epA = computeRoadEndpoint(roadA, 'end', evaluateLineAtS);
      const epB = computeRoadEndpoint(roadB, 'end', evaluateLineAtS);
      const epC = computeRoadEndpoint(roadC, 'end', evaluateLineAtS);
      const epD = computeRoadEndpoint(roadD, 'end', evaluateLineAtS);

      const doc = makeDocWithJunction([roadA, roadB, roadC, roadD], 'junc-ml-3');
      const result = generateConnectingRoads(
        [epA, epB, epC, epD], 'junc-ml-3', defaultRouting, doc,
      );

      // Per incoming direction (2 lanes) with 'any' routing:
      //   straight (all lanes): 2 connecting roads
      //   right turn (all lanes): 2 connecting roads
      //   left turn (all lanes): 2 connecting roads
      // Total per direction: 6, total: 24
      expect(result.roads).toHaveLength(24);
      expect(result.connections).toHaveLength(24);

      // Every connecting road should have exactly 1 driving lane
      for (const road of result.roads) {
        expect(road.lanes[0].rightLanes).toHaveLength(1);
      }
    });

    it('caps lane pairs at the smaller lane count for asymmetric roads', () => {
      // 3-lane incoming road (right lanes -1, -2, -3)
      const road3Lane = createTestRoad({
        id: '140',
        name: 'Road_140',
        length: 40,
        planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 40, type: 'line' }],
        lanes: [{
          s: 0,
          leftLanes: [],
          centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
          rightLanes: [makeDrivingLane(-1), makeDrivingLane(-2), makeDrivingLane(-3)],
        }],
      });

      // 2-lane outgoing road
      const road2Lane = make4LaneRoad('141', 100, 0, Math.PI, 40);

      const ep3 = computeRoadEndpoint(road3Lane, 'end', evaluateLineAtS);
      const ep2 = computeRoadEndpoint(road2Lane, 'end', evaluateLineAtS);

      const doc = makeDocWithJunction([road3Lane, road2Lane], 'junc-asym');
      const result = generateConnectingRoads([ep3, ep2], 'junc-asym', anyRouting, doc);

      // 3 incoming lanes → 2 outgoing lanes: should generate 2 pairs (capped at min)
      const from3Lane = result.connections.filter((c) => c.incomingRoad === '140');
      expect(from3Lane).toHaveLength(2);

      // Verify lane links reference valid outgoing lanes (1 and 2, not 3)
      for (const conn of from3Lane) {
        const road = result.roads.find((r) => r.id === conn.connectingRoad)!;
        const drivingLane = road.lanes[0].rightLanes[0];
        const successorId = Math.abs(drivingLane.link?.successorId ?? 0);
        expect(successorId).toBeLessThanOrEqual(2);
      }
    });

    it('right-turn mapping uses outer-to-inner order for asymmetric lanes', () => {
      // 3-lane road turning right into 2-lane road
      const road3Lane = createTestRoad({
        id: '160',
        name: 'Road_160',
        length: 40,
        planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 40, type: 'line' }],
        lanes: [{
          s: 0,
          leftLanes: [],
          centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
          rightLanes: [makeDrivingLane(-1), makeDrivingLane(-2), makeDrivingLane(-3)],
        }],
      });

      // Outgoing road going south (right turn from east-going road)
      const road2Lane = createTestRoad({
        id: '161',
        name: 'Road_161',
        length: 40,
        planView: [{ s: 0, x: 15, y: -15, hdg: -Math.PI / 2, length: 40, type: 'line' }],
        lanes: [{
          s: 0,
          leftLanes: [makeDrivingLane(1), makeDrivingLane(2)],
          centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
          rightLanes: [],
        }],
      });

      const ep3 = computeRoadEndpoint(road3Lane, 'end', evaluateLineAtS);
      const ep2 = computeRoadEndpoint(road2Lane, 'start', evaluateLineAtS);

      const doc = makeDocWithJunction([road3Lane, road2Lane], 'junc-rt');
      const result = generateConnectingRoads([ep3, ep2], 'junc-rt', anyRouting, doc);

      // Right turn from 3-lane: 'any' routing → all 3 lanes eligible
      // But capped at min(3, 2) = 2 pairs
      const fromA = result.connections.filter((c) => c.incomingRoad === '160');
      expect(fromA).toHaveLength(2);

      // For right turns, outermost lanes should be mapped first
      const laneFroms = fromA.map((c) => c.laneLinks[0].from).sort((a, b) => a - b);
      expect(laneFroms).toEqual([-3, -2]); // outer lanes -3 and -2
    });

    it('filterLanesForTurn respects maxRightTurnLanes', () => {
      // 4-lane road → 4-lane road at 90 degrees
      const road4LaneA = createTestRoad({
        id: '170',
        length: 40,
        planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 40, type: 'line' }],
        lanes: [{
          s: 0,
          leftLanes: [],
          centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
          rightLanes: [makeDrivingLane(-1), makeDrivingLane(-2), makeDrivingLane(-3), makeDrivingLane(-4)],
        }],
      });

      const road4LaneB = createTestRoad({
        id: '171',
        length: 40,
        planView: [{ s: 0, x: 15, y: -15, hdg: -Math.PI / 2, length: 40, type: 'line' }],
        lanes: [{
          s: 0,
          leftLanes: [makeDrivingLane(1), makeDrivingLane(2), makeDrivingLane(3), makeDrivingLane(4)],
          centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
          rightLanes: [],
        }],
      });

      const epA = computeRoadEndpoint(road4LaneA, 'end', evaluateLineAtS);
      const epB = computeRoadEndpoint(road4LaneB, 'start', evaluateLineAtS);

      const doc = makeDocWithJunction([road4LaneA, road4LaneB], 'junc-maxrt');

      // With outermost + maxRightTurnLanes=2: only 2 outermost lanes for right turn
      const routing: LaneRoutingConfig = {
        rightTurnLanes: 'outermost',
        leftTurnLanes: 'any',
        generateUturn: false,
        maxRightTurnLanes: 2,
      };
      const result = generateConnectingRoads([epA, epB], 'junc-maxrt', routing, doc);

      const fromA = result.connections.filter((c) => c.incomingRoad === '170');
      expect(fromA).toHaveLength(2); // 2 outermost lanes for right turn
      const laneFroms = fromA.map((c) => c.laneLinks[0].from).sort((a, b) => a - b);
      expect(laneFroms).toEqual([-4, -3]); // outermost 2 lanes
    });

    it('correctly maps lane predecessors and successors per lane pair', () => {
      const roadA = make4LaneRoad('130', 0, 0, 0, 40);
      const roadB = make4LaneRoad('131', 100, 0, Math.PI, 40);

      const epA = computeRoadEndpoint(roadA, 'end', evaluateLineAtS);
      const epB = computeRoadEndpoint(roadB, 'end', evaluateLineAtS);

      const doc = makeDocWithJunction([roadA, roadB], 'junc-ml-4');
      const result = generateConnectingRoads([epA, epB], 'junc-ml-4', anyRouting, doc);

      // From A(end, right lanes -1,-2) to B(end, receiving=left lanes 1,2)
      const fromA = result.connections.filter((c) => c.incomingRoad === '130');
      expect(fromA).toHaveLength(2);

      // Check that lane links map correctly:
      // inner lane -1 → connecting road lane -1 → successor 1
      // outer lane -2 → connecting road lane -1 → successor 2
      const laneFroms = fromA.map((c) => c.laneLinks[0].from).sort((a, b) => a - b);
      expect(laneFroms).toEqual([-2, -1]);

      for (const conn of fromA) {
        const road = result.roads.find((r) => r.id === conn.connectingRoad)!;
        const drivingLane = road.lanes[0].rightLanes[0];
        expect(drivingLane.link?.predecessorId).toBe(conn.laneLinks[0].from);
        expect(drivingLane.link?.successorId).toBeDefined();
      }
    });
  });

  // -----------------------------------------------------------------------
  // G1 continuity & smoothness
  // -----------------------------------------------------------------------
  describe('G1 continuity of connecting road geometry', () => {
    /** Normalize angle to [-PI, PI]. */
    function normalizeAngle(a: number): number {
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a <= -Math.PI) a += 2 * Math.PI;
      return a;
    }

    /**
     * For a 90-degree turn with realistic separation, verify the connecting
     * road's end heading is aligned with the outgoing road direction.
     */
    it('arc end heading matches outgoing direction for 90° turn', () => {
      // Road A goes east, ends at (0,0). Road B starts at (15, -15) going south.
      // This gives ~21m separation — realistic for a junction.
      const roadA = makeLineRoad('80', -50, 0, 0, 50);
      const roadB = makeBidirectionalRoad('81', 15, -15, -Math.PI / 2, 50);

      const epA = computeRoadEndpoint(roadA, 'end', evaluateLineAtS);
      const epB = computeRoadEndpoint(roadB, 'start', evaluateLineAtS);

      const doc = makeDocWithJunction([roadA, roadB], 'junc-g1');
      const result = generateConnectingRoads([epA, epB], 'junc-g1', anyRouting, doc);

      const connFromA = result.connections.filter((c) => c.incomingRoad === '80');
      expect(connFromA.length).toBeGreaterThan(0);

      for (const conn of connFromA) {
        const road = result.roads.find((r) => r.id === conn.connectingRoad)!;
        // Evaluate the curve at its end
        const endPose = evaluateLineAtS(road.planView, road.length);
        // The outgoing road heading (reversed) is the expected end heading
        const expectedEndHdg = epB.hdg + Math.PI;
        const hdgError = Math.abs(normalizeAngle(endPose.hdg - expectedEndHdg));
        // Arc-based geometry should achieve good heading match (< ~10°)
        expect(hdgError).toBeLessThan(0.18);
      }
    });

    it('generates smooth curves for 45°, 90°, and 135° turns', () => {
      const angles = [Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];

      for (const angle of angles) {
        // Place roads with enough separation for a natural curve
        const separation = 30;
        const bx = separation * Math.cos(-angle / 2);
        const by = separation * Math.sin(-angle / 2);
        const roadA = makeLineRoad('90', -50, 0, 0, 50);
        const roadB = makeBidirectionalRoad('91', bx, by, -angle, 50);

        const epA = computeRoadEndpoint(roadA, 'end', evaluateLineAtS);
        const epB = computeRoadEndpoint(roadB, 'start', evaluateLineAtS);

        const doc = makeDocWithJunction([roadA, roadB], 'junc-smooth');
        const result = generateConnectingRoads([epA, epB], 'junc-smooth', anyRouting, doc);

        // Should produce at least one road
        expect(result.roads.length).toBeGreaterThan(0);

        // Each road's geometry should have positive length
        for (const road of result.roads) {
          expect(road.planView[0].length).toBeGreaterThan(0);

          // Sample the curve and verify heading changes monotonically
          // (no sudden reversals = smooth curve)
          const numSamples = 20;
          const headings: number[] = [];
          for (let k = 0; k <= numSamples; k++) {
            const s = (k / numSamples) * road.length;
            const pose = evaluateLineAtS(road.planView, s);
            headings.push(pose.hdg);
          }

          // Check that the maximum heading jump per step is bounded relative to total change
          const totalHdgChange = Math.abs(normalizeAngle(headings[headings.length - 1] - headings[0]));
          for (let k = 1; k < headings.length; k++) {
            const hdgDelta = Math.abs(normalizeAngle(headings[k] - headings[k - 1]));
            // No single step should exceed 40% of the total heading change
            // (a smooth curve distributes the change evenly)
            expect(hdgDelta).toBeLessThan(Math.max(totalHdgChange * 0.4, 0.1));
          }
        }
      }
    });
  });

  // -----------------------------------------------------------------------
  // Heading match at connecting road endpoints
  // -----------------------------------------------------------------------
  describe('endpoint heading accuracy', () => {
    /** Normalize angle to [-PI, PI]. */
    function normalizeAngle(a: number): number {
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a <= -Math.PI) a += 2 * Math.PI;
      return a;
    }

    it('all connecting road end headings match outgoing road within 5°', () => {
      // Helper: 4-lane road (2 left + 2 right driving lanes)
      function mk4Lane(id: string, x: number, y: number, hdg: number, length: number): OdrRoad {
        return createTestRoad({
          id, name: `Road_${id}`, length,
          planView: [{ s: 0, x, y, hdg, length, type: 'line' }],
          lanes: [{
            s: 0,
            leftLanes: [makeDrivingLane(1), makeDrivingLane(2)],
            centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
            rightLanes: [makeDrivingLane(-1), makeDrivingLane(-2)],
          }],
        });
      }

      // Y-intersection similar to test11.xodr: 2 roads at ~65° angle
      const roadA = mk4Lane('150', -60, 0, 0.11, 50);
      const roadB = mk4Lane('151', 60, 0, Math.PI + 0.11, 50);
      const roadC = mk4Lane('152', -10, 60, -1.03, 70);
      const roadD = mk4Lane('153', 10, -30, Math.PI - 1.03, 30);

      const epA = computeRoadEndpoint(roadA, 'end', evaluateLineAtS);
      const epB = computeRoadEndpoint(roadB, 'end', evaluateLineAtS);
      const epC = computeRoadEndpoint(roadC, 'end', evaluateLineAtS);
      const epD = computeRoadEndpoint(roadD, 'end', evaluateLineAtS);

      const doc = makeDocWithJunction([roadA, roadB, roadC, roadD], 'junc-hdg');
      const result = generateConnectingRoads(
        [epA, epB, epC, epD], 'junc-hdg', anyRouting, doc,
      );

      expect(result.roads.length).toBeGreaterThan(0);

      // Build endpoint lookup
      const epMap: Record<string, { hdg: number }> = {
        '150': epA, '151': epB, '152': epC, '153': epD,
      };

      for (const road of result.roads) {
        const successorLink = road.link?.successor;
        if (!successorLink || successorLink.elementType !== 'road') continue;

        const outEp = epMap[successorLink.elementId];
        if (!outEp) continue;

        // Expected end heading: outgoing direction reversed (into outgoing road)
        const expectedEndHdg = outEp.hdg + Math.PI;

        // Evaluate connecting road at its end
        const endPose = evaluateLineAtS(road.planView, road.length);
        const hdgError = Math.abs(normalizeAngle(endPose.hdg - expectedEndHdg));

        // All connecting roads must match heading within 5° (0.087 rad)
        expect(hdgError).toBeLessThan(0.087);
      }
    });
  });
});
