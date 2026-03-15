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

interface LanePair {
  incomingLane: OdrLane;
  outgoingLaneId: number;
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

/**
 * Map eligible incoming lanes to outgoing receiving lane IDs.
 * Pairs are sorted inner-to-outer (by ascending |id|) and capped
 * at the smaller of incoming eligible lanes and outgoing driving lanes.
 */
function mapLanePairs(
  eligibleLanes: OdrLane[],
  outgoing: RoadEndpoint,
): LanePair[] {
  // Sort by |id| ascending (inner to outer)
  const sorted = [...eligibleLanes].sort((a, b) => Math.abs(a.id) - Math.abs(b.id));

  // Cap at outgoing lane count to avoid referencing non-existent lanes
  const maxPairs = Math.min(sorted.length, outgoing.drivingLanes.length);

  return sorted.slice(0, maxPairs).map((lane, i) => ({
    incomingLane: lane,
    // Receiving lane: 'start' → right lanes (negative IDs), 'end' → left lanes (positive IDs)
    outgoingLaneId: outgoing.contactPoint === 'start' ? -(i + 1) : i + 1,
  }));
}

/**
 * Compute the t-offset of a specific incoming lane's center from the road reference line.
 */
function computeIncomingLaneCenterT(
  allDrivingLanes: OdrLane[],
  targetLane: OdrLane,
  contactPoint: 'start' | 'end',
): number {
  // Sort by |id| ascending (inner to outer)
  const sorted = [...allDrivingLanes].sort((a, b) => Math.abs(a.id) - Math.abs(b.id));
  // end → right lanes (negative t), start → left lanes (positive t)
  const sign = contactPoint === 'end' ? -1 : 1;

  let offset = 0;
  for (const lane of sorted) {
    const w = lane.width[0]?.a ?? 3.5;
    if (lane.id === targetLane.id) {
      return sign * (offset + w / 2);
    }
    offset += w;
  }
  return sign * (offset + 1.75); // fallback
}

/**
 * Compute the t-offset of a receiving lane's center on the outgoing road.
 * Uses drivingLanes widths as proxy (symmetric road assumed).
 */
function computeReceivingLaneCenterT(
  outgoing: RoadEndpoint,
  receivingLaneId: number,
): number {
  const sign = receivingLaneId < 0 ? -1 : 1;
  const targetAbsId = Math.abs(receivingLaneId);

  const sorted = [...outgoing.drivingLanes].sort((a, b) => Math.abs(a.id) - Math.abs(b.id));
  let offset = 0;
  for (let i = 0; i < sorted.length; i++) {
    const w = sorted[i].width[0]?.a ?? 3.5;
    if (i + 1 === targetAbsId) {
      return sign * (offset + w / 2);
    }
    offset += w;
  }
  return sign * (offset + 1.75); // fallback
}

/** Normalize angle to [-PI, PI]. */
function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a <= -Math.PI) a += 2 * Math.PI;
  return a;
}

/**
 * Build the set of directed (incoming→outgoing) road pairs whose outermost
 * connecting-road lane traces the junction's outer perimeter.
 *
 * Algorithm:
 *   1. Sort road arms by their angle from the junction centroid.
 *   2. For each pair of adjacent arms in this ring, exactly ONE direction
 *      of travel forms the outer boundary — the one that keeps the vehicle
 *      on the outside of the junction.
 *   3. In RHT the outer curve between adjacent arms Aᵢ and Aᵢ₊₁ (sorted
 *      counter-clockwise) is the connecting road going Aᵢ₊₁ → Aᵢ (a right
 *      turn that hugs the outside).  In LHT it's Aᵢ → Aᵢ₊₁.
 *
 * This works for any number of arms (3-way, 4-way, 5-way, …) and both
 * traffic rules without special-casing turn types.
 */
function buildOuterEdgePairs(
  endpoints: RoadEndpoint[],
  trafficRule: 'RHT' | 'LHT' = 'RHT',
): Set<string> {
  // Deduplicate road arms (split roads share the same junction endpoint)
  const armMap = new Map<string, { roadId: string; angle: number }>();
  for (const ep of endpoints) {
    if (!armMap.has(ep.roadId)) {
      armMap.set(ep.roadId, { roadId: ep.roadId, angle: 0 });
    }
  }

  // Compute junction centroid
  let cx = 0;
  let cy = 0;
  for (const ep of endpoints) {
    cx += ep.x;
    cy += ep.y;
  }
  cx /= endpoints.length;
  cy /= endpoints.length;

  // Compute angle from centroid for each arm
  for (const ep of endpoints) {
    const arm = armMap.get(ep.roadId);
    if (arm) {
      arm.angle = Math.atan2(ep.y - cy, ep.x - cx);
    }
  }

  // Sort arms counter-clockwise (ascending angle)
  const arms = [...armMap.values()].sort((a, b) => a.angle - b.angle);

  // For each pair of adjacent arms, determine which direction is the outer edge.
  //
  // Arms are sorted counter-clockwise: Aᵢ, Aᵢ₊₁.
  //
  // RHT: vehicles drive on the right → the outer-edge curve between
  //   adjacent arms is the connecting road going Aᵢ → Aᵢ₊₁ (a right turn
  //   that hugs the outside of the junction).
  // LHT: mirror → the outer-edge curve is Aᵢ₊₁ → Aᵢ.
  const pairs = new Set<string>();
  for (let i = 0; i < arms.length; i++) {
    const next = (i + 1) % arms.length;
    if (trafficRule === 'RHT') {
      // Outer edge: Aᵢ → Aᵢ₊₁  (right turn hugging the outside)
      pairs.add(`${arms[i].roadId}:${arms[next].roadId}`);
    } else {
      // LHT: Aᵢ₊₁ → Aᵢ  (left turn hugging the outside)
      pairs.add(`${arms[next].roadId}:${arms[i].roadId}`);
    }
  }
  return pairs;
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

  // t1 > 0 means center is on the expected side for this sign direction.
  // t1 < 0 means the arc center is on the wrong side — skip.
  if (t1 < 0) return null;

  // Circle center and radius
  const cx = startX + t1 * n1x;
  const cy = startY + t1 * n1y;
  const radius = t1; // t1 >= 0 guaranteed

  if (radius < 0.5 || radius > 10000) return null;

  // Arc angle: angle from center to start vs center to end
  const angleStart = Math.atan2(startY - cy, startX - cx);
  const angleEnd = Math.atan2(endY - cy, endX - cx);
  let arcAngle = normalizeAngle(angleEnd - angleStart);

  // Ensure arc sweeps in the correct direction:
  //   sign=1 (left/CCW): arcAngle should be positive
  //   sign=-1 (right/CW): arcAngle should be negative
  if (sign > 0 && arcAngle < 0) arcAngle += 2 * Math.PI;
  if (sign < 0 && arcAngle > 0) arcAngle -= 2 * Math.PI;

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

  // Fallback: Hermite paramPoly3 — matches both position AND heading at both endpoints
  return [solveHermiteGeometry(startX, startY, startHdg, endX, endY, endHdg, dist)];
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
 * Solve geometry using Hermite cubic interpolation (paramPoly3).
 * Matches position AND heading at both endpoints exactly.
 * Used as fallback when no single circular arc can satisfy both heading constraints.
 *
 * Uses normalized parameterization (p ∈ [0,1]) for better numerical stability
 * on larger turns where arc-length parameterization can diverge.
 */
function solveHermiteGeometry(
  startX: number, startY: number, startHdg: number,
  endX: number, endY: number, endHdg: number,
  dist: number,
): OdrGeometry {
  // Transform to local coordinates (start = origin, start heading = +x)
  const gdx = endX - startX;
  const gdy = endY - startY;
  const cosH = Math.cos(-startHdg);
  const sinH = Math.sin(-startHdg);
  const localEndX = gdx * cosH - gdy * sinH;
  const localEndY = gdx * sinH + gdy * cosH;
  const localEndHdg = normalizeAngle(endHdg - startHdg);

  // Hermite cubic with normalized parameter p ∈ [0,1]:
  //   P(0) = (0, 0), P(1) = (localEndX, localEndY)
  //   P'(0) = tangentScale * (1, 0), P'(1) = tangentScale * (cos θ, sin θ)
  //
  // The tangent scale controls curve "tightness". Using dist works well
  // for most turn angles; for very sharp turns, reduce to avoid loops.
  const tangentScale = dist;
  const endTangentX = tangentScale * Math.cos(localEndHdg);
  const endTangentY = tangentScale * Math.sin(localEndHdg);

  // Hermite basis in normalized form:
  //   U(p) = aU + bU*p + cU*p² + dU*p³
  //   V(p) = aV + bV*p + cV*p² + dV*p³
  //
  //   U(0) = 0,           U(1) = localEndX
  //   U'(0) = tangentScale, U'(1) = endTangentX
  //   V(0) = 0,           V(1) = localEndY
  //   V'(0) = 0,          V'(1) = endTangentY
  const aU = 0;
  const bU = tangentScale;
  const cU = 3 * localEndX - 2 * tangentScale - endTangentX;
  const dU = -2 * localEndX + tangentScale + endTangentX;

  const aV = 0;
  const bV = 0;
  const cV = 3 * localEndY - endTangentY;
  const dV = -2 * localEndY + endTangentY;

  return {
    s: 0,
    x: startX,
    y: startY,
    hdg: startHdg,
    length: dist,
    type: 'paramPoly3',
    aU, bU, cU, dU,
    aV, bV, cV, dV,
    pRange: 'normalized',
  };
}

/**
 * Build a single connecting road for one lane pair between two endpoints.
 * Each connecting road has exactly one driving lane.
 */
function buildConnectingRoad(
  spec: ConnectingRoadSpec,
  incoming: RoadEndpoint,
  outgoing: RoadEndpoint,
  junctionId: string,
  lanePair: LanePair,
  doc: OpenDriveDocument,
  outerEdge: boolean,
): GeneratedConnectingRoad | null {
  // Outgoing heading: reverse the "into junction" direction to get "into the road arm"
  const outHdg = outgoing.hdg + Math.PI;

  // Compute incoming heading (direction leaving the incoming road into the junction)
  const inHdg = incoming.hdg;

  // Offset reference line to the specific lane center (not the center of all lanes).
  const inT = computeIncomingLaneCenterT(
    incoming.drivingLanes, lanePair.incomingLane, incoming.contactPoint,
  );
  // incoming.hdg is already the "into junction" direction; ref line hdg is the road's own hdg
  const inRefHdg = incoming.contactPoint === 'end'
    ? inHdg          // end: hdg = pose.hdg (no flip)
    : inHdg - Math.PI; // start: hdg was flipped by +π, undo for perpendicular calc
  const startX = incoming.x + inT * -Math.sin(inRefHdg);
  const startY = incoming.y + inT * Math.cos(inRefHdg);

  // Offset to the specific receiving lane center on the outgoing road.
  const outT = computeReceivingLaneCenterT(outgoing, lanePair.outgoingLaneId);
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

  // Build lane section: single driving lane
  const roadId = nextNumericId(doc.roads.map((r) => r.id));
  const laneWidth = lanePair.incomingLane.width[0]?.a ?? 3.5;

  const rightLanes: OdrLane[] = [
    {
      id: -1,
      type: 'driving',
      width: [{ sOffset: 0, a: laneWidth, b: 0, c: 0, d: 0 }],
      roadMarks: [
        { sOffset: 0, type: outerEdge ? 'solid' : 'none', color: 'standard' },
      ],
      link: {
        predecessorId: lanePair.incomingLane.id,
        successorId: lanePair.outgoingLaneId,
      },
    },
  ];

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

  // laneOffset centers the single lane on the reference line
  const laneOffsetA = laneWidth / 2;

  const road = createRoadFromPartial(
    {
      id: roadId,
      name: `conn_${incoming.roadId}_L${lanePair.incomingLane.id}_to_${outgoing.roadId}`,
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

  // Single lane link: incoming lane → connecting road lane -1
  const laneLinks = [{ from: lanePair.incomingLane.id, to: -1 as number }];

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

  // Determine which directed connecting-road pairs trace the junction's
  // outer perimeter.  Only these get road-edge markings on the outermost lane.
  // Detect traffic rule from first endpoint's road, defaulting to RHT.
  const trafficRule = endpoints[0]?.road.rule ?? 'RHT';
  const outerEdgePairs = buildOuterEdgePairs(endpoints, trafficRule);

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

      // Check if this connecting road traces the junction's outer boundary
      const isOuterEdge = outerEdgePairs.has(
        `${incoming.roadId}:${outgoing.roadId}`,
      );

      // Map eligible lanes to outgoing lane pairs and generate one road per pair
      const pairs = mapLanePairs(eligibleLanes, outgoing);

      for (let p = 0; p < pairs.length; p++) {
        // Augment the doc with already-created roads for ID generation
        const augmentedDoc = {
          ...doc,
          roads: [...doc.roads, ...roads],
          junctions: doc.junctions.map((jn) =>
            jn.id === junctionId
              ? { ...jn, connections: [...jn.connections, ...connections] }
              : jn,
          ),
        };

        // Only the outermost lane pair gets the solid road mark
        const isOutermostPair = p === pairs.length - 1;

        const result = buildConnectingRoad(
          spec,
          incoming,
          outgoing,
          junctionId,
          pairs[p],
          augmentedDoc,
          isOuterEdge && isOutermostPair,
        );

        if (result) {
          roads.push(result.road);
          connections.push(result.connection);
        }
      }
    }
  }

  return { roads, connections };
}
