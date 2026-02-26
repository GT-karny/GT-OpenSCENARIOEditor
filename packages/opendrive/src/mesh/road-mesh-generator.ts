/**
 * Top-level road mesh generator.
 * Produces RoadMeshData from a parsed OdrRoad.
 */
import type { OdrRoad, RoadMeshData, LaneSectionMeshData, LaneMeshData } from '@osce/shared';
import type { SamplingOptions } from './sampling.js';
import { generateSamplePoints } from './sampling.js';
import { buildLaneMesh } from './lane-mesh-builder.js';

/**
 * Generate complete mesh data for a road, suitable for Three.js rendering.
 * Iterates over all lane sections and lanes, producing triangle meshes.
 */
export function generateRoadMesh(
  road: OdrRoad,
  options?: Partial<SamplingOptions>,
): RoadMeshData {
  const laneSectionMeshes: LaneSectionMeshData[] = [];

  for (let i = 0; i < road.lanes.length; i++) {
    const section = road.lanes[i];
    const sStart = section.s;
    const sEnd = i + 1 < road.lanes.length
      ? road.lanes[i + 1].s
      : road.length;

    // Skip degenerate sections
    if (sEnd - sStart < 1e-6) continue;

    const sValues = generateSamplePoints(road, sStart, sEnd, options);
    const laneMeshes: LaneMeshData[] = [];

    // Build meshes for left lanes
    for (const lane of section.leftLanes) {
      if (lane.width.length > 0) {
        laneMeshes.push(buildLaneMesh(road, section, lane, sValues));
      }
    }

    // Build meshes for right lanes
    for (const lane of section.rightLanes) {
      if (lane.width.length > 0) {
        laneMeshes.push(buildLaneMesh(road, section, lane, sValues));
      }
    }

    // Center lane (id=0) is skipped - it has no width

    laneSectionMeshes.push({
      sStart,
      sEnd,
      lanes: laneMeshes,
    });
  }

  return {
    roadId: road.id,
    laneSections: laneSectionMeshes,
  };
}
