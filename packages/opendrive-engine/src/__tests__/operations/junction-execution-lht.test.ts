import { describe, it, expect } from 'vitest';
import type { OdrRoad, OdrGeometry, OdrJunctionConnection } from '@osce/shared';
import { evaluateReferenceLineAtS } from '@osce/opendrive';
import { createOpenDriveStore } from '../../store/opendrive-store.js';
import type { OpenDriveStore } from '../../store/opendrive-store.js';
import { regenerateJunctionConnections } from '../../operations/junction-execution.js';
import { createTestRoad } from '../helpers.js';

/** Evaluate a plan view at s using the canonical reference-line evaluator. */
function evaluateAtS(
  planView: readonly OdrGeometry[],
  s: number,
): { x: number; y: number; hdg: number } {
  return evaluateReferenceLineAtS(planView, s);
}

/** Bidirectional road arm (one left + one right driving lane) with a rule. */
function makeCrossArm(
  id: string,
  length: number,
  hdg: number,
  x: number,
  y: number,
  rule: 'RHT' | 'LHT',
): OdrRoad {
  const drivingLane = (laneId: number) => ({
    id: laneId,
    type: 'driving' as const,
    width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
    roadMarks: [],
  });
  return createTestRoad({
    id,
    length,
    rule,
    planView: [{ s: 0, x, y, hdg, length, type: 'line' }],
    lanes: [
      {
        s: 0,
        leftLanes: [drivingLane(1)],
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
        rightLanes: [drivingLane(-1)],
      },
    ],
  });
}

function makeConnectingRoad(
  id: string,
  predId: string,
  succId: string,
  junctionId: string,
): OdrRoad {
  return createTestRoad({
    id,
    length: 14,
    junction: junctionId,
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 14, type: 'line' }],
    link: {
      predecessor: { elementType: 'road', elementId: predId, contactPoint: 'end' },
      successor: { elementType: 'road', elementId: succId, contactPoint: 'start' },
    },
  });
}

/**
 * Build a "+" junction whose four incoming arms all face the junction at
 * contactPoint 'end', ending 7m out from the origin. All arms share the given
 * traffic rule.
 */
function setupCrossJunction(rule: 'RHT' | 'LHT') {
  const odrStoreApi = createOpenDriveStore();
  const odrStore = odrStoreApi.getState();

  const west = makeCrossArm('10', 43, 0, -50, 0, rule); // end at (-7,0) hdg 0
  const south = makeCrossArm('20', 43, Math.PI / 2, 0, -50, rule); // end at (0,-7)
  const east = makeCrossArm('30', 43, Math.PI, 50, 0, rule); // end at (7,0)
  const north = makeCrossArm('40', 43, -Math.PI / 2, 0, 50, rule); // end at (0,7)

  odrStore.addRoad(west);
  odrStore.addRoad(south);
  odrStore.addRoad(east);
  odrStore.addRoad(north);

  const placeholder1 = makeConnectingRoad('old-1', '10', '30', '100');
  const placeholder2 = makeConnectingRoad('old-2', '20', '40', '100');
  odrStore.addRoad(placeholder1);
  odrStore.addRoad(placeholder2);

  const connections: OdrJunctionConnection[] = [
    { id: 'jc1', incomingRoad: '10', connectingRoad: 'old-1', contactPoint: 'end', laneLinks: [{ from: -1, to: -1 }] },
    { id: 'jc2', incomingRoad: '20', connectingRoad: 'old-2', contactPoint: 'end', laneLinks: [{ from: -1, to: -1 }] },
    { id: 'jc3', incomingRoad: '30', connectingRoad: 'old-1', contactPoint: 'end', laneLinks: [{ from: -1, to: -1 }] },
    { id: 'jc4', incomingRoad: '40', connectingRoad: 'old-2', contactPoint: 'end', laneLinks: [{ from: -1, to: -1 }] },
  ];

  odrStore.addJunction({ id: '100', name: 'Junction 100', connections });

  return { odrStore };
}

/** Collect the incoming lane IDs (laneLinks.from) across a junction's connections. */
function incomingFromSigns(odrStore: OpenDriveStore, junctionId: string): number[] {
  const junction = odrStore.getDocument().junctions.find((j) => j.id === junctionId)!;
  return junction.connections.flatMap((c) => c.laneLinks.map((l) => l.from));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('regenerateJunctionConnections — traffic rule', () => {
  it('RHT: incoming (from) lanes are right lanes (negative) at end-facing arms', () => {
    const { odrStore } = setupCrossJunction('RHT');
    const newIds = regenerateJunctionConnections(odrStore, '100', evaluateAtS);
    expect(newIds.length).toBeGreaterThan(0);

    const signs = incomingFromSigns(odrStore, '100');
    expect(signs.length).toBeGreaterThan(0);
    // All arms face the junction at 'end' → RHT incoming = right lanes (negative)
    expect(signs.every((s) => s < 0)).toBe(true);
  });

  it('LHT: incoming (from) lanes are left lanes (positive) at end-facing arms', () => {
    const { odrStore } = setupCrossJunction('LHT');
    const newIds = regenerateJunctionConnections(odrStore, '100', evaluateAtS);
    expect(newIds.length).toBeGreaterThan(0);

    const signs = incomingFromSigns(odrStore, '100');
    expect(signs.length).toBeGreaterThan(0);
    // LHT mirrors RHT: at 'end' incoming = left lanes (positive)
    expect(signs.every((s) => s > 0)).toBe(true);
  });

  it('LHT selects mirror-image incoming lanes compared to RHT', () => {
    const rht = setupCrossJunction('RHT');
    regenerateJunctionConnections(rht.odrStore, '100', evaluateAtS);
    const rhtSigns = incomingFromSigns(rht.odrStore, '100');

    const lht = setupCrossJunction('LHT');
    regenerateJunctionConnections(lht.odrStore, '100', evaluateAtS);
    const lhtSigns = incomingFromSigns(lht.odrStore, '100');

    expect(rhtSigns.every((s) => s < 0)).toBe(true);
    expect(lhtSigns.every((s) => s > 0)).toBe(true);
  });
});
