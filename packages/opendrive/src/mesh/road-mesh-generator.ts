/**
 * Top-level road mesh generator.
 * Produces RoadMeshData from a parsed OdrRoad.
 */
import type { OdrRoad, RoadMeshData, LaneSectionMeshData, LaneMeshData } from '@osce/shared';
import type { SamplingOptions } from './sampling.js';
import { generateSamplePoints } from './sampling.js';
import { buildLaneMesh } from './lane-mesh-builder.js';

export interface RoadMeshOptions extends Partial<SamplingOptions> {
  /**
   * Which `<lanes>` layer to mesh. Defaults to `'permanent'`.
   *
   * `'temporary'` meshes `road.temporaryLanes` (OpenDRIVE 1.9 roadworks layer)
   * and returns an empty mesh when the road has no temporary layer.
   */
  layer?: 'permanent' | 'temporary';
}

/**
 * Generate complete mesh data for a road, suitable for Three.js rendering.
 * Iterates over all lane sections and lanes, producing triangle meshes.
 *
 * The temporary layer carries its own lane sections and lane offset but shares
 * the road's reference line, elevation, and superelevation. To route it through
 * the exact same boundary machinery — `computeLaneBoundaries` reads the road's
 * `laneOffset` — the road is shallow-cloned with the temporary layer's
 * `sections`/`laneOffset` swapped in; every other field (planView, elevation,
 * lateralProfile, crossSectionSurface) stays shared.
 */
export function generateRoadMesh(
  road: OdrRoad,
  options?: RoadMeshOptions,
): RoadMeshData {
  const layer = options?.layer ?? 'permanent';

  const meshRoad =
    layer === 'temporary'
      ? road.temporaryLanes
        ? {
            ...road,
            lanes: road.temporaryLanes.sections,
            laneOffset: road.temporaryLanes.laneOffset,
          }
        : null
      : road;

  if (!meshRoad) {
    return { roadId: road.id, laneSections: [] };
  }

  const laneSectionMeshes: LaneSectionMeshData[] = [];

  for (let i = 0; i < meshRoad.lanes.length; i++) {
    const section = meshRoad.lanes[i];
    const sStart = section.s;
    const sEnd = i + 1 < meshRoad.lanes.length
      ? meshRoad.lanes[i + 1].s
      : meshRoad.length;

    // Skip degenerate sections
    if (sEnd - sStart < 1e-6) continue;

    const sValues = generateSamplePoints(meshRoad, sStart, sEnd, options);
    const laneMeshes: LaneMeshData[] = [];

    // Build meshes for left lanes
    for (const lane of section.leftLanes) {
      if (lane.width.length > 0) {
        laneMeshes.push(buildLaneMesh(meshRoad, section, lane, sValues));
      }
    }

    // Build meshes for right lanes
    for (const lane of section.rightLanes) {
      if (lane.width.length > 0) {
        laneMeshes.push(buildLaneMesh(meshRoad, section, lane, sValues));
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
