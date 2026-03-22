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
import { classifyTopology } from './junction-topology.js';

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
  /** Traffic rule: 'RHT' (right-hand traffic, default) or 'LHT' (left-hand traffic). */
  trafficRule?: 'RHT' | 'LHT';
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
 * Compute the actual road width at a given s-coordinate by summing
 * all lane widths (left + right) from the active lane section.
 *
 * Evaluates the cubic polynomial width(ds) = a + b·ds + c·ds² + d·ds³
 * for each lane directly (no dependency on @osce/opendrive).
 */
export function computeRoadWidthAtS(road: OdrRoad, s: number): number {
  // Find the active lane section at s
  let section = road.lanes[0];
  for (const ls of road.lanes) {
    if (ls.s <= s) section = ls;
    else break;
  }
  if (!section) return 7; // fallback: 2 lanes × 3.5m

  const ds = s - section.s;
  let totalWidth = 0;
  const allLanes = [...section.leftLanes, ...section.rightLanes];
  for (const lane of allLanes) {
    if (lane.width.length === 0) continue;
    // Find the active width record at ds
    let wr = lane.width[0];
    for (const w of lane.width) {
      if (w.sOffset <= ds) wr = w;
      else break;
    }
    const dw = ds - wr.sOffset;
    totalWidth += wr.a + dw * (wr.b + dw * (wr.c + dw * wr.d));
  }
  return Math.max(totalWidth, 3.5); // minimum 1-lane width
}

/**
 * Compute the split distance from an intersection point.
 *
 * Derived from three physical constraints:
 *
 * 1. **Minimum turning radius** — connecting roads need at least R_min radius
 *    for vehicle traversal (practical minimum ≈ 5m for passenger cars).
 *
 * 2. **Edge clearance** — at distance d from the intersection along road A,
 *    the perpendicular distance to road B's centerline is `d · sin(angle)`.
 *    For road A's edge to fully clear road B's edge:
 *      `d ≥ (ownWidth + otherWidth) / (2 · sin(angle))`
 *    This is geometrically exact and necessary to prevent road surface overlap.
 *
 * 3. **Arm length cap** — for acute angles, edge clearance diverges because
 *    near-parallel roads separate very slowly. The junction arm length is
 *    capped at a multiple of the wider road's width. The junction surface
 *    fill covers any residual edge overlap within the capped area.
 */
export function computeSplitDistance(
  ownRoadWidth: number,
  otherRoadWidth: number,
  angle: number,
): number {
  // Physical constants
  const R_MIN_TURN = 5; // minimum turning radius for passenger cars [m]
  const ARM_FACTOR = 2.5; // max arm length as multiple of road width

  // Constraint 1: minimum turning radius
  const turnConstraint = R_MIN_TURN;

  // Constraint 2: edge clearance (geometrically exact)
  const totalHalfWidth = (ownRoadWidth + otherRoadWidth) / 2;
  const sinAngle = Math.sin(angle);
  const edgeClearance = sinAngle > 1e-6 ? totalHalfWidth / sinAngle : Infinity;

  // Constraint 3: arm length cap (proportional to road width)
  // Replaces the old arbitrary 50m cap and sin-clamp with a principled bound.
  const maxArmLength = Math.max(ownRoadWidth, otherRoadWidth) * ARM_FACTOR;

  // Final: satisfy constraints 1 & 2, capped by constraint 3
  return Math.min(Math.max(turnConstraint, edgeClearance), maxArmLength);
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
  const { intersection, routingConfig, evaluateAtS, trafficRule = 'RHT' } = params;

  const roadA = doc.roads.find((r) => r.id === intersection.roadIdA);
  const roadB = doc.roads.find((r) => r.id === intersection.roadIdB);
  if (!roadA || !roadB) return null;

  // Compute actual road widths at the intersection point
  const widthA = computeRoadWidthAtS(roadA, intersection.sA);
  const widthB = computeRoadWidthAtS(roadB, intersection.sB);

  // --- Topology classification ---
  const minSegLen = 1;
  const topology = classifyTopology(
    intersection.sA,
    intersection.sB,
    intersection.angle,
    roadA,
    roadB,
    minSegLen,
  );

  // Merge: roads are too parallel for a junction
  if (topology.topology === 'merge') return null;

  // Minimum angle guard: at the maximum arm length, the lateral gap must
  // exceed half the total road width for connecting roads to physically fit.
  const ARM_FACTOR = 2.5;
  const totalHalfWidth = (widthA + widthB) / 2;
  const maxArm = Math.max(widthA, widthB) * ARM_FACTOR;
  if (maxArm * Math.sin(intersection.angle) < totalHalfWidth) return null;

  // Compute split distances (half-width of junction area along each road)
  const splitDistA = computeSplitDistance(widthA, widthB, intersection.angle);
  const splitDistB = computeSplitDistance(widthB, widthA, intersection.angle);

  // Compute s-coordinates at the junction boundary points
  const sA_end = Math.min(intersection.sA + splitDistA, roadA.length);
  const sA_start = Math.max(intersection.sA - splitDistA, 0);
  const sB_end = Math.min(intersection.sB + splitDistB, roadB.length);
  const sB_start = Math.max(intersection.sB - splitDistB, 0);

  // Guard: skip if junction region is too small
  if (sA_end - sA_start < 2 || sB_end - sB_start < 2) return null;

  // Determine which sides of each road to split based on topology
  const armA = topology.arms[0].side;
  const armB = topology.arms[1].side;

  // For non-T topologies, guard against too-short segments
  if (armA === 'both' && (sA_start < minSegLen || roadA.length - sA_end < minSegLen)) return null;
  if (armB === 'both' && (sB_start < minSegLen || roadB.length - sB_end < minSegLen)) return null;

  // Create the junction
  const junctionId = nextNumericId(doc.junctions.map((j) => j.id));
  const junctionName = `Junction ${junctionId}`;

  // Track used IDs for unique generation
  const usedIds = doc.roads.map((r) => r.id);

  // --- Build segments and endpoints based on topology ---
  const endpoints: RoadEndpoint[] = [];
  const roadSplits: RoadSplitInfo[] = [];
  const virtualRoads: VirtualRoad[] = [];
  const segmentRoads: OdrRoad[] = [];

  buildRoadArm(roadA, sA_start, sA_end, armA, evaluateAtS, usedIds, endpoints, roadSplits, virtualRoads, segmentRoads, trafficRule);
  buildRoadArm(roadB, sB_start, sB_end, armB, evaluateAtS, usedIds, endpoints, roadSplits, virtualRoads, segmentRoads, trafficRule);

  const junction: OdrJunction = {
    id: junctionId,
    name: junctionName,
    type: 'default',
    connections: [],
  };

  // Include segment roads in the doc used for ID generation
  const augmentedDoc: OpenDriveDocument = {
    ...doc,
    roads: [...doc.roads, ...segmentRoads],
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
 * Build segments and endpoints for one road arm in a junction.
 *
 * For 'both' (X/Y-junction): splits into before + after segments.
 * For 'before-only' (T-junction, intersection at road end): only before segment.
 * For 'after-only' (T-junction, intersection at road start): only after segment.
 */
function buildRoadArm(
  road: OdrRoad,
  sStart: number,
  sEnd: number,
  armSide: 'before-only' | 'after-only' | 'both',
  evaluateAtS: EvaluateAtS,
  usedIds: string[],
  endpoints: RoadEndpoint[],
  roadSplits: RoadSplitInfo[],
  virtualRoads: VirtualRoad[],
  segmentRoads: OdrRoad[],
  trafficRule: 'RHT' | 'LHT' = 'RHT',
): void {
  if (armSide === 'both') {
    // Standard X/Y-junction: split into before + after
    const segBefore = createRoadSegment(road, 0, sStart, evaluateAtS, usedIds);
    const segAfter = createRoadSegment(road, sEnd, road.length, evaluateAtS, usedIds);

    endpoints.push(
      computeRoadEndpoint(segAfter, 'start', evaluateAtS, trafficRule),
      computeRoadEndpoint(segBefore, 'end', evaluateAtS, trafficRule),
    );

    roadSplits.push({
      originalRoadId: road.id,
      beforeSegment: segBefore,
      afterSegment: segAfter,
    });

    virtualRoads.push({
      virtualRoadId: road.id,
      segmentRoadIds: [segBefore.id, segAfter.id],
    });

    segmentRoads.push(segBefore, segAfter);
  } else if (armSide === 'before-only') {
    // T-junction: intersection at road end, only before segment needed
    const segBefore = createRoadSegment(road, 0, sStart, evaluateAtS, usedIds);
    // Create a minimal after segment (the end portion is too short to be useful
    // but we need it for the split info structure)
    const segAfter = createRoadSegment(road, sEnd, road.length, evaluateAtS, usedIds);

    endpoints.push(
      computeRoadEndpoint(segBefore, 'end', evaluateAtS, trafficRule),
    );

    roadSplits.push({
      originalRoadId: road.id,
      beforeSegment: segBefore,
      afterSegment: segAfter,
    });

    virtualRoads.push({
      virtualRoadId: road.id,
      segmentRoadIds: [segBefore.id, segAfter.id],
    });

    segmentRoads.push(segBefore, segAfter);
  } else {
    // T-junction: intersection at road start, only after segment needed
    const segBefore = createRoadSegment(road, 0, sStart, evaluateAtS, usedIds);
    const segAfter = createRoadSegment(road, sEnd, road.length, evaluateAtS, usedIds);

    endpoints.push(
      computeRoadEndpoint(segAfter, 'start', evaluateAtS, trafficRule),
    );

    roadSplits.push({
      originalRoadId: road.id,
      beforeSegment: segBefore,
      afterSegment: segAfter,
    });

    virtualRoads.push({
      virtualRoadId: road.id,
      segmentRoadIds: [segBefore.id, segAfter.id],
    });

    segmentRoads.push(segBefore, segAfter);
  }
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
