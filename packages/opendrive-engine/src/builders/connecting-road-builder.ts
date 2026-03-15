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

  // Only include lanes traveling TOWARD the junction:
  //   contactPoint='end'  → right lanes (negative IDs, travel with ref direction toward end)
  //   contactPoint='start' → left lanes (positive IDs, travel against ref direction toward start)
  const drivingLanes = section
    ? (contactPoint === 'end' ? section.rightLanes : section.leftLanes).filter(
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

/** Normalize angle to [-PI, PI]. */
function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a <= -Math.PI) a += 2 * Math.PI;
  return a;
}

/**
 * Solve for an Arc geometry connecting two endpoints.
 *
 * Given start position+heading and end position, computes the curvature
 * and arc length of a circular arc. The arc's end heading is determined
 * by the arc itself (may not match the desired end heading).
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
  const alpha = normalizeAngle(chordAngle - startHdg);

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
 * Build a nearly-straight paramPoly3 transition segment.
 * Used as a short "bridge" to align heading at junction boundaries,
 * matching the pattern used by professional OpenDRIVE tools.
 */
function buildTransitionSegment(
  s: number,
  x: number, y: number, hdg: number,
  length: number,
): OdrGeometry {
  return {
    s,
    x, y, hdg,
    length,
    type: 'paramPoly3',
    aU: 0, bU: 1, cU: 0, dU: 0,
    aV: 0, bV: 0, cV: 0, dV: 0,
    pRange: 'arcLength',
  };
}

/**
 * Evaluate an arc at a given arc-length distance from its start.
 */
function evaluateArc(
  x: number, y: number, hdg: number, curvature: number, ds: number,
): { x: number; y: number; hdg: number } {
  if (Math.abs(curvature) < 1e-12) {
    return { x: x + ds * Math.cos(hdg), y: y + ds * Math.sin(hdg), hdg };
  }
  const r = 1 / curvature;
  const theta = ds * curvature;
  const cx = x - r * Math.sin(hdg);
  const cy = y + r * Math.cos(hdg);
  return {
    x: cx + r * Math.sin(hdg + theta),
    y: cy - r * Math.cos(hdg + theta),
    hdg: hdg + theta,
  };
}

/**
 * Solve for the unique arc that matches both start and end heading constraints.
 *
 * The circle center lies at the intersection of the perpendiculars from both
 * endpoints. Tries both turn directions and picks the valid one.
 * Returns null if no valid arc can be found.
 */
function solveTwoPointArc(
  startX: number, startY: number, startHdg: number,
  endX: number, endY: number, endHdg: number,
): OdrGeometry | null {
  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 0.01) return null;

  // Try both turn directions and pick the one that produces a valid short arc
  for (const sign of [1, -1] as const) {
    const result = tryArcWithSign(startX, startY, startHdg, endX, endY, endHdg, dx, dy, sign);
    if (result) return result;
  }

  return null;
}

function tryArcWithSign(
  startX: number, startY: number, startHdg: number,
  endX: number, endY: number, _endHdg: number,
  dx: number, dy: number,
  sign: 1 | -1,
): OdrGeometry | null {
  // Normal directions (perpendicular to heading, pointing toward center)
  const n1x = -sign * Math.sin(startHdg);
  const n1y = sign * Math.cos(startHdg);
  const n2x = -sign * Math.sin(_endHdg);
  const n2y = sign * Math.cos(_endHdg);

  // Solve: start + t1*n1 = end + t2*n2
  const det = n1x * (-n2y) - (-n2x) * n1y;
  if (Math.abs(det) < 1e-8) return null;

  const t1 = (dx * (-n2y) - dy * (-n2x)) / det;

  // Circle center and radius
  const cx = startX + t1 * n1x;
  const cy = startY + t1 * n1y;
  const radius = Math.abs(t1);

  if (radius < 0.5 || radius > 10000) return null;

  // Arc angle: angle from center to start vs center to end
  const angleStart = Math.atan2(startY - cy, startX - cx);
  const angleEnd = Math.atan2(endY - cy, endX - cx);
  let arcAngle = normalizeAngle(angleEnd - angleStart);

  // Ensure arc sweeps in the correct direction
  if (sign > 0 && arcAngle > 0) arcAngle -= 2 * Math.PI;
  if (sign < 0 && arcAngle < 0) arcAngle += 2 * Math.PI;

  const arcLength = Math.abs(arcAngle) * radius;
  if (arcLength < 0.01 || arcLength > 1000) return null;

  // Curvature: positive = left turn (counterclockwise) in OpenDRIVE
  const curvature = sign / radius;

  // Verify: the arc must actually reach the end position
  const endPose = evaluateArc(startX, startY, startHdg, curvature, arcLength);
  const posError = Math.sqrt((endPose.x - endX) ** 2 + (endPose.y - endY) ** 2);
  if (posError > 0.5) return null;

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
 * Solve connecting road geometry using the Arc + Transition approach.
 *
 * Strategy (matching professional OpenDRIVE tools):
 * 1. For nearly straight connections (angle < ~10°): paramPoly3 with small corrections
 * 2. For turns: compute the unique arc matching both endpoint headings.
 *    If the exact two-point arc fails, fall back to position-only arc + transition.
 */
function solveConnectingGeometry(
  startX: number, startY: number, startHdg: number,
  endX: number, endY: number, endHdg: number,
): OdrGeometry[] | null {
  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 0.01) return null;

  // Compute the turn angle (how much direction changes)
  const turnAngle = Math.abs(normalizeAngle(endHdg - startHdg));

  // Nearly straight — use paramPoly3 for minor corrections
  if (turnAngle < Math.PI / 18) { // < 10°
    return [solveNearStraightGeometry(startX, startY, startHdg, endX, endY, endHdg, dist)];
  }

  // Try exact two-point arc (matches both position AND heading at both endpoints)
  const twoPointArc = solveTwoPointArc(startX, startY, startHdg, endX, endY, endHdg);
  if (twoPointArc) {
    // Verify endpoint position accuracy
    const arcEnd = evaluateArc(
      twoPointArc.x, twoPointArc.y, twoPointArc.hdg,
      twoPointArc.curvature ?? 0, twoPointArc.length,
    );
    const posError = Math.sqrt((arcEnd.x - endX) ** 2 + (arcEnd.y - endY) ** 2);
    if (posError < 0.5) {
      return [twoPointArc];
    }
  }

  // Fallback: position-only arc + short transition segment
  const arcGeo = solveArcGeometry(startX, startY, startHdg, endX, endY);
  if (!arcGeo || arcGeo.type === 'line') {
    return arcGeo ? [arcGeo] : null;
  }

  // Check heading match
  const arcEndHdg = startHdg + (arcGeo.curvature ?? 0) * arcGeo.length;
  const hdgError = Math.abs(normalizeAngle(arcEndHdg - endHdg));

  if (hdgError < 0.02) {
    return [arcGeo];
  }

  // Add transition segment
  const transitionLength = 0.14;
  const arcEnd = evaluateArc(
    arcGeo.x, arcGeo.y, arcGeo.hdg,
    arcGeo.curvature ?? 0, arcGeo.length,
  );

  const transition = buildTransitionSegment(
    arcGeo.length,
    arcEnd.x, arcEnd.y, arcEnd.hdg,
    transitionLength,
  );

  return [arcGeo, transition];
}

/**
 * Solve geometry for a nearly-straight connection using paramPoly3.
 * Used for straight-through paths with minor lateral offset correction.
 */
function solveNearStraightGeometry(
  startX: number, startY: number, startHdg: number,
  endX: number, endY: number, endHdg: number,
  dist: number,
): OdrGeometry {
  // Transform to local coordinates
  const dx = endX - startX;
  const dy = endY - startY;
  const cosH = Math.cos(-startHdg);
  const sinH = Math.sin(-startHdg);
  const localEndX = dx * cosH - dy * sinH;
  const localEndY = dx * sinH + dy * cosH;
  const localEndHdg = endHdg - startHdg;

  // For near-straight paths, use arc-length parameterization (like professional tools)
  // with small correction coefficients
  const tangentScale = dist * 0.5;
  const endTangentX = tangentScale * Math.cos(localEndHdg);
  const endTangentY = tangentScale * Math.sin(localEndHdg);

  const aU = 0;
  const bU = 1; // unit speed in arc-length parameterization
  // Scale corrections to be very small (near-straight)
  const cU = (3 * localEndX / (dist * dist) - 2 / dist - endTangentX / (dist * dist));
  const dU = (-2 * localEndX / (dist * dist * dist) + 1 / (dist * dist) + endTangentX / (dist * dist * dist));

  const aV = 0;
  const bV = 0;
  const cV = (3 * localEndY / (dist * dist) - endTangentY / (dist * dist));
  const dV = (-2 * localEndY / (dist * dist * dist) + endTangentY / (dist * dist * dist));

  return {
    s: 0,
    x: startX,
    y: startY,
    hdg: startHdg,
    length: dist,
    type: 'paramPoly3',
    aU, bU, cU, dU,
    aV, bV, cV, dV,
    pRange: 'arcLength',
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
  // Outgoing heading: reverse the "into junction" direction to get "into the road arm"
  const outHdg = outgoing.hdg + Math.PI;

  // Compute incoming heading (direction leaving the incoming road into the junction)
  const inHdg = incoming.hdg;

  // Offset reference line positions to driving lane centers.
  // The connecting road's lane center sits at t=0 (via laneOffset), so the geometry
  // must start/end at the correct lane centers on the incoming/outgoing roads.
  //
  // Incoming lanes (flowing INTO the junction):
  //   contactPoint='end'  → right lanes, center at t = -(totalWidth/2)
  //   contactPoint='start' → left lanes, center at t = +(totalWidth/2)
  //
  // Outgoing lanes (RECEIVING traffic from the junction) — opposite side:
  //   contactPoint='start' → right lanes, center at t = -(totalWidth/2)
  //   contactPoint='end'   → left lanes, center at t = +(totalWidth/2)
  const incomingWidth = incoming.drivingLanes.reduce(
    (sum, l) => sum + (l.width[0]?.a ?? 3.5), 0,
  );
  const inT = incoming.contactPoint === 'end'
    ? -(incomingWidth / 2)
    : incomingWidth / 2;
  // incoming.hdg is already the "into junction" direction; ref line hdg is the road's own hdg
  const inRefHdg = incoming.contactPoint === 'end'
    ? inHdg          // end: hdg = pose.hdg (no flip)
    : inHdg - Math.PI; // start: hdg was flipped by +π, undo for perpendicular calc
  const startX = incoming.x + inT * -Math.sin(inRefHdg);
  const startY = incoming.y + inT * Math.cos(inRefHdg);

  // For outgoing, we need the RECEIVING lane center (opposite side from drivingLanes).
  // outgoing.drivingLanes are lanes flowing INTO the junction from this road;
  // the receiving lanes are on the opposite side with matching width.
  const outgoingWidth = outgoing.drivingLanes.reduce(
    (sum, l) => sum + (l.width[0]?.a ?? 3.5), 0,
  );
  const outT = outgoing.contactPoint === 'start'
    ? -(outgoingWidth / 2)  // receiving → right lanes
    : outgoingWidth / 2;    // receiving → left lanes
  const outRefHdg = outgoing.contactPoint === 'end'
    ? outgoing.hdg           // end: hdg = pose.hdg
    : outgoing.hdg - Math.PI; // start: undo the +π flip
  const endX = outgoing.x + outT * -Math.sin(outRefHdg);
  const endY = outgoing.y + outT * Math.cos(outRefHdg);

  // Solve geometry: arc-based approach with optional transition segments
  const geometries = solveConnectingGeometry(
    startX, startY, inHdg,
    endX, endY, outHdg,
  );

  if (!geometries || geometries.length === 0) return null;

  const totalLength = geometries.reduce((sum, g) => sum + g.length, 0);

  // Build lane section: driving lanes matching the incoming road
  const roadId = nextNumericId(doc.roads.map((r) => r.id));
  const rightLanes: OdrLane[] = [];

  for (let i = 0; i < laneCount; i++) {
    const laneId = -(i + 1);
    const isOutermost = i === laneCount - 1;

    // Lane-level predecessor/successor links for esmini routing:
    //   predecessorId = incoming road lane ID that feeds this connecting lane
    //   successorId = outgoing road lane ID where traffic exits
    const predecessorId = incoming.drivingLanes[i]?.id;
    // Outgoing lane depends on contact point:
    //   'start' → vehicle enters going in ref direction → right lane -(i+1)
    //   'end'   → vehicle enters going against ref direction → left lane (i+1)
    const successorId =
      spec.outgoingContactPoint === 'start' ? -(i + 1) : i + 1;

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
      link: {
        ...(predecessorId !== undefined ? { predecessorId } : {}),
        successorId,
      },
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

  // Compute laneOffset so the reference line runs through the driving lane center.
  // The right lane extends from t=laneOffset to t=laneOffset-width, so setting
  // laneOffset = width/2 centers the lane on the reference line (t=0).
  const laneWidth = rightLanes[0]?.width[0]?.a ?? 3.5;
  const laneOffsetA = (laneWidth * laneCount) / 2;

  const road = createRoadFromPartial(
    {
      id: roadId,
      name: `conn_${incoming.roadId}_to_${outgoing.roadId}`,
      length: totalLength,
      junction: junctionId,
      link: {
        predecessor: {
          elementType: 'road',
          elementId: spec.incomingRoadId,
          contactPoint: spec.incomingContactPoint,
        },
        successor: {
          elementType: 'road',
          elementId: spec.outgoingRoadId,
          contactPoint: spec.outgoingContactPoint,
        },
      },
      planView: geometries,
      laneOffset: [{ s: 0, a: laneOffsetA, b: 0, c: 0, d: 0 }],
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

      // Skip same-road connections: straight-throughs are handled by the
      // original (unsplit) road, and U-turns are not needed.
      if (incoming.roadId === outgoing.roadId) continue;

      // Compute actual connecting road directions:
      //   inHdg  = incoming.hdg           (into junction = connecting road start heading)
      //   outHdg = outgoing.hdg + π       (out of junction = connecting road end heading)
      const inHdg = incoming.hdg;
      const outHdg = outgoing.hdg + Math.PI;

      // Classify turn using the connecting road's actual travel directions
      const turnType = classifyTurn(inHdg, outHdg);

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
