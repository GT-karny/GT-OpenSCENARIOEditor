/**
 * Road mark mesh builder.
 * Generates line geometry for road markings.
 */
import type { OdrRoad, OdrLaneSection, OdrLane, OdrRoadMark, RoadMarkMeshData } from '@osce/shared';
import { evaluateReferenceLineAtS } from '../geometry/reference-line.js';
import { evaluateElevation } from '../geometry/elevation.js';
import { computeLaneOuterT, stToXyz } from '../geometry/lane-boundary.js';

/**
 * Build road mark mesh for a specific road mark on a lane.
 * Road marks are placed at the outer edge of the lane.
 */
export function buildRoadMarkMesh(
  road: OdrRoad,
  laneSection: OdrLaneSection,
  lane: OdrLane,
  roadMark: OdrRoadMark,
  sValues: readonly number[],
): RoadMarkMeshData {
  const verts: number[] = [];

  for (const s of sValues) {
    const dsFromSectionStart = s - laneSection.s;
    const t = computeLaneOuterT(laneSection, lane, dsFromSectionStart);
    const pose = evaluateReferenceLineAtS(road.planView, s);
    // Slight z-offset above road surface to prevent z-fighting
    const z = evaluateElevation(road.elevationProfile, s) + 0.01;
    const pos = stToXyz(pose, t, z);
    verts.push(pos.x, pos.y, pos.z);
  }

  return {
    vertices: new Float32Array(verts),
    color: mapRoadMarkColor(roadMark.color),
    width: roadMark.width ?? 0.12,
  };
}

function mapRoadMarkColor(color: string | undefined): string {
  switch (color) {
    case 'white': return '#FFFFFF';
    case 'yellow': return '#FFCC00';
    case 'red': return '#FF0000';
    case 'blue': return '#0066FF';
    case 'green': return '#00CC00';
    case 'orange': return '#FF8800';
    case 'violet': return '#8800FF';
    case 'standard':
    default:
      return '#FFFFFF';
  }
}
