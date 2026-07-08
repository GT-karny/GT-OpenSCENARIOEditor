import { describe, it, expect } from 'vitest';
import type { OdrRoad, OdrLane } from '@osce/shared';
import type { RoadEndpoint, TurnType } from '../../builders/connecting-road-builder.js';
import { classifyTurn } from '../../builders/connecting-road-builder.js';
import { buildRoutingOverrides } from '../../builders/routing-presets.js';
import { createTestRoad } from '../helpers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a driving lane with the given ID. */
function makeDrivingLane(id: number): OdrLane {
  return {
    id,
    type: 'driving',
    width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
    roadMarks: [{ sOffset: 0, type: 'solid', color: 'standard' }],
  };
}

/**
 * Build a minimal RoadEndpoint for routing-preset tests. Only the fields
 * consulted by buildRoutingOverrides matter: roadId, contactPoint, hdg,
 * drivingLanes, and trafficRule.
 */
function makeEndpoint(
  roadId: string,
  hdg: number,
  drivingLaneIds: number[],
  trafficRule: 'RHT' | 'LHT',
): RoadEndpoint {
  const road: OdrRoad = createTestRoad({ id: roadId, rule: trafficRule });
  return {
    roadId,
    contactPoint: 'end',
    x: 0,
    y: 0,
    hdg,
    drivingLanes: drivingLaneIds.map(makeDrivingLane),
    road,
    trafficRule,
  };
}

const classifyTurnFn = (inHdg: number, outHdg: number): TurnType =>
  classifyTurn(inHdg, outHdg);

/**
 * Build a 4-arm cross where every incoming endpoint sees exactly one straight,
 * one left, and one right turn among the other arms. Endpoint hdg is the
 * "into junction" direction; the builder derives the outgoing direction as
 * `outgoing.hdg + PI`.
 *
 * Arms point into the junction from W (hdg 0 → east), S (hdg PI/2 → north),
 * E (hdg PI → west), N (hdg -PI/2 → south).
 */
function makeCrossEndpoints(
  drivingLaneIds: number[],
  trafficRule: 'RHT' | 'LHT',
): RoadEndpoint[] {
  return [
    makeEndpoint('W', 0, drivingLaneIds, trafficRule),
    makeEndpoint('S', Math.PI / 2, drivingLaneIds, trafficRule),
    makeEndpoint('E', Math.PI, drivingLaneIds, trafficRule),
    makeEndpoint('N', -Math.PI / 2, drivingLaneIds, trafficRule),
  ];
}

/** Extract the permission entry for a given lane on a given endpoint. */
function permsFor(
  overrides: ReturnType<typeof buildRoutingOverrides>,
  roadId: string,
  laneId: number,
): TurnType[] {
  const ep = overrides.find((o) => o.roadId === roadId);
  const perm = ep?.lanePermissions.find((p) => p.laneId === laneId);
  return perm?.allowedTurns ?? [];
}

// ---------------------------------------------------------------------------
// Sanity: the cross geometry yields all three turn types per arm
// ---------------------------------------------------------------------------

describe('buildRoutingOverrides — cross geometry sanity', () => {
  it('every arm sees straight, left, and right turns', () => {
    const endpoints = makeCrossEndpoints([-1, -2], 'RHT');
    for (const incoming of endpoints) {
      const turns = new Set<TurnType>();
      for (const outgoing of endpoints) {
        if (incoming.roadId === outgoing.roadId) continue;
        turns.add(classifyTurnFn(incoming.hdg, outgoing.hdg + Math.PI));
      }
      expect(turns).toEqual(new Set<TurnType>(['straight', 'left', 'right']));
    }
  });
});

// ---------------------------------------------------------------------------
// 'dedicated' preset — 2-lane arms
// ---------------------------------------------------------------------------

describe("buildRoutingOverrides — 'dedicated' 2-lane", () => {
  // Two driving lanes: inner = |1| smaller, outer = |2| larger.
  const laneIds = [-1, -2];

  it('RHT: inner lane gets left, outer lane gets right (both straight)', () => {
    const overrides = buildRoutingOverrides('dedicated', makeCrossEndpoints(laneIds, 'RHT'), classifyTurnFn);

    // Inner lane (-1): straight + left
    expect(new Set(permsFor(overrides, 'W', -1))).toEqual(new Set<TurnType>(['straight', 'left']));
    // Outer lane (-2): straight + right
    expect(new Set(permsFor(overrides, 'W', -2))).toEqual(new Set<TurnType>(['straight', 'right']));
  });

  it('LHT mirrors RHT: inner lane gets right, outer lane gets left', () => {
    const overrides = buildRoutingOverrides('dedicated', makeCrossEndpoints(laneIds, 'LHT'), classifyTurnFn);

    // Inner lane (-1): straight + right (mirror of RHT)
    expect(new Set(permsFor(overrides, 'W', -1))).toEqual(new Set<TurnType>(['straight', 'right']));
    // Outer lane (-2): straight + left (mirror of RHT)
    expect(new Set(permsFor(overrides, 'W', -2))).toEqual(new Set<TurnType>(['straight', 'left']));
  });
});

// ---------------------------------------------------------------------------
// 'dedicated' preset — 3+-lane arms
// ---------------------------------------------------------------------------

describe("buildRoutingOverrides — 'dedicated' 3+-lane", () => {
  // Three driving lanes: inner |1|, middle |2|, outer |3|.
  const laneIds = [-1, -2, -3];

  it('RHT: innermost=left+straight, middle=straight, outermost=right+straight', () => {
    const overrides = buildRoutingOverrides('dedicated', makeCrossEndpoints(laneIds, 'RHT'), classifyTurnFn);

    expect(new Set(permsFor(overrides, 'W', -1))).toEqual(new Set<TurnType>(['left', 'straight']));
    expect(new Set(permsFor(overrides, 'W', -2))).toEqual(new Set<TurnType>(['straight']));
    expect(new Set(permsFor(overrides, 'W', -3))).toEqual(new Set<TurnType>(['right', 'straight']));
  });

  it('LHT mirrors RHT: innermost=right+straight, middle=straight, outermost=left+straight', () => {
    const overrides = buildRoutingOverrides('dedicated', makeCrossEndpoints(laneIds, 'LHT'), classifyTurnFn);

    expect(new Set(permsFor(overrides, 'W', -1))).toEqual(new Set<TurnType>(['right', 'straight']));
    expect(new Set(permsFor(overrides, 'W', -2))).toEqual(new Set<TurnType>(['straight']));
    expect(new Set(permsFor(overrides, 'W', -3))).toEqual(new Set<TurnType>(['left', 'straight']));
  });
});

// ---------------------------------------------------------------------------
// Non-'dedicated' presets are unaffected by traffic rule
// ---------------------------------------------------------------------------

describe("buildRoutingOverrides — 'all' / 'custom'", () => {
  it("'all' returns no overrides regardless of rule", () => {
    expect(buildRoutingOverrides('all', makeCrossEndpoints([-1, -2], 'LHT'), classifyTurnFn)).toEqual([]);
    expect(buildRoutingOverrides('all', makeCrossEndpoints([-1, -2], 'RHT'), classifyTurnFn)).toEqual([]);
  });

  it("'custom' returns existing overrides unchanged", () => {
    const existing = [
      { roadId: 'W', contactPoint: 'end' as const, lanePermissions: [{ laneId: -1, allowedTurns: ['left' as const] }] },
    ];
    expect(
      buildRoutingOverrides('custom', makeCrossEndpoints([-1, -2], 'LHT'), classifyTurnFn, existing),
    ).toBe(existing);
  });
});
