/**
 * High-level junction operations.
 *
 * Orchestrates the creation and deletion of junctions, including:
 * - Road splitting at intersection points
 * - Connecting road generation
 * - Junction + connection creation
 * - Virtual road metadata management
 *
 * All operations are wrapped in CompoundCommand for single-step undo.
 */

import type {
  OpenDriveDocument,
  OdrRoad,
  OdrJunction,
  OdrGeometry,
  OdrLaneSection,
  OdrElevation,
  OdrSuperelevation,
} from '@osce/shared';
import type { LaneRoutingConfig, JunctionMetadata, VirtualRoad } from '../store/editor-metadata-types.js';
import { nextNumericId } from '../utils/id-generator.js';
import { createRoadFromPartial } from '../builders/road-builder.js';

/**
 * Intersection detection result (mirrors @osce/opendrive's IntersectionResult
 * to avoid cross-package dependency).
 */
export interface IntersectionResult {
  roadIdA: string;
  roadIdB: string;
  sA: number;
  sB: number;
  point: { x: number; y: number };
  angle: number;
}
import type { RoadEndpoint } from '../builders/connecting-road-builder.js';
import { computeRoadEndpoint, generateConnectingRoads } from '../builders/connecting-road-builder.js';

type EvaluateAtS = (
  planView: readonly OdrGeometry[],
  s: number,
) => { x: number; y: number; hdg: number };

/**
 * Parameters for creating a junction from an intersection detection result.
 */
export interface CreateJunctionParams {
  intersection: IntersectionResult;
  routingConfig: LaneRoutingConfig;
  evaluateAtS: EvaluateAtS;
}

/**
 * Information about how an original road is split into segments at junction boundaries.
 */
export interface RoadSplitInfo {
  /** ID of the original road being split. */
  originalRoadId: string;
  /** Segment before the junction (s=0 to splitStart). */
  beforeSegment: OdrRoad;
  /** Segment after the junction (splitEnd to original length). */
  afterSegment: OdrRoad;
}

/**
 * Result of preparing a junction creation.
 * Contains all the data needed to create the junction and its connecting roads,
 * but does NOT execute any commands. The caller is responsible for executing.
 */
export interface JunctionCreationPlan {
  junction: OdrJunction;
  connectingRoads: OdrRoad[];
  junctionMetadata: JunctionMetadata;
  /** Incoming road segment endpoints at the junction boundary (for setting road links). */
  incomingEndpoints: Array<{
    roadId: string;
    contactPoint: 'start' | 'end';
  }>;
  /** Road splits: original roads split into before/after segments. */
  roadSplits: RoadSplitInfo[];
  /** Virtual road mappings (original road → segment IDs). */
  virtualRoads: VirtualRoad[];
}

/**
 * Compute the split distance from an intersection point.
 * Takes into account lane widths and intersection angle.
 */
function computeSplitDistance(road: OdrRoad, angle: number): number {
  // Get max lane width at the intersection
  const section = road.lanes[0];
  if (!section) return 10;

  const totalLanes = section.leftLanes.length + section.rightLanes.length;
  const avgLaneWidth = 3.5;
  const roadWidth = totalLanes * avgLaneWidth;

  // Wider junction for acute angles, tighter for perpendicular
  const angleFactor = 1 / Math.max(Math.sin(angle), 0.3);
  const baseDist = (roadWidth / 2) * angleFactor;

  // Add margin
  return Math.max(baseDist + 2, 8);
}

// ---------------------------------------------------------------------------
// Geometry / lane splitting helpers
// ---------------------------------------------------------------------------

/**
 * Extract geometry elements for a sub-range [sStart, sEnd] of a road.
 * Recalculates start positions using evaluateAtS for accuracy.
 */
function extractGeometryRange(
  planView: readonly OdrGeometry[],
  sStart: number,
  sEnd: number,
  evaluateAtS: EvaluateAtS,
): OdrGeometry[] {
  const result: OdrGeometry[] = [];

  for (const geo of planView) {
    const geoEnd = geo.s + geo.length;

    // Skip if entirely outside range
    if (geoEnd <= sStart || geo.s >= sEnd) continue;

    const effectiveStart = Math.max(geo.s, sStart);
    const effectiveEnd = Math.min(geoEnd, sEnd);
    const effectiveLength = effectiveEnd - effectiveStart;
    if (effectiveLength <= 0) continue;

    // Evaluate the correct start position on the reference line
    const pose = evaluateAtS(planView, effectiveStart);

    const newGeo: OdrGeometry = {
      ...structuredClone(geo),
      s: effectiveStart - sStart,
      x: pose.x,
      y: pose.y,
      hdg: pose.hdg,
      length: effectiveLength,
    };

    result.push(newGeo);
  }

  return result;
}

/**
 * Extract lane sections for a sub-range [sStart, sEnd].
 * Shifts s-offsets so the segment starts at s=0.
 */
function extractLaneSections(
  lanes: readonly OdrLaneSection[],
  sStart: number,
  sEnd: number,
): OdrLaneSection[] {
  const result: OdrLaneSection[] = [];

  for (const ls of lanes) {
    if (ls.s >= sEnd) continue;
    // Find the last section before sEnd
    if (ls.s < sStart) {
      // This section spans into our range — include it starting at 0
      if (result.length === 0) {
        result.push({ ...structuredClone(ls), s: 0 });
      }
    } else {
      result.push({ ...structuredClone(ls), s: ls.s - sStart });
    }
  }

  // Ensure at least one section
  if (result.length === 0 && lanes.length > 0) {
    result.push({ ...structuredClone(lanes[0]), s: 0 });
  }

  return result;
}

/**
 * Extract elevation/superelevation profiles for a sub-range.
 */
function extractPolynomials<T extends { s: number }>(
  profiles: readonly T[],
  sStart: number,
  sEnd: number,
): T[] {
  const result: T[] = [];

  for (const p of profiles) {
    if (p.s >= sEnd) continue;
    if (p.s < sStart) {
      if (result.length === 0) {
        result.push({ ...structuredClone(p), s: 0 } as T);
      }
    } else {
      result.push({ ...structuredClone(p), s: p.s - sStart } as T);
    }
  }

  if (result.length === 0 && profiles.length > 0) {
    result.push({ ...structuredClone(profiles[0]), s: 0 } as T);
  }

  return result;
}

/**
 * Create a road segment from a sub-range of an existing road.
 */
function createRoadSegment(
  road: OdrRoad,
  sStart: number,
  sEnd: number,
  evaluateAtS: EvaluateAtS,
  usedIds: string[],
): OdrRoad {
  const length = sEnd - sStart;
  const geometry = extractGeometryRange(road.planView, sStart, sEnd, evaluateAtS);
  const lanes = extractLaneSections(road.lanes, sStart, sEnd);
  const elevation = extractPolynomials<OdrElevation>(road.elevationProfile, sStart, sEnd);
  const lateral = extractPolynomials<OdrSuperelevation>(road.lateralProfile, sStart, sEnd);

  const segId = nextNumericId(usedIds);
  usedIds.push(segId);

  return createRoadFromPartial({
    id: segId,
    name: road.name,
    length,
    junction: '-1',
    planView: geometry,
    lanes,
    elevationProfile: elevation,
    lateralProfile: lateral,
    laneOffset: road.laneOffset.length > 0
      ? extractPolynomials(road.laneOffset, sStart, sEnd)
      : [],
    objects: [],
    signals: [],
  });
}

/**
 * Plan a junction creation from an intersection result.
 *
 * Splits each intersecting road into before/after segments at the junction
 * boundaries, then generates connecting roads linking the segments.
 * This prepares all the data but does NOT modify the document.
 */
export function planJunctionCreation(
  doc: OpenDriveDocument,
  params: CreateJunctionParams,
): JunctionCreationPlan | null {
  const { intersection, routingConfig, evaluateAtS } = params;

  const roadA = doc.roads.find((r) => r.id === intersection.roadIdA);
  const roadB = doc.roads.find((r) => r.id === intersection.roadIdB);
  if (!roadA || !roadB) return null;

  // Compute split distances (half-width of junction area along each road)
  const splitDistA = computeSplitDistance(roadA, intersection.angle);
  const splitDistB = computeSplitDistance(roadB, intersection.angle);

  // Compute s-coordinates at the 4 junction boundary points
  const sA_end = Math.min(intersection.sA + splitDistA, roadA.length);
  const sA_start = Math.max(intersection.sA - splitDistA, 0);
  const sB_end = Math.min(intersection.sB + splitDistB, roadB.length);
  const sB_start = Math.max(intersection.sB - splitDistB, 0);

  // Guard: skip if road is too short for a junction
  if (sA_end - sA_start < 2 || sB_end - sB_start < 2) return null;

  // Guard: skip if segments would be too short (< 1m)
  const minSegLen = 1;
  if (sA_start < minSegLen || roadA.length - sA_end < minSegLen) return null;
  if (sB_start < minSegLen || roadB.length - sB_end < minSegLen) return null;

  // Create the junction
  const junctionId = nextNumericId(doc.junctions.map((j) => j.id));
  const junctionName = `Junction ${junctionId}`;

  // Track used IDs for unique generation
  const usedIds = doc.roads.map((r) => r.id);

  // --- Split roads into before/after segments ---
  const segA_before = createRoadSegment(roadA, 0, sA_start, evaluateAtS, usedIds);
  const segA_after = createRoadSegment(roadA, sA_end, roadA.length, evaluateAtS, usedIds);
  const segB_before = createRoadSegment(roadB, 0, sB_start, evaluateAtS, usedIds);
  const segB_after = createRoadSegment(roadB, sB_end, roadB.length, evaluateAtS, usedIds);

  // --- Build endpoints from segment roads ---
  // segX_before: its END faces the junction
  // segX_after:  its START faces the junction
  const endpoints: RoadEndpoint[] = [
    computeRoadEndpoint(segA_after, 'start', evaluateAtS),
    computeRoadEndpoint(segB_after, 'start', evaluateAtS),
    computeRoadEndpoint(segA_before, 'end', evaluateAtS),
    computeRoadEndpoint(segB_before, 'end', evaluateAtS),
  ];

  const junction: OdrJunction = {
    id: junctionId,
    name: junctionName,
    connections: [],
  };

  // Include segment roads in the doc used for ID generation
  const augmentedDoc: OpenDriveDocument = {
    ...doc,
    roads: [...doc.roads, segA_before, segA_after, segB_before, segB_after],
    junctions: [...doc.junctions, junction],
  };

  const { roads: connectingRoads, connections } = generateConnectingRoads(
    endpoints,
    junctionId,
    routingConfig,
    augmentedDoc,
  );

  junction.connections = connections;

  const junctionMeta: JunctionMetadata = {
    junctionId,
    intersectingVirtualRoadIds: [roadA.id, roadB.id],
    connectingRoadIds: connectingRoads.map((r) => r.id),
    autoCreated: true,
  };

  // Deduplicate endpoints by roadId+contactPoint
  const seen = new Set<string>();
  const incomingEndpoints: Array<{ roadId: string; contactPoint: 'start' | 'end' }> = [];
  for (const ep of endpoints) {
    const key = `${ep.roadId}:${ep.contactPoint}`;
    if (!seen.has(key)) {
      seen.add(key);
      incomingEndpoints.push({ roadId: ep.roadId, contactPoint: ep.contactPoint });
    }
  }

  const roadSplits: RoadSplitInfo[] = [
    { originalRoadId: roadA.id, beforeSegment: segA_before, afterSegment: segA_after },
    { originalRoadId: roadB.id, beforeSegment: segB_before, afterSegment: segB_after },
  ];

  const virtualRoads: VirtualRoad[] = [
    { virtualRoadId: roadA.id, segmentRoadIds: [segA_before.id, segA_after.id] },
    { virtualRoadId: roadB.id, segmentRoadIds: [segB_before.id, segB_after.id] },
  ];

  return {
    junction,
    connectingRoads,
    junctionMetadata: junctionMeta,
    incomingEndpoints,
    roadSplits,
    virtualRoads,
  };
}

/**
 * Collect all connecting road IDs for a junction from metadata.
 */
export function getConnectingRoadIds(
  junctionMeta: JunctionMetadata | undefined,
  junction: OdrJunction,
): string[] {
  if (junctionMeta) {
    return junctionMeta.connectingRoadIds;
  }
  // Fallback: extract from connections
  return junction.connections.map((c) => c.connectingRoad);
}

/**
 * Determine which roads need to be joined when a junction is removed.
 * Returns pairs of (firstRoadId, secondRoadId) that should be joined.
 */
export function findRoadsToJoin(
  junction: OdrJunction,
  virtualRoads: VirtualRoad[],
  doc: OpenDriveDocument,
): Array<{ firstRoadId: string; secondRoadId: string }> {
  const pairs: Array<{ firstRoadId: string; secondRoadId: string }> = [];

  for (const vr of virtualRoads) {
    // Find consecutive segments that are separated by this junction
    for (let i = 0; i < vr.segmentRoadIds.length - 1; i++) {
      const firstId = vr.segmentRoadIds[i];
      const secondId = vr.segmentRoadIds[i + 1];

      const firstRoad = doc.roads.find((r) => r.id === firstId);
      if (
        firstRoad?.link?.successor?.elementType === 'junction' &&
        firstRoad.link.successor.elementId === junction.id
      ) {
        pairs.push({ firstRoadId: firstId, secondRoadId: secondId });
      }
    }
  }

  return pairs;
}
