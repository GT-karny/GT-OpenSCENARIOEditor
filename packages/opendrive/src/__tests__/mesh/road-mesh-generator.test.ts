import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { generateRoadMesh } from '../../mesh/road-mesh-generator.js';
import { XodrParser } from '../../parser/xodr-parser.js';
import type { OdrRoad, RoadMeshData } from '@osce/shared';

function makeStraightRoad(): OdrRoad {
  return {
    id: '1',
    name: 'Straight',
    length: 100,
    junction: '-1',
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
    elevationProfile: [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
    lateralProfile: [],
    laneOffset: [],
    lanes: [
      {
        s: 0,
        leftLanes: [
          {
            id: 1, type: 'driving',
            width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
            roadMarks: [],
          },
        ],
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
        rightLanes: [
          {
            id: -1, type: 'driving',
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

describe('generateRoadMesh', () => {
  it('should generate mesh for a straight road', () => {
    const road = makeStraightRoad();
    const mesh = generateRoadMesh(road);

    expect(mesh.roadId).toBe('1');
    expect(mesh.laneSections).toHaveLength(1);

    const section = mesh.laneSections[0];
    expect(section.sStart).toBe(0);
    expect(section.sEnd).toBe(100);
    expect(section.lanes).toHaveLength(2); // left + right lanes
  });

  it('should produce valid vertex data', () => {
    const road = makeStraightRoad();
    const mesh = generateRoadMesh(road);

    for (const section of mesh.laneSections) {
      for (const lane of section.lanes) {
        // Vertices should be Float32Array with xyz triples
        expect(lane.vertices).toBeInstanceOf(Float32Array);
        expect(lane.vertices.length % 3).toBe(0);
        expect(lane.vertices.length).toBeGreaterThan(0);

        // Indices should be Uint32Array with triangle triples
        expect(lane.indices).toBeInstanceOf(Uint32Array);
        expect(lane.indices.length % 3).toBe(0);
        expect(lane.indices.length).toBeGreaterThan(0);

        // No NaN values
        for (let i = 0; i < lane.vertices.length; i++) {
          expect(Number.isNaN(lane.vertices[i])).toBe(false);
        }

        // All indices should be valid vertex references
        const vertexCount = lane.vertices.length / 3;
        for (let i = 0; i < lane.indices.length; i++) {
          expect(lane.indices[i]).toBeLessThan(vertexCount);
        }
      }
    }
  });

  it('should produce correct vertex count for given step', () => {
    const road = makeStraightRoad();
    const mesh = generateRoadMesh(road, { baseStep: 10 });

    const lane = mesh.laneSections[0].lanes[0];
    // 100m road with step=10: samples at 0, 10, 20, ..., 100 = 11 samples
    // 2 vertices per sample (inner + outer)
    const numSamples = lane.vertices.length / (2 * 3);
    expect(numSamples).toBeGreaterThanOrEqual(11);
  });

  it('should produce UVs', () => {
    const road = makeStraightRoad();
    const mesh = generateRoadMesh(road);

    for (const section of mesh.laneSections) {
      for (const lane of section.lanes) {
        expect(lane.uvs).toBeInstanceOf(Float32Array);
        // 2 UV coords per vertex
        expect(lane.uvs!.length).toBe((lane.vertices.length / 3) * 2);
      }
    }
  });

  it('should generate bounding box within expected range for straight road', () => {
    const road = makeStraightRoad();
    const mesh = generateRoadMesh(road);

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const section of mesh.laneSections) {
      for (const lane of section.lanes) {
        for (let i = 0; i < lane.vertices.length; i += 3) {
          const x = lane.vertices[i];
          const y = lane.vertices[i + 1];
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Road goes from x=0 to x=100, lanes at y=±3.5
    expect(minX).toBeCloseTo(0, 0);
    expect(maxX).toBeCloseTo(100, 0);
    expect(minY).toBeCloseTo(-3.5, 0);
    expect(maxY).toBeCloseTo(3.5, 0);
  });

  it('should handle road with no width lanes', () => {
    const road: OdrRoad = {
      id: '2', name: '', length: 50, junction: '-1',
      planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 50, type: 'line' }],
      elevationProfile: [],
      lateralProfile: [],
      laneOffset: [],
      lanes: [{
        s: 0,
        leftLanes: [],
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
        rightLanes: [],
      }],
      objects: [],
      signals: [],
    };
    const mesh = generateRoadMesh(road);
    expect(mesh.laneSections).toHaveLength(1);
    expect(mesh.laneSections[0].lanes).toHaveLength(0);
  });
});

/** Min/max z across every surface vertex of a road mesh. */
function meshZRange(road: OdrRoad): { min: number; max: number } {
  const mesh = generateRoadMesh(road);
  let min = Infinity;
  let max = -Infinity;
  for (const section of mesh.laneSections) {
    for (const lane of section.lanes) {
      for (let i = 2; i < lane.vertices.length; i += 3) {
        min = Math.min(min, lane.vertices[i]);
        max = Math.max(max, lane.vertices[i]);
      }
    }
  }
  return { min, max };
}

/** Total surface-lane count across all sections of a road mesh. */
function totalLaneCount(mesh: RoadMeshData): number {
  return mesh.laneSections.reduce((sum, s) => sum + s.lanes.length, 0);
}

describe('generateRoadMesh temporary lane layer', () => {
  /** Permanent = 1 left + 1 right; temporary = 1 right only, wider, offset laterally. */
  function makeDualLayerRoad(): OdrRoad {
    return {
      id: '7', name: 'Roadworks', length: 100, junction: '-1',
      planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
      elevationProfile: [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
      lateralProfile: [],
      laneOffset: [],
      lanes: [{
        s: 0,
        leftLanes: [{ id: 1, type: 'driving', width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }], roadMarks: [] }],
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
        rightLanes: [{ id: -1, type: 'driving', width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }], roadMarks: [] }],
      }],
      objects: [], signals: [],
      temporaryLanes: {
        // Distinct from permanent: a single 4.0 m lane shifted by a +1 m lane offset.
        laneOffset: [{ s: 0, a: 1, b: 0, c: 0, d: 0 }],
        sections: [{
          s: 0,
          leftLanes: [],
          centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
          rightLanes: [{ id: -1, type: 'driving', width: [{ sOffset: 0, a: 4.0, b: 0, c: 0, d: 0 }], roadMarks: [] }],
        }],
      },
    };
  }

  it('returns an empty mesh for the temporary layer when the road has none', () => {
    const road = makeStraightRoad();
    const mesh = generateRoadMesh(road, { layer: 'temporary' });
    expect(mesh.roadId).toBe('1');
    expect(mesh.laneSections).toHaveLength(0);
  });

  it('meshes the temporary layer through the same machinery, distinct from permanent', () => {
    const road = makeDualLayerRoad();
    const permanent = generateRoadMesh(road);
    const temporary = generateRoadMesh(road, { layer: 'temporary' });

    expect(totalLaneCount(permanent)).toBe(2); // left + right
    expect(totalLaneCount(temporary)).toBe(1); // single temporary lane
    expect(totalLaneCount(temporary)).not.toBe(totalLaneCount(permanent));
  });

  it("applies the temporary layer's own laneOffset (not the permanent one)", () => {
    const road = makeDualLayerRoad();
    const temporary = generateRoadMesh(road, { layer: 'temporary' });

    // Temporary lane: right lane of width 4.0 under a +1 m lane offset. Its inner
    // edge sits at t = +1 (offset) and outer at t = +1 - 4 = -3 → y spans [-3, +1].
    let minY = Infinity, maxY = -Infinity;
    for (const section of temporary.laneSections) {
      for (const lane of section.lanes) {
        for (let i = 1; i < lane.vertices.length; i += 3) {
          minY = Math.min(minY, lane.vertices[i]);
          maxY = Math.max(maxY, lane.vertices[i]);
        }
      }
    }
    expect(maxY).toBeCloseTo(1, 3);
    expect(minY).toBeCloseTo(-3, 3);
  });

  it('meshes the temporary layer of a parsed 1.9 dual-layer fixture', () => {
    const road = new XodrParser()
      .parse(
        readFileSync(
          resolve(
            __dirname,
            '../../../../../test-fixtures/opendrive-v1.9/GT_g2_lanes_layer_19.xodr',
          ),
          'utf-8',
        ),
      )
      .roads[0];

    expect(road.temporaryLanes).toBeDefined();
    const temporary = generateRoadMesh(road, { layer: 'temporary' });
    expect(totalLaneCount(temporary)).toBeGreaterThan(0);
  });
});

describe('generateRoadMesh road-surface banking (integration)', () => {
  it('banks a superelevation road so the two edges sit at different heights', () => {
    // Flat elevation but constant 5% roll → the outer edges rise/fall symmetrically.
    const road: OdrRoad = {
      id: '1', name: '', length: 100, junction: '-1',
      planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
      elevationProfile: [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
      lateralProfile: [{ s: 0, a: 0.05, b: 0, c: 0, d: 0 }],
      laneOffset: [],
      lanes: [{
        s: 0,
        leftLanes: [{ id: 1, type: 'driving', width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }], roadMarks: [] }],
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
        rightLanes: [{ id: -1, type: 'driving', width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }], roadMarks: [] }],
      }],
      objects: [], signals: [],
    };
    const { min, max } = meshZRange(road);
    // 3.5 m half-width at 5% roll → ±0.175 m; a flat road would give spread 0.
    expect(max - min).toBeCloseTo(2 * 3.5 * Math.sin(0.05), 3);
  });

  it('banks an authored crossSectionSurface road end to end', () => {
    const road = new XodrParser()
      .parse(
        readFileSync(
          resolve(
            __dirname,
            '../../../../../test-fixtures/opendrive-v1.9/Ex_CrossSectionSurface_CrossFall_LeftTurn_1.xodr',
          ),
          'utf-8',
        ),
      )
      .roads[0];
    const { min, max } = meshZRange(road);
    // Authored crossfall (tOffset -0.375 + linear ±0.02) tilts the surface: a
    // clearly non-flat spread, seated below the reference line by the tOffset.
    expect(max - min).toBeGreaterThan(0.2);
    expect(max).toBeLessThan(0); // whole surface sits below z=0 (tOffset base)
  });
});
