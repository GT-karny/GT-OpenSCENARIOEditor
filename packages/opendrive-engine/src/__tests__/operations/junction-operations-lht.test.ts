import { describe, it, expect } from 'vitest';
import type { OdrRoad, OdrLane, OdrGeometry } from '@osce/shared';
import { evaluateReferenceLineAtS } from '@osce/opendrive';
import { planJunctionCreation } from '../../operations/junction-operations.js';
import type { IntersectionResult } from '../../operations/junction-operations.js';
import type { LaneRoutingConfig } from '../../store/editor-metadata-types.js';
import { createTestDocument, createTestRoad } from '../helpers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function evaluateAtS(
  planView: readonly OdrGeometry[],
  s: number,
): { x: number; y: number; hdg: number } {
  return evaluateReferenceLineAtS(planView, s);
}

function makeDrivingLane(id: number): OdrLane {
  return {
    id,
    type: 'driving',
    width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
    roadMarks: [{ sOffset: 0, type: 'solid', color: 'standard' }],
  };
}

/**
 * A bidirectional 2-lane road (one left, one right driving lane) with the
 * given traffic rule.
 */
function makeBidirectionalRoad(
  id: string,
  x: number,
  y: number,
  hdg: number,
  length: number,
  rule: 'RHT' | 'LHT',
): OdrRoad {
  return createTestRoad({
    id,
    name: `Road_${id}`,
    length,
    rule,
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

const anyRouting: LaneRoutingConfig = {
  rightTurnLanes: 'any',
  leftTurnLanes: 'any',
  generateUturn: false,
};

/**
 * Build a "+" X-junction: road A runs east along y=0, road B runs north
 * through the origin. They cross at the midpoint (50, 0)/(*, 0).
 */
function makeCrossingDoc(rule: 'RHT' | 'LHT') {
  const roadA = makeBidirectionalRoad('1', 0, 0, 0, 100, rule);
  const roadB = makeBidirectionalRoad('2', 50, -50, Math.PI / 2, 100, rule);
  const doc = createTestDocument();
  doc.roads = [roadA, roadB];

  const intersection: IntersectionResult = {
    roadIdA: '1',
    roadIdB: '2',
    sA: 50,
    sB: 50,
    point: { x: 50, y: 0 },
    angle: Math.PI / 2,
  };

  return { doc, intersection };
}

/**
 * For a plan, collect the set of incoming lane IDs (connection.laneLinks.from)
 * for connections whose incomingRoad faces the junction at the given contact
 * point. contactPoint comes from the plan's incomingEndpoints.
 */
function incomingLaneSignsAt(
  plan: NonNullable<ReturnType<typeof planJunctionCreation>>,
  contactPoint: 'start' | 'end',
): number[] {
  const roadIds = new Set(
    plan.incomingEndpoints.filter((ep) => ep.contactPoint === contactPoint).map((ep) => ep.roadId),
  );
  const signs: number[] = [];
  for (const conn of plan.junction.connections) {
    if (!roadIds.has(conn.incomingRoad)) continue;
    for (const link of conn.laneLinks) {
      signs.push(link.from);
    }
  }
  return signs;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('planJunctionCreation — traffic rule threading', () => {
  it('RHT: incoming lanes at end are right (negative), at start are left (positive)', () => {
    const { doc, intersection } = makeCrossingDoc('RHT');
    const plan = planJunctionCreation(doc, {
      intersection,
      routingConfig: anyRouting,
      evaluateAtS,
      trafficRule: 'RHT',
    });
    expect(plan).not.toBeNull();

    const endSigns = incomingLaneSignsAt(plan!, 'end');
    const startSigns = incomingLaneSignsAt(plan!, 'start');

    expect(endSigns.length).toBeGreaterThan(0);
    expect(startSigns.length).toBeGreaterThan(0);
    // RHT: at 'end' incoming = right lanes (negative), at 'start' = left (positive)
    expect(endSigns.every((s) => s < 0)).toBe(true);
    expect(startSigns.every((s) => s > 0)).toBe(true);
  });

  it('LHT: incoming lanes at end are left (positive), at start are right (negative)', () => {
    const { doc, intersection } = makeCrossingDoc('LHT');
    const plan = planJunctionCreation(doc, {
      intersection,
      routingConfig: anyRouting,
      evaluateAtS,
      trafficRule: 'LHT',
    });
    expect(plan).not.toBeNull();

    const endSigns = incomingLaneSignsAt(plan!, 'end');
    const startSigns = incomingLaneSignsAt(plan!, 'start');

    expect(endSigns.length).toBeGreaterThan(0);
    expect(startSigns.length).toBeGreaterThan(0);
    // LHT mirrors RHT: at 'end' incoming = left lanes (positive),
    // at 'start' = right (negative)
    expect(endSigns.every((s) => s > 0)).toBe(true);
    expect(startSigns.every((s) => s < 0)).toBe(true);
  });

  it('LHT and RHT select mirror-image incoming lanes for the same crossing', () => {
    const rht = planJunctionCreation(makeCrossingDoc('RHT').doc, {
      intersection: makeCrossingDoc('RHT').intersection,
      routingConfig: anyRouting,
      evaluateAtS,
      trafficRule: 'RHT',
    });
    const lht = planJunctionCreation(makeCrossingDoc('LHT').doc, {
      intersection: makeCrossingDoc('LHT').intersection,
      routingConfig: anyRouting,
      evaluateAtS,
      trafficRule: 'LHT',
    });
    expect(rht).not.toBeNull();
    expect(lht).not.toBeNull();

    // At the 'end' endpoints the sign flips between the two rules.
    const rhtEnd = incomingLaneSignsAt(rht!, 'end');
    const lhtEnd = incomingLaneSignsAt(lht!, 'end');
    expect(rhtEnd.every((s) => s < 0)).toBe(true);
    expect(lhtEnd.every((s) => s > 0)).toBe(true);
  });
});
