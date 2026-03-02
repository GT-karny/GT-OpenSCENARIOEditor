import { describe, it, expect } from 'vitest';
import { buildJunctionSurfaceMesh } from '../../mesh/junction-surface-builder.js';
import type { OdrRoad, OdrJunction } from '@osce/shared';

/** Create a simple straight road for testing. */
function makeRoad(
  id: string,
  length: number,
  hdg: number,
  startX: number,
  startY: number,
  opts?: {
    junctionId?: string;
    successorJunction?: string;
    predecessorJunction?: string;
  },
): OdrRoad {
  return {
    id,
    name: `Road ${id}`,
    length,
    junction: opts?.junctionId ?? '-1',
    link: {
      ...(opts?.successorJunction
        ? { successor: { elementType: 'junction', elementId: opts.successorJunction } }
        : {}),
      ...(opts?.predecessorJunction
        ? { predecessor: { elementType: 'junction', elementId: opts.predecessorJunction } }
        : {}),
    },
    planView: [{ s: 0, x: startX, y: startY, hdg, length, type: 'line' as const }],
    elevationProfile: [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
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
          },
        ],
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
    objects: [],
    signals: [],
  };
}

describe('buildJunctionSurfaceMesh', () => {
  it('should return null when fewer than 2 incoming roads', () => {
    const road1 = makeRoad('1', 50, 0, 0, 0, { successorJunction: 'J1' });
    const connRoad = makeRoad('10', 10, 0, 50, 0, { junctionId: 'J1' });

    const junction: OdrJunction = {
      id: 'J1',
      name: 'Junction 1',
      connections: [
        { id: 'c1', incomingRoad: '1', connectingRoad: '10', contactPoint: 'start', laneLinks: [] },
      ],
    };

    const result = buildJunctionSurfaceMesh(junction, [road1, connRoad]);
    expect(result).toBeNull();
  });

  it('should generate surface mesh for T-junction with 2 incoming roads', () => {
    // Road 1: horizontal, ending at junction
    const road1 = makeRoad('1', 50, 0, 0, 0, { successorJunction: 'J1' });
    // Road 2: vertical, ending at junction
    const road2 = makeRoad('2', 50, Math.PI / 2, 60, -50, { successorJunction: 'J1' });
    // Connecting road inside junction
    const connRoad = makeRoad('10', 15, Math.PI / 4, 50, 0, { junctionId: 'J1' });

    const junction: OdrJunction = {
      id: 'J1',
      name: 'Junction 1',
      connections: [
        { id: 'c1', incomingRoad: '1', connectingRoad: '10', contactPoint: 'start', laneLinks: [] },
        { id: 'c2', incomingRoad: '2', connectingRoad: '10', contactPoint: 'end', laneLinks: [] },
      ],
    };

    const result = buildJunctionSurfaceMesh(junction, [road1, road2, connRoad]);

    expect(result).not.toBeNull();
    expect(result!.junctionId).toBe('J1');
    expect(result!.vertices).toBeInstanceOf(Float32Array);
    expect(result!.indices).toBeInstanceOf(Uint32Array);
    expect(result!.vertices.length).toBeGreaterThan(0);
    expect(result!.indices.length).toBeGreaterThan(0);

    // Vertices should be xyz triples
    expect(result!.vertices.length % 3).toBe(0);
    // Indices should be triangle triples
    expect(result!.indices.length % 3).toBe(0);

    // No NaN in vertices
    for (let i = 0; i < result!.vertices.length; i++) {
      expect(Number.isNaN(result!.vertices[i])).toBe(false);
    }

    // All indices should reference valid vertices
    const vertexCount = result!.vertices.length / 3;
    for (let i = 0; i < result!.indices.length; i++) {
      expect(result!.indices[i]).toBeLessThan(vertexCount);
    }
  });

  it('should handle missing connecting road gracefully', () => {
    // Two incoming roads but connecting road ID doesn't match any road
    const road1 = makeRoad('1', 50, 0, 0, 0, { successorJunction: 'J1' });
    const road2 = makeRoad('2', 50, Math.PI / 2, 60, -50, { successorJunction: 'J1' });

    const junction: OdrJunction = {
      id: 'J1',
      name: 'Junction 1',
      connections: [
        { id: 'c1', incomingRoad: '1', connectingRoad: 'missing', contactPoint: 'start', laneLinks: [] },
        { id: 'c2', incomingRoad: '2', connectingRoad: 'missing', contactPoint: 'end', laneLinks: [] },
      ],
    };

    // Should still produce a mesh from incoming road boundary points alone
    const result = buildJunctionSurfaceMesh(junction, [road1, road2]);
    expect(result).not.toBeNull();
    expect(result!.junctionId).toBe('J1');
    expect(result!.vertices.length).toBeGreaterThan(0);
  });

  it('should use predecessor s=0 when road links via predecessor', () => {
    // Road that links to junction via predecessor (road starts at junction)
    const road1 = makeRoad('1', 50, 0, 0, 0, { predecessorJunction: 'J1' });
    const road2 = makeRoad('2', 50, Math.PI, 60, 0, { successorJunction: 'J1' });

    const junction: OdrJunction = {
      id: 'J1',
      name: 'Junction 1',
      connections: [
        { id: 'c1', incomingRoad: '1', connectingRoad: 'x', contactPoint: 'start', laneLinks: [] },
        { id: 'c2', incomingRoad: '2', connectingRoad: 'x', contactPoint: 'start', laneLinks: [] },
      ],
    };

    const result = buildJunctionSurfaceMesh(junction, [road1, road2]);
    expect(result).not.toBeNull();

    // Road 1 links via predecessor → boundary at s=0 → near (0, 0)
    // Road 2 links via successor → boundary at s=50 → near (10, 0)
    // Check that vertices contain points near both road endpoints
    const verts = result!.vertices;
    let hasNearOrigin = false;
    let hasNearOtherEnd = false;
    for (let i = 0; i < verts.length; i += 3) {
      const x = verts[i];
      const y = verts[i + 1];
      if (Math.abs(x) < 5 && Math.abs(y) < 5) hasNearOrigin = true;
      if (Math.abs(x - 10) < 5 && Math.abs(y) < 5) hasNearOtherEnd = true;
    }
    expect(hasNearOrigin).toBe(true);
    expect(hasNearOtherEnd).toBe(true);
  });

  it('should deduplicate incoming roads across connections', () => {
    // Same incoming road referenced by multiple connections
    const road1 = makeRoad('1', 50, 0, 0, 0, { successorJunction: 'J1' });
    const road2 = makeRoad('2', 50, Math.PI / 2, 60, -50, { successorJunction: 'J1' });
    const conn1 = makeRoad('10', 10, 0, 50, -2, { junctionId: 'J1' });
    const conn2 = makeRoad('11', 10, 0, 50, 2, { junctionId: 'J1' });

    const junction: OdrJunction = {
      id: 'J1',
      name: 'Junction 1',
      connections: [
        { id: 'c1', incomingRoad: '1', connectingRoad: '10', contactPoint: 'start', laneLinks: [] },
        { id: 'c2', incomingRoad: '1', connectingRoad: '11', contactPoint: 'start', laneLinks: [] },
        { id: 'c3', incomingRoad: '2', connectingRoad: '10', contactPoint: 'end', laneLinks: [] },
      ],
    };

    const result = buildJunctionSurfaceMesh(junction, [road1, road2, conn1, conn2]);
    expect(result).not.toBeNull();
    // Should still work without errors from duplicate processing
    expect(result!.vertices.length).toBeGreaterThan(0);
  });
});
