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
  OdrLane,
} from '@osce/shared';
import type { LaneRoutingConfig, JunctionMetadata, VirtualRoad } from '../store/editor-metadata-types.js';
import { nextNumericId } from '../utils/id-generator.js';

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
import { generateConnectingRoads } from '../builders/connecting-road-builder.js';

/**
 * Parameters for creating a junction from an intersection detection result.
 */
export interface CreateJunctionParams {
  intersection: IntersectionResult;
  routingConfig: LaneRoutingConfig;
  evaluateAtS: (planView: readonly OdrGeometry[], s: number) => { x: number; y: number; hdg: number };
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

/**
 * Compute endpoint data at an arbitrary s-coordinate along a road.
 * Unlike computeRoadEndpoint (which only handles start/end), this evaluates
 * at the intersection point to get the correct lane section and geometry.
 */
function computeEndpointDataAtS(
  road: OdrRoad,
  s: number,
  evaluateAtS: (planView: readonly OdrGeometry[], s: number) => { x: number; y: number; hdg: number },
): { x: number; y: number; hdg: number; drivingLanes: OdrLane[] } {
  const pose = evaluateAtS(road.planView, s);

  // Find the lane section active at this s-coordinate
  let section = road.lanes[0];
  for (const ls of road.lanes) {
    if (ls.s <= s) section = ls;
    else break;
  }

  const drivingLanes = section
    ? [...section.leftLanes, ...section.rightLanes].filter(
        (l) => l.type === 'driving' || l.type === 'bidirectional',
      )
    : [];

  return { ...pose, drivingLanes };
}

/**
 * Plan a junction creation from an intersection result.
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
  // Each road has two arms: one toward its end and one toward its start
  const sA_end = Math.min(intersection.sA + splitDistA, roadA.length);
  const sA_start = Math.max(intersection.sA - splitDistA, 0);
  const sB_end = Math.min(intersection.sB + splitDistB, roadB.length);
  const sB_start = Math.max(intersection.sB - splitDistB, 0);

  // Guard: skip if road is too short for a junction
  if (sA_end - sA_start < 2 || sB_end - sB_start < 2) return null;

  // Create the junction
  const junctionId = nextNumericId(doc.junctions.map((j) => j.id));
  const junctionName = `Junction ${junctionId}`;

  // Compute endpoint data at each of the 4 boundary positions
  const dataA_end = computeEndpointDataAtS(roadA, sA_end, evaluateAtS);
  const dataA_start = computeEndpointDataAtS(roadA, sA_start, evaluateAtS);
  const dataB_end = computeEndpointDataAtS(roadB, sB_end, evaluateAtS);
  const dataB_start = computeEndpointDataAtS(roadB, sB_start, evaluateAtS);

  // Generate connecting roads — 4 endpoints at the junction boundaries:
  // Each road contributes two arms (toward-end and toward-start)
  const endpoints: RoadEndpoint[] = [
    {
      roadId: roadA.id,
      contactPoint: 'end',
      x: dataA_end.x,
      y: dataA_end.y,
      hdg: dataA_end.hdg,
      drivingLanes: dataA_end.drivingLanes,
      road: roadA,
    },
    {
      roadId: roadB.id,
      contactPoint: 'end',
      x: dataB_end.x,
      y: dataB_end.y,
      hdg: dataB_end.hdg,
      drivingLanes: dataB_end.drivingLanes,
      road: roadB,
    },
    {
      roadId: roadA.id,
      contactPoint: 'start',
      x: dataA_start.x,
      y: dataA_start.y,
      hdg: dataA_start.hdg + Math.PI,
      drivingLanes: dataA_start.drivingLanes,
      road: roadA,
    },
    {
      roadId: roadB.id,
      contactPoint: 'start',
      x: dataB_start.x,
      y: dataB_start.y,
      hdg: dataB_start.hdg + Math.PI,
      drivingLanes: dataB_start.drivingLanes,
      road: roadB,
    },
  ];

  const junction: OdrJunction = {
    id: junctionId,
    name: junctionName,
    connections: [],
  };

  const { roads: connectingRoads, connections } = generateConnectingRoads(
    endpoints,
    junctionId,
    routingConfig,
    { ...doc, junctions: [...doc.junctions, junction] },
  );

  junction.connections = connections;

  const junctionMeta: JunctionMetadata = {
    junctionId,
    intersectingVirtualRoadIds: [],
    connectingRoadIds: connectingRoads.map((r) => r.id),
    autoCreated: true,
  };

  return {
    junction,
    connectingRoads,
    junctionMetadata: junctionMeta,
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
