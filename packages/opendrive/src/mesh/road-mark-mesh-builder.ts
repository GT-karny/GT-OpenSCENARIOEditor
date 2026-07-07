/**
 * Road mark mesh builder.
 * Generates line geometry for road markings.
 */
import type { OdrRoad, OdrLaneSection, OdrLane, OdrRoadMark, RoadMarkMeshData } from '@osce/shared';
import { evaluateReferenceLineAtS } from '../geometry/reference-line.js';
import { evaluateElevation } from '../geometry/elevation.js';
import { evaluateSuperelevation } from '../geometry/superelevation.js';
import { evaluateLaneOffset } from '../geometry/lane-offset.js';
import { computeLaneOuterT, stToXyz } from '../geometry/lane-boundary.js';
import { getCrossSectionEvaluator } from '../geometry/cross-section-profile.js';

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
  // Marks sit at the lane's outer edge, so they bank with the surface: a
  // cross-section surface adds a per-edge height, otherwise superelevation rolls
  // the section about the reference line (mutually exclusive per XSD).
  const crossSection = getCrossSectionEvaluator(road);

  for (const s of sValues) {
    const dsFromSectionStart = s - laneSection.s;
    const t = computeLaneOuterT(laneSection, lane, dsFromSectionStart);
    const offset = evaluateLaneOffset(road.laneOffset, s);
    const tt = t + offset;
    const pose = evaluateReferenceLineAtS(road.planView, s);
    // Slight z-offset above road surface to prevent z-fighting
    const z = evaluateElevation(road.elevationProfile, s) + 0.01;
    const pos = crossSection
      ? stToXyz(pose, tt, z + crossSection(s, tt))
      : stToXyz(pose, tt, z, evaluateSuperelevation(road.lateralProfile, s));
    verts.push(pos.x, pos.y, pos.z);
  }

  return {
    vertices: new Float32Array(verts),
    color: mapRoadMarkColor(roadMark.color),
    width: roadMark.width ?? 0.12,
    markType: roadMark.type,
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
    // Lifted slightly above pure black so marks stay visible on the dark surface.
    case 'black': return '#1A1A1A';
    case 'standard':
    default:
      return '#FFFFFF';
  }
}
