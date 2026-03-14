/**
 * Connecting road builder for junction creation.
 *
 * Generates connecting roads (straight, left-turn, right-turn) between
 * incoming roads at a junction, with proper lane configuration and
 * curve geometry (Arc or ParamPoly3).
 */

import type {
  OdrRoad,
  OdrGeometry,
  OdrLane,
  OdrLaneSection,
  OdrJunctionConnection,
  OpenDriveDocument,
} from '@osce/shared';
import type { LaneRoutingConfig } from '../store/editor-metadata-types.js';
import { createRoadFromPartial } from './road-builder.js';
import { nextNumericId } from '../utils/id-generator.js';

export type TurnType = 'straight' | 'left' | 'right';

export interface ConnectingRoadSpec {
  incomingRoadId: string;
  incomingContactPoint: 'start' | 'end';
  outgoingRoadId: string;
  outgoingContactPoint: 'start' | 'end';
  turnType: TurnType;
}

export interface RoadEndpoint {
  roadId: string;
  contactPoint: 'start' | 'end';
  x: number;
  y: number;
  hdg: number;
  drivingLanes: OdrLane[];
  road: OdrRoad;
}

interface GeneratedConnectingRoad {
  road: OdrRoad;
  connection: OdrJunctionConnection;
}

/**
 * Compute the endpoint position and heading for a road's start or end.
 */
export function computeRoadEndpoint(
  road: OdrRoad,
  contactPoint: 'start' | 'end',
  evaluateAtS: (planView: readonly OdrGeometry[], s: number) => { x: number; y: number; hdg: number },
): RoadEndpoint {
  const s = contactPoint === 'start' ? 0 : road.length;
  const pose = evaluateAtS(road.planView, s);

  // Get driving lanes from the relevant lane section
  const section = contactPoint === 'start'
    ? road.lanes[0]
    : road.lanes[road.lanes.length - 1];

  const drivingLanes = section
    ? [...section.leftLanes, ...section.rightLanes].filter(
        (l) => l.type === 'driving' || l.type === 'bidirectional',
      )
    : [];

  return {
    roadId: road.id,
    contactPoint,
    x: pose.x,
    y: pose.y,
    hdg: contactPoint === 'end' ? pose.hdg : pose.hdg + Math.PI,
    drivingLanes,
    road,
  };
}

/**
 * Determine the turn type based on the angle between incoming and outgoing directions.
 */
function classifyTurn(incomingHdg: number, outgoingHdg: number): TurnType {
  let diff = outgoingHdg - incomingHdg;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff <= -Math.PI) diff += 2 * Math.PI;

  if (Math.abs(diff) < Math.PI / 6) return 'straight';
  if (diff > 0) return 'left';
  return 'right';
}

/**
 * Filter lanes based on routing config and turn type.
 */
function filterLanesForTurn(
  lanes: OdrLane[],
  turnType: TurnType,
  routingConfig: LaneRoutingConfig,
): OdrLane[] {
  if (turnType === 'straight') return lanes;

  if (turnType === 'right' && routingConfig.rightTurnLanes === 'outermost') {
    // Outermost = highest absolute lane ID
    const outermost = lanes.reduce((prev, curr) =>
      Math.abs(curr.id) > Math.abs(prev.id) ? curr : prev,
      lanes[0],
    );
    return outermost ? [outermost] : [];
  }

  if (turnType === 'left' && routingConfig.leftTurnLanes === 'innermost') {
    // Innermost = lowest absolute lane ID (closest to center)
    const innermost = lanes.reduce((prev, curr) =>
      Math.abs(curr.id) < Math.abs(prev.id) ? curr : prev,
      lanes[0],
    );
    return innermost ? [innermost] : [];
  }

  return lanes;
}

/**
 * Solve for an Arc geometry connecting two endpoints.
 *
 * Given start and end poses, computes the curvature and arc length
 * needed to smoothly connect them.
 */
function solveArcGeometry(
  startX: number, startY: number, startHdg: number,
  endX: number, endY: number,
): OdrGeometry | null {
  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 0.01) return null;

  // Angle from start to end
  const chordAngle = Math.atan2(dy, dx);

  // Half the angular difference between the chord and the start heading
  let alpha = chordAngle - startHdg;
  while (alpha > Math.PI) alpha -= 2 * Math.PI;
  while (alpha <= -Math.PI) alpha += 2 * Math.PI;

  if (Math.abs(alpha) < 0.001) {
    // Nearly straight — use a line
    return {
      s: 0,
      x: startX,
      y: startY,
      hdg: startHdg,
      length: dist,
      type: 'line',
    };
  }

  // Curvature: kappa = 2 * sin(alpha) / dist
  const curvature = (2 * Math.sin(alpha)) / dist;
  const radius = 1 / Math.abs(curvature);

  // Arc length = 2 * alpha * radius
  const arcLength = Math.abs(2 * alpha) * radius;

  return {
    s: 0,
    x: startX,
    y: startY,
    hdg: startHdg,
    length: arcLength,
    type: 'arc',
    curvature,
  };
}

/**
 * Solve for a ParamPoly3 geometry connecting two endpoints.
 * Uses Hermite interpolation for G1 continuity.
 */
function solveParamPoly3Geometry(
  startX: number, startY: number, startHdg: number,
  endX: number, endY: number, endHdg: number,
): OdrGeometry {
  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Transform to local coordinates (start at origin, heading along x-axis)
  const cosH = Math.cos(-startHdg);
  const sinH = Math.sin(-startHdg);
  const localEndX = dx * cosH - dy * sinH;
  const localEndY = dx * sinH + dy * cosH;
  const localEndHdg = endHdg - startHdg;

  // Tangent lengths (heuristic: half the chord distance)
  const tangentScale = dist * 0.5;
  const startTangentX = tangentScale;
  const startTangentY = 0;
  const endTangentX = tangentScale * Math.cos(localEndHdg);
  const endTangentY = tangentScale * Math.sin(localEndHdg);

  // Hermite basis for cubic: p(t) = (2t³ - 3t² + 1)p0 + (t³ - 2t² + t)m0 + (-2t³ + 3t²)p1 + (t³ - t²)m1
  // Coefficients: a + b*t + c*t² + d*t³
  // a = p0 = 0 (start at origin in local coords)
  // b = m0 = tangent at start
  // c = 3*(p1 - p0) - 2*m0 - m1
  // d = 2*(p0 - p1) + m0 + m1

  const aU = 0;
  const bU = startTangentX;
  const cU = 3 * localEndX - 2 * startTangentX - endTangentX;
  const dU = 2 * (-localEndX) + startTangentX + endTangentX;

  const aV = 0;
  const bV = startTangentY;
  const cV = 3 * localEndY - 2 * startTangentY - endTangentY;
  const dV = 2 * (-localEndY) + startTangentY + endTangentY;

  // Estimate arc length by sampling the curve
  const numSamples = 20;
  let arcLength = 0;
  let prevX = 0;
  let prevY = 0;

  for (let i = 1; i <= numSamples; i++) {
    const t = i / numSamples;
    const t2 = t * t;
    const t3 = t2 * t;
    const curX = aU + bU * t + cU * t2 + dU * t3;
    const curY = aV + bV * t + cV * t2 + dV * t3;
    arcLength += Math.sqrt((curX - prevX) ** 2 + (curY - prevY) ** 2);
    prevX = curX;
    prevY = curY;
  }

  return {
    s: 0,
    x: startX,
    y: startY,
    hdg: startHdg,
    length: arcLength,
    type: 'paramPoly3',
    aU, bU, cU, dU,
    aV, bV, cV, dV,
    pRange: 'normalized',
  };
}

/**
 * Build a single connecting road between two endpoints.
 */
function buildConnectingRoad(
  spec: ConnectingRoadSpec,
  incoming: RoadEndpoint,
  outgoing: RoadEndpoint,
  junctionId: string,
  laneCount: number,
  doc: OpenDriveDocument,
  outerRoadMark: boolean,
): GeneratedConnectingRoad | null {
  // Compute outgoing heading (reverse if entering from end)
  const outHdg =
    outgoing.contactPoint === 'start'
      ? outgoing.hdg + Math.PI // flip: we want direction INTO the outgoing road
      : outgoing.hdg;

  // Compute incoming heading (direction leaving the incoming road into the junction)
  const inHdg = incoming.hdg;

  // Choose geometry type based on angle difference
  let angleDiff = Math.abs(inHdg - outHdg);
  while (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

  let geometry: OdrGeometry | null;

  if (angleDiff < Math.PI / 6) {
    // Small angle — use arc
    geometry = solveArcGeometry(incoming.x, incoming.y, inHdg, outgoing.x, outgoing.y);
  } else {
    // Larger angle — use ParamPoly3 for smooth curve
    geometry = solveParamPoly3Geometry(
      incoming.x, incoming.y, inHdg,
      outgoing.x, outgoing.y, outHdg,
    );
  }

  if (!geometry) return null;

  // Build lane section: driving lanes matching the incoming road
  const roadId = nextNumericId(doc.roads.map((r) => r.id));
  const rightLanes: OdrLane[] = [];

  for (let i = 0; i < laneCount; i++) {
    const laneId = -(i + 1);
    const isOutermost = i === laneCount - 1;

    rightLanes.push({
      id: laneId,
      type: 'driving',
      width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
      roadMarks: [
        {
          sOffset: 0,
          type: isOutermost && outerRoadMark ? 'solid' : 'none',
          color: 'standard',
        },
      ],
    });
  }

  const lanes: OdrLaneSection[] = [
    {
      s: 0,
      leftLanes: [],
      centerLane: {
        id: 0,
        type: 'none',
        width: [],
        roadMarks: [{ sOffset: 0, type: 'none', color: 'standard' }],
      },
      rightLanes,
    },
  ];

  const road = createRoadFromPartial(
    {
      id: roadId,
      name: `conn_${incoming.roadId}_to_${outgoing.roadId}`,
      length: geometry.length,
      junction: junctionId,
      planView: [geometry],
      lanes,
      elevationProfile: [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
      lateralProfile: [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
    },
    undefined,
    doc,
  );

  // Build lane links
  const laneLinks: { from: number; to: number }[] = [];
  for (let i = 0; i < laneCount; i++) {
    // Incoming lane → connecting road lane
    const fromLaneId = incoming.drivingLanes[i]?.id;
    if (fromLaneId !== undefined) {
      laneLinks.push({ from: fromLaneId, to: -(i + 1) });
    }
  }

  const allConnIds = doc.junctions.flatMap((j) => j.connections.map((c) => c.id));
  const connId = nextNumericId(allConnIds);

  const connection: OdrJunctionConnection = {
    id: connId,
    incomingRoad: spec.incomingRoadId,
    connectingRoad: roadId,
    contactPoint: 'start',
    laneLinks,
  };

  return { road, connection };
}

/**
 * Generate all connecting roads for a junction.
 *
 * @param endpoints Road endpoints that meet at the junction
 * @param junctionId ID of the junction being created
 * @param routingConfig Lane routing configuration
 * @param doc Current OpenDRIVE document
 * @returns Generated connecting roads and their junction connections
 */
export function generateConnectingRoads(
  endpoints: RoadEndpoint[],
  junctionId: string,
  routingConfig: LaneRoutingConfig,
  doc: OpenDriveDocument,
): { roads: OdrRoad[]; connections: OdrJunctionConnection[] } {
  const roads: OdrRoad[] = [];
  const connections: OdrJunctionConnection[] = [];

  // For each pair of endpoints, generate connecting roads
  for (let i = 0; i < endpoints.length; i++) {
    const incoming = endpoints[i];

    for (let j = 0; j < endpoints.length; j++) {
      if (i === j) continue;

      const outgoing = endpoints[j];

      // Skip same-road connections (U-turns)
      if (incoming.roadId === outgoing.roadId) continue;
      const turnType = classifyTurn(incoming.hdg, outgoing.hdg);

      // Skip U-turns unless configured
      if (turnType === 'straight' && Math.abs(incoming.hdg - outgoing.hdg) > Math.PI * 0.8) {
        if (!routingConfig.generateUturn) continue;
      }

      // Filter lanes based on routing rules
      const eligibleLanes = filterLanesForTurn(
        incoming.drivingLanes,
        turnType,
        routingConfig,
      );

      if (eligibleLanes.length === 0) continue;

      const spec: ConnectingRoadSpec = {
        incomingRoadId: incoming.roadId,
        incomingContactPoint: incoming.contactPoint,
        outgoingRoadId: outgoing.roadId,
        outgoingContactPoint: outgoing.contactPoint,
        turnType,
      };

      // Augment the doc with already-created roads for ID generation
      const augmentedDoc = {
        ...doc,
        roads: [...doc.roads, ...roads],
        junctions: doc.junctions.map((j) =>
          j.id === junctionId
            ? { ...j, connections: [...j.connections, ...connections] }
            : j,
        ),
      };

      const isOutermost = turnType !== 'straight';
      const result = buildConnectingRoad(
        spec,
        incoming,
        outgoing,
        junctionId,
        eligibleLanes.length,
        augmentedDoc,
        isOutermost,
      );

      if (result) {
        roads.push(result.road);
        connections.push(result.connection);
      }
    }
  }

  return { roads, connections };
}
