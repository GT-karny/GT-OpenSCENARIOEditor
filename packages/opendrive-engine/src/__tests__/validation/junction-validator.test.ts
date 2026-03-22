import { describe, it, expect } from 'vitest';
import type { OdrRoad, OdrJunction, OdrJunctionConnection } from '@osce/shared';
import { validateJunctionPlan } from '../../validation/junction-validator.js';
import type { JunctionCreationPlan, RoadSplitInfo } from '../../operations/junction-operations.js';
import type { JunctionMetadata, VirtualRoad } from '../../store/editor-metadata-types.js';
import { createTestRoad, createTestDocument } from '../helpers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSegmentRoad(id: string, length: number, hdg = 0, x = 0, y = 0): OdrRoad {
  return createTestRoad({
    id,
    length,
    planView: [{ s: 0, x, y, hdg, length, type: 'line' }],
    lanes: [
      {
        s: 0,
        leftLanes: [],
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
        rightLanes: [
          {
            id: -1,
            type: 'driving',
            width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
            roadMarks: [],
          },
        ],
      },
    ],
  });
}

function makeConnectingRoad(
  id: string,
  predRoadId: string,
  predContact: 'start' | 'end',
  succRoadId: string,
  succContact: 'start' | 'end',
  startX: number,
  startY: number,
  startHdg: number,
  length: number,
): OdrRoad {
  return createTestRoad({
    id,
    length,
    junction: 'junc-1',
    planView: [{ s: 0, x: startX, y: startY, hdg: startHdg, length, type: 'line' }],
    link: {
      predecessor: { elementType: 'road', elementId: predRoadId, contactPoint: predContact },
      successor: { elementType: 'road', elementId: succRoadId, contactPoint: succContact },
    },
    lanes: [
      {
        s: 0,
        leftLanes: [],
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
        rightLanes: [
          {
            id: -1,
            type: 'driving',
            width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
            roadMarks: [],
          },
        ],
      },
    ],
  });
}

function makeBasicPlan(overrides?: Partial<JunctionCreationPlan>): JunctionCreationPlan {
  // Two roads crossing at right angles:
  // Road A: horizontal, split at x=50 into before(0-43) and after(57-100)
  // Road B: vertical, split at y=50 into before(0-43) and after(57-100)
  const segA_before = makeSegmentRoad('seg-a-before', 43, 0, 0, 0);
  const segA_after = makeSegmentRoad('seg-a-after', 43, 0, 57, 0);
  const segB_before = makeSegmentRoad('seg-b-before', 43, Math.PI / 2, 50, 0);
  const segB_after = makeSegmentRoad('seg-b-after', 43, Math.PI / 2, 50, 57);

  const connections: OdrJunctionConnection[] = [
    { id: 'c1', incomingRoad: 'seg-a-before', connectingRoad: 'conn-1', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
    { id: 'c2', incomingRoad: 'seg-a-after', connectingRoad: 'conn-2', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
    { id: 'c3', incomingRoad: 'seg-b-before', connectingRoad: 'conn-3', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
    { id: 'c4', incomingRoad: 'seg-b-after', connectingRoad: 'conn-4', contactPoint: 'start', laneLinks: [{ from: -1, to: -1 }] },
  ];

  const junction: OdrJunction = {
    id: 'junc-1',
    name: 'Junction 1',
    type: 'default',
    connections,
  };

  const connectingRoads: OdrRoad[] = [
    makeConnectingRoad('conn-1', 'seg-a-before', 'end', 'seg-b-after', 'start', 43, 0, Math.PI / 2, 14),
    makeConnectingRoad('conn-2', 'seg-a-after', 'start', 'seg-b-before', 'end', 57, 0, -Math.PI / 2, 14),
    makeConnectingRoad('conn-3', 'seg-b-before', 'end', 'seg-a-after', 'start', 50, 43, 0, 14),
    makeConnectingRoad('conn-4', 'seg-b-after', 'start', 'seg-a-before', 'end', 50, 57, Math.PI, 14),
  ];

  const roadSplits: RoadSplitInfo[] = [
    { originalRoadId: 'road-a', beforeSegment: segA_before, afterSegment: segA_after },
    { originalRoadId: 'road-b', beforeSegment: segB_before, afterSegment: segB_after },
  ];

  const virtualRoads: VirtualRoad[] = [
    { virtualRoadId: 'road-a', segmentRoadIds: ['seg-a-before', 'seg-a-after'] },
    { virtualRoadId: 'road-b', segmentRoadIds: ['seg-b-before', 'seg-b-after'] },
  ];

  const junctionMetadata: JunctionMetadata = {
    junctionId: 'junc-1',
    intersectingVirtualRoadIds: ['road-a', 'road-b'],
    connectingRoadIds: ['conn-1', 'conn-2', 'conn-3', 'conn-4'],
    autoCreated: true,
  };

  const incomingEndpoints = [
    { roadId: 'seg-a-before', contactPoint: 'end' as const },
    { roadId: 'seg-a-after', contactPoint: 'start' as const },
    { roadId: 'seg-b-before', contactPoint: 'end' as const },
    { roadId: 'seg-b-after', contactPoint: 'start' as const },
  ];

  return {
    junction,
    connectingRoads,
    junctionMetadata,
    incomingEndpoints,
    roadSplits,
    virtualRoads,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validateJunctionPlan', () => {
  const doc = createTestDocument();

  describe('valid plans', () => {
    it('accepts a well-formed 4-arm junction plan', () => {
      const plan = makeBasicPlan();
      const result = validateJunctionPlan(plan, doc);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('segment validation', () => {
    it('warns on very short segments', () => {
      const plan = makeBasicPlan();
      plan.roadSplits[0].beforeSegment = makeSegmentRoad('seg-a-before', 0.3);
      const result = validateJunctionPlan(plan, doc);
      expect(result.warnings.some((w) => w.code === 'SHORT_SEGMENT')).toBe(true);
    });

    it('errors on segments with no geometry', () => {
      const plan = makeBasicPlan();
      plan.roadSplits[0].beforeSegment = {
        ...makeSegmentRoad('seg-a-before', 10),
        planView: [],
      };
      const result = validateJunctionPlan(plan, doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'SEGMENT_NO_GEOMETRY')).toBe(true);
    });

    it('errors on segments with no lanes', () => {
      const plan = makeBasicPlan();
      plan.roadSplits[0].afterSegment = {
        ...makeSegmentRoad('seg-a-after', 10),
        lanes: [],
      };
      const result = validateJunctionPlan(plan, doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'SEGMENT_NO_LANES')).toBe(true);
    });
  });

  describe('connection count validation', () => {
    it('errors when no connections exist', () => {
      const plan = makeBasicPlan();
      plan.junction.connections = [];
      const result = validateJunctionPlan(plan, doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'NO_CONNECTIONS')).toBe(true);
    });

    it('warns when connection count is less than arm count', () => {
      const plan = makeBasicPlan();
      // 4 arms but only 2 connections
      plan.junction.connections = plan.junction.connections.slice(0, 2);
      const result = validateJunctionPlan(plan, doc);
      expect(result.warnings.some((w) => w.code === 'FEW_CONNECTIONS')).toBe(true);
    });
  });

  describe('connecting road geometry validation', () => {
    it('errors on connecting roads with no geometry', () => {
      const plan = makeBasicPlan();
      plan.connectingRoads[0] = { ...plan.connectingRoads[0], planView: [] };
      const result = validateJunctionPlan(plan, doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'CONN_NO_GEOMETRY')).toBe(true);
    });

    it('errors on zero-length connecting roads', () => {
      const plan = makeBasicPlan();
      plan.connectingRoads[0] = {
        ...plan.connectingRoads[0],
        length: 0.001,
        planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 0.001, type: 'line' }],
      };
      const result = validateJunctionPlan(plan, doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'CONN_ZERO_LENGTH')).toBe(true);
    });

    it('errors on self-looping connecting roads', () => {
      const plan = makeBasicPlan();
      // Create a connecting road that loops back using an arc
      plan.connectingRoads[0] = {
        ...plan.connectingRoads[0],
        length: 6.28, // ~2*PI, full circle with radius 1
        planView: [{
          s: 0,
          x: 43,
          y: 0,
          hdg: Math.PI / 2,
          length: 6.28,
          type: 'arc',
          curvature: 1.0,
        }],
      };
      const result = validateJunctionPlan(plan, doc);
      expect(result.errors.some((e) => e.code === 'CONN_SELF_LOOP')).toBe(true);
    });
  });

  describe('insufficient arms', () => {
    it('errors with only 1 arm', () => {
      const plan = makeBasicPlan();
      plan.incomingEndpoints = [{ roadId: 'seg-a-before', contactPoint: 'end' }];
      const result = validateJunctionPlan(plan, doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INSUFFICIENT_ARMS')).toBe(true);
    });
  });
});
