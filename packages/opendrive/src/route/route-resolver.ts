/**
 * Pure-JS OpenDRIVE route resolver.
 *
 * Given a start and end `LanePosition`, produce an ordered list of
 * `RouteSegment` ({roadId, laneId, entryS, exitS}) that walks from start
 * to end using OpenDRIVE `<link>`, `<laneLink>`, and junction `<connection>`
 * structures — **without** relying on world-space heuristics or WASM.
 *
 * Algorithm: BFS over states (roadId, laneId, exitSide). At each node,
 * expand via directNextRoad (road→road link) or junctionConnectionsFrom
 * (road→junction→connectingRoad→outgoingRoad, 3-hop dereference).
 *
 * LHT/RHT: the road graph is rule-independent (per
 * docs/development/opendrive-lht-rht.md §7). This resolver does NOT look at
 * `@rule`; lane ID sign handling is the xodr author's responsibility.
 */

import type { OpenDriveDocument, OdrRoad, LanePosition } from '@osce/shared';
import {
  contactEndS,
  directNextRoad,
  junctionConnectionsFrom,
  type RoadSide,
} from './road-linking.js';

export interface RouteSegment {
  roadId: string;
  laneId: number;
  entryS: number;
  exitS: number;
}

interface SearchNode {
  roadId: string;
  laneId: number;
  /** s value at which we entered this road (0 or length, except for the start). */
  entryS: number;
  /** Parent pointer for path reconstruction. */
  parent: SearchNode | null;
}

/**
 * Find the side of a road that `s` belongs to, preferring the *entering* side.
 * For interior start points, both sides are valid exits; caller branches.
 */
function findRoad(doc: OpenDriveDocument, id: string): OdrRoad | null {
  return doc.roads.find((r) => r.id === id) ?? null;
}

/**
 * From a state (road, lane, entryS), enumerate outgoing transitions.
 * Returns { nextRoad, nextLane, nextEntryS } for each reachable neighbor.
 *
 * The exit side is "the side that is NOT entryS". If entryS is interior (not
 * 0 or length), both sides are tried.
 */
function expand(
  road: OdrRoad,
  laneId: number,
  entryS: number,
  doc: OpenDriveDocument,
): Array<{ nextRoadId: string; nextLaneId: number; nextEntryS: number }> {
  const results: Array<{ nextRoadId: string; nextLaneId: number; nextEntryS: number }> = [];
  const exitSides: RoadSide[] = [];

  if (Math.abs(entryS) < 1e-3) exitSides.push('successor');
  else if (Math.abs(entryS - road.length) < 1e-3) exitSides.push('predecessor');
  else {
    // Interior start: both directions allowed.
    exitSides.push('successor', 'predecessor');
  }

  for (const exitSide of exitSides) {
    // Direct road→road transition
    const direct = directNextRoad(road, exitSide, doc);
    if (direct) {
      // Follow lane link; if lane has no link, assume same ID (rare)
      const fromSectionSide = exitSide;
      const lane = findLaneAnywhere(road, laneId, fromSectionSide);
      let nextLaneId = laneId;
      if (lane?.link) {
        const lid =
          exitSide === 'predecessor' ? lane.link.predecessorId : lane.link.successorId;
        if (lid !== undefined) nextLaneId = lid;
      }
      results.push({
        nextRoadId: direct.road.id,
        nextLaneId,
        nextEntryS: direct.arrivalS,
      });
      continue;
    }

    // Junction transition: iterate connections whose incomingRoad === road.id
    const conns = junctionConnectionsFrom(road, exitSide, doc);
    for (const c of conns) {
      // Match laneLinks where from === laneId
      for (const ll of c.laneLinks) {
        if (ll.from !== laneId) continue;
        // Enter connecting road at the incoming-side end
        const crEntrySide: RoadSide =
          c.connection.contactPoint === 'start' ? 'predecessor' : 'successor';
        const crEntryS = contactEndS(c.connectingRoad, crEntrySide);
        results.push({
          nextRoadId: c.connectingRoad.id,
          nextLaneId: ll.to,
          nextEntryS: crEntryS,
        });
      }
    }
  }

  return results;
}

/**
 * Find a lane in any lane section of the road, preferring the section
 * closest to `side`. Used for lane-link lookup during transitions.
 */
function findLaneAnywhere(road: OdrRoad, laneId: number, side: RoadSide) {
  if (road.lanes.length === 0) return null;
  const section =
    side === 'predecessor' ? road.lanes[0] : road.lanes[road.lanes.length - 1];
  if (laneId === 0) return section.centerLane;
  if (laneId > 0) return section.leftLanes.find((l) => l.id === laneId) ?? null;
  return section.rightLanes.find((l) => l.id === laneId) ?? null;
}

/**
 * Resolve a route between two LanePositions using OpenDRIVE link structures.
 *
 * Returns null if no path found within `maxDepth`.
 */
export function resolveRoute(
  doc: OpenDriveDocument,
  from: LanePosition,
  to: LanePosition,
  maxDepth = 64,
): RouteSegment[] | null {
  const fromLaneId = parseInt(from.laneId, 10);
  const toLaneId = parseInt(to.laneId, 10);
  const fromS = Number(from.s);
  const toS = Number(to.s);

  // Trivial: same road, same lane
  if (from.roadId === to.roadId && fromLaneId === toLaneId) {
    return [
      { roadId: from.roadId, laneId: fromLaneId, entryS: fromS, exitS: toS },
    ];
  }

  const startRoad = findRoad(doc, from.roadId);
  const goalRoad = findRoad(doc, to.roadId);
  if (!startRoad || !goalRoad) return null;

  const queue: SearchNode[] = [
    {
      roadId: from.roadId,
      laneId: fromLaneId,
      entryS: fromS,
      parent: null,
    },
  ];
  // Visited key: `${roadId}|${laneId}|${entrySideKey}` to avoid pointless revisits
  const visited = new Set<string>();
  const visitKey = (roadId: string, laneId: number, entryS: number, roadLen: number) => {
    const side =
      Math.abs(entryS) < 1e-3
        ? 'P'
        : Math.abs(entryS - roadLen) < 1e-3
          ? 'S'
          : `I${entryS.toFixed(2)}`;
    return `${roadId}|${laneId}|${side}`;
  };
  visited.add(visitKey(from.roadId, fromLaneId, fromS, startRoad.length));

  let found: SearchNode | null = null;

  let depth = 0;
  while (queue.length > 0 && depth < maxDepth * queue.length + 1000) {
    depth++;
    const node = queue.shift()!;
    const road = findRoad(doc, node.roadId);
    if (!road) continue;

    // Goal check
    if (node.roadId === to.roadId && node.laneId === toLaneId) {
      // Verify reachability in s: node.entryS is either 0, length, or the start s.
      // Goal is reachable if toS is in [min(entryS, otherEnd), max(...)] for the
      // traversal direction. For start-road itself we already handled above.
      found = node;
      break;
    }

    for (const next of expand(road, node.laneId, node.entryS, doc)) {
      const nextRoad = findRoad(doc, next.nextRoadId);
      if (!nextRoad) continue;
      const k = visitKey(next.nextRoadId, next.nextLaneId, next.nextEntryS, nextRoad.length);
      if (visited.has(k)) continue;
      visited.add(k);
      queue.push({
        roadId: next.nextRoadId,
        laneId: next.nextLaneId,
        entryS: next.nextEntryS,
        parent: node,
      });
    }
  }

  if (!found) return null;

  // Reconstruct path (node chain is in reverse)
  const chain: SearchNode[] = [];
  for (let n: SearchNode | null = found; n; n = n.parent) chain.push(n);
  chain.reverse();

  // Convert each node to a RouteSegment.
  // For segment i: entryS = chain[i].entryS, exitS = (i === last) ? toS :
  // "the end we leave from" (opposite of entryS, with value 0 or length).
  const segments: RouteSegment[] = [];
  for (let i = 0; i < chain.length; i++) {
    const n = chain[i];
    const road = findRoad(doc, n.roadId)!;
    const entryS = n.entryS;
    let exitS: number;
    if (i === chain.length - 1) {
      exitS = toS;
    } else {
      // Exit at the opposite end of the road from entryS.
      if (Math.abs(entryS) < 1e-3) exitS = road.length;
      else if (Math.abs(entryS - road.length) < 1e-3) exitS = 0;
      else {
        // Interior start (only possible for i=0). We must decide direction based
        // on the next node's entry — use the next link implicit direction.
        const nextNode = chain[i + 1];
        // The side we left from is the one whose link points to nextNode.roadId
        exitS = inferExitSForInteriorStart(road, n.laneId, nextNode.roadId, doc) ?? road.length;
      }
    }
    segments.push({ roadId: n.roadId, laneId: n.laneId, entryS, exitS });
  }

  return segments;
}

/**
 * When the start position is in the interior of its road, decide exit s by
 * checking which link (predecessor/successor) points toward the next road.
 */
function inferExitSForInteriorStart(
  road: OdrRoad,
  _laneId: number,
  nextRoadId: string,
  doc: OpenDriveDocument,
): number | null {
  for (const side of ['predecessor', 'successor'] as RoadSide[]) {
    const direct = directNextRoad(road, side, doc);
    if (direct && direct.road.id === nextRoadId) {
      return contactEndS(road, side);
    }
    const conns = junctionConnectionsFrom(road, side, doc);
    if (conns.some((c) => c.connectingRoad.id === nextRoadId)) {
      return contactEndS(road, side);
    }
  }
  return null;
}
