/**
 * Lane mesh builder.
 * Generates triangle mesh data for a single lane.
 */
import type { OdrRoad, OdrLaneSection, OdrLane, LaneMeshData } from '@osce/shared';
import { computeLaneBoundaries } from '../geometry/lane-boundary.js';

/**
 * Build a triangle mesh for a single lane over the given sample points.
 * Produces a strip of quads (2 triangles each) connecting inner/outer edges.
 */
export function buildLaneMesh(
  road: OdrRoad,
  laneSection: OdrLaneSection,
  lane: OdrLane,
  sValues: readonly number[],
): LaneMeshData {
  const boundaries = computeLaneBoundaries(road, laneSection, lane, sValues);
  const n = boundaries.length;

  // 2 vertices per cross-section (inner + outer), 3 floats per vertex
  const vertices = new Float32Array(n * 2 * 3);
  // 2 UV coords per vertex (u=s, v=0|1)
  const uvs = new Float32Array(n * 2 * 2);

  for (let i = 0; i < n; i++) {
    const bp = boundaries[i];
    const vi = i * 2;

    // Inner edge vertex
    vertices[(vi) * 3 + 0] = bp.innerPos.x;
    vertices[(vi) * 3 + 1] = bp.innerPos.y;
    vertices[(vi) * 3 + 2] = bp.innerPos.z;

    // Outer edge vertex
    vertices[(vi + 1) * 3 + 0] = bp.outerPos.x;
    vertices[(vi + 1) * 3 + 1] = bp.outerPos.y;
    vertices[(vi + 1) * 3 + 2] = bp.outerPos.z;

    // UVs: u = s coordinate (normalized later if needed), v = 0 (inner) / 1 (outer)
    uvs[(vi) * 2 + 0] = bp.s;
    uvs[(vi) * 2 + 1] = 0;
    uvs[(vi + 1) * 2 + 0] = bp.s;
    uvs[(vi + 1) * 2 + 1] = 1;
  }

  // Triangulate: 2 triangles per quad between adjacent cross-sections
  const indexCount = Math.max(0, n - 1) * 6;
  const indices = new Uint32Array(indexCount);

  for (let i = 0; i < n - 1; i++) {
    const v0 = i * 2;       // inner[i]
    const v1 = i * 2 + 1;   // outer[i]
    const v2 = (i + 1) * 2;       // inner[i+1]
    const v3 = (i + 1) * 2 + 1;   // outer[i+1]

    const idx = i * 6;
    // Triangle 1: inner[i], outer[i], inner[i+1]
    indices[idx + 0] = v0;
    indices[idx + 1] = v1;
    indices[idx + 2] = v2;
    // Triangle 2: outer[i], outer[i+1], inner[i+1]
    indices[idx + 3] = v1;
    indices[idx + 4] = v3;
    indices[idx + 5] = v2;
  }

  return {
    laneId: lane.id,
    laneType: lane.type,
    vertices,
    indices,
    uvs,
  };
}
