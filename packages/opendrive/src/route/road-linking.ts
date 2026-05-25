/**
 * OpenDRIVE link / contactPoint resolution utilities.
 *
 * These pure functions let route computation follow `<link>` elements
 * deterministically instead of relying on world-space nearest-end heuristics.
 *
 * Reference: ASAM OpenDRIVE 1.6 §8.2 (Road Linkage), §9.4 (Lane linkage),
 *            §10 (Junctions). See docs/development/opendrive-lht-rht.md.
 */

import type {
  OpenDriveDocument,
  OdrRoad,
  OdrRoadLinkElement,
  OdrJunction,
  OdrJunctionConnection,
  OdrLane,
  OdrLaneSection,
} from '@osce/shared';

export type RoadSide = 'predecessor' | 'successor';

/** s value of the predecessor (s=0) or successor (s=length) end. */
export function contactEndS(road: OdrRoad, side: RoadSide): number {
  return side === 'predecessor' ? 0 : road.length;
}

/** Inverse of contactEndS: given an s near 0 or length, return which side. */
export function sideOfS(road: OdrRoad, s: number, eps = 1e-3): RoadSide | null {
  if (s <= eps) return 'predecessor';
  if (s >= road.length - eps) return 'successor';
  return null;
}

/** Return the road-link element on the given side, if any. */
export function roadLinkOn(
  road: OdrRoad,
  side: RoadSide,
): OdrRoadLinkElement | undefined {
  return road.link?.[side];
}

/** contactPoint value ('start'|'end') → arrival s on that road. */
export function arrivalSFromContactPoint(
  road: OdrRoad,
  contactPoint: 'start' | 'end',
): number {
  return contactPoint === 'start' ? 0 : road.length;
}

/**
 * Given we are leaving `road` on `leavingSide`, what is the **direct** next road?
 * Returns null if the link is missing or goes to a junction (caller must resolve).
 *
 * The arrivalSide is derived from the remote road's contactPoint:
 * - contactPoint=start → arrive at s=0 (predecessor side)
 * - contactPoint=end   → arrive at s=length (successor side)
 *
 * When the remote contactPoint is undefined (spec-default for roads is that
 * contactPoint is required, but real xodrs omit it for junction links), we
 * return null.
 */
export function directNextRoad(
  road: OdrRoad,
  leavingSide: RoadSide,
  odrDoc: OpenDriveDocument,
): { road: OdrRoad; arrivalSide: RoadSide; arrivalS: number } | null {
  const link = roadLinkOn(road, leavingSide);
  if (!link || link.elementType !== 'road' || !link.contactPoint) return null;
  const nextRoad = odrDoc.roads.find((r) => r.id === link.elementId);
  if (!nextRoad) return null;
  const arrivalSide: RoadSide =
    link.contactPoint === 'start' ? 'predecessor' : 'successor';
  return {
    road: nextRoad,
    arrivalSide,
    arrivalS: contactEndS(nextRoad, arrivalSide),
  };
}

/**
 * Find a lane on the road by ID across its laneSections.
 * Routes pass through a single road but a road may have multiple laneSections
 * internally. For link-trace purposes we use the first or last section depending
 * on which side we're looking at.
 */
export function findLaneOnSide(
  road: OdrRoad,
  laneId: number,
  side: RoadSide,
): OdrLane | null {
  if (road.lanes.length === 0) return null;
  const section = side === 'predecessor' ? road.lanes[0] : road.lanes[road.lanes.length - 1];
  if (laneId === 0) return section.centerLane;
  if (laneId > 0) return section.leftLanes.find((l) => l.id === laneId) ?? null;
  return section.rightLanes.find((l) => l.id === laneId) ?? null;
}

/**
 * Follow a `<lane><link>` across a direct road-to-road boundary.
 * Leaves `road` on `leavingSide`, arrives on the connected road's opposite side.
 * Returns null when the link is not a direct road link or lane link is missing.
 *
 * Per OpenDRIVE 1.6 §9.4, the lane link `<predecessor id="X"/>` refers to the
 * geometrically continuous lane ID on the connected road. ID sign flips
 * (start-to-start / end-to-end) are baked into X by the xodr author — this
 * utility does NOT re-flip.
 */
export function traceLaneLinkAcrossBoundary(
  road: OdrRoad,
  laneId: number,
  leavingSide: RoadSide,
  odrDoc: OpenDriveDocument,
): { roadId: string; laneId: number; arrivalSide: RoadSide; arrivalS: number } | null {
  const next = directNextRoad(road, leavingSide, odrDoc);
  if (!next) return null;
  const lane = findLaneOnSide(road, laneId, leavingSide);
  if (!lane?.link) return null;
  const linkedId =
    leavingSide === 'predecessor' ? lane.link.predecessorId : lane.link.successorId;
  if (linkedId === undefined) return null;
  return {
    roadId: next.road.id,
    laneId: linkedId,
    arrivalSide: next.arrivalSide,
    arrivalS: next.arrivalS,
  };
}

/**
 * Enumerate all junction connections leaving `road` on `leavingSide`.
 * For junction transitions: per OpenDRIVE §10, the junction's `<connection
 * incomingRoad>` lists the road entering the junction, and `connectingRoad`
 * with `contactPoint` says which end of the connectingRoad meets the incoming.
 * The exit road is derived from the connectingRoad's own `<link>` — this
 * function performs that 3-hop dereference.
 */
export function junctionConnectionsFrom(
  road: OdrRoad,
  leavingSide: RoadSide,
  odrDoc: OpenDriveDocument,
): Array<{
  junction: OdrJunction;
  connection: OdrJunctionConnection;
  connectingRoad: OdrRoad;
  /** Exit link element of the connectingRoad (opposite side of incoming). */
  exitLink: OdrRoadLinkElement | undefined;
  /** laneLinks filtered from the incoming side's perspective (from=incoming lane). */
  laneLinks: { from: number; to: number }[];
}> {
  const link = roadLinkOn(road, leavingSide);
  if (!link || link.elementType !== 'junction') return [];
  const junction = odrDoc.junctions.find((j) => j.id === link.elementId);
  if (!junction) return [];

  const out: ReturnType<typeof junctionConnectionsFrom> = [];
  for (const conn of junction.connections) {
    if (conn.incomingRoad !== road.id) continue;
    const cr = odrDoc.roads.find((r) => r.id === conn.connectingRoad);
    if (!cr) continue;
    // contactPoint = which end of connectingRoad touches the incoming road.
    // Exit side of connectingRoad is the opposite end.
    const incomingOnCrSide: RoadSide =
      conn.contactPoint === 'start' ? 'predecessor' : 'successor';
    const exitSide: RoadSide =
      incomingOnCrSide === 'predecessor' ? 'successor' : 'predecessor';
    const exitLink = roadLinkOn(cr, exitSide);
    out.push({
      junction,
      connection: conn,
      connectingRoad: cr,
      exitLink,
      laneLinks: conn.laneLinks,
    });
  }
  return out;
}

/**
 * From a connecting road, resolve the outgoing road and arrival side given
 * which end of the connecting road connects to the incoming road.
 */
export function exitOfConnectingRoad(
  connectingRoad: OdrRoad,
  incomingContactPoint: 'start' | 'end',
  odrDoc: OpenDriveDocument,
): { road: OdrRoad; arrivalSide: RoadSide; arrivalS: number } | null {
  const exitSide: RoadSide = incomingContactPoint === 'start' ? 'successor' : 'predecessor';
  const exitLink = roadLinkOn(connectingRoad, exitSide);
  if (!exitLink || exitLink.elementType !== 'road' || !exitLink.contactPoint) return null;
  const exitRoad = odrDoc.roads.find((r) => r.id === exitLink.elementId);
  if (!exitRoad) return null;
  const arrivalSide: RoadSide =
    exitLink.contactPoint === 'start' ? 'predecessor' : 'successor';
  return {
    road: exitRoad,
    arrivalSide,
    arrivalS: contactEndS(exitRoad, arrivalSide),
  };
}

/** Find a lane by ID within a single lane section. */
function laneInSection(section: OdrLaneSection, laneId: number): OdrLane | null {
  if (laneId === 0) return section.centerLane;
  if (laneId > 0) return section.leftLanes.find((l) => l.id === laneId) ?? null;
  return section.rightLanes.find((l) => l.id === laneId) ?? null;
}

/** A continuous-lane sub-span within a single lane section. */
export interface LaneSectionSpan {
  laneId: number;
  sStart: number;
  sEnd: number;
}

/**
 * Split `[sMin, sMax]` into per-lane-section sub-spans, remapping the lane ID
 * across each internal lane-section boundary via `<lane><link>` so the
 * physically continuous lane is tracked even when lane IDs shift mid-road
 * (e.g. a lane is added or dropped at an internal section boundary).
 *
 * This is link-based and spec-faithful: it trusts the xodr's
 * `predecessor`/`successor` lane links. A file whose links disagree with its
 * geometry will route accordingly (garbage-in/garbage-out) — the fix belongs in
 * the authoring side, not here.
 *
 * `anchor` says which end the input `laneId` is valid at:
 * - `'low'`  : `laneId` belongs to the section at `sMin`; remap downstream via
 *   each lane's `successorId`.
 * - `'high'` : `laneId` belongs to the section at `sMax`; remap upstream via
 *   each lane's `predecessorId`.
 *
 * Falls back to the same ID when the link is missing. Center lane (id 0) always
 * stays 0. Returns sub-spans in increasing-s order. A road with a single lane
 * section (or no boundary crossed) yields one span with the unchanged ID.
 */
export function laneSpansAcrossSections(
  road: OdrRoad,
  laneId: number,
  sMin: number,
  sMax: number,
  anchor: 'low' | 'high',
): LaneSectionSpan[] {
  const sections = road.lanes;
  if (sections.length === 0) {
    return [{ laneId, sStart: sMin, sEnd: sMax }];
  }

  // Section bounds in increasing s.
  const bounds = sections.map((section, i) => ({
    section,
    start: section.s,
    end: i + 1 < sections.length ? sections[i + 1].s : road.length,
  }));

  // Sections overlapping [sMin, sMax] (strict bounds avoid zero-width spans at
  // an exact boundary).
  const overlapping = bounds.filter((b) => b.end > sMin && b.start < sMax);
  if (overlapping.length === 0) {
    return [{ laneId, sStart: sMin, sEnd: sMax }];
  }

  const spans: LaneSectionSpan[] = overlapping.map((b) => ({
    laneId,
    sStart: Math.max(sMin, b.start),
    sEnd: Math.min(sMax, b.end),
  }));

  if (anchor === 'low') {
    let cur = laneId;
    for (let i = 0; i < overlapping.length; i++) {
      spans[i].laneId = cur;
      if (i + 1 < overlapping.length && cur !== 0) {
        const next = laneInSection(overlapping[i].section, cur)?.link?.successorId;
        if (next !== undefined) cur = next;
      }
    }
  } else {
    let cur = laneId;
    for (let i = overlapping.length - 1; i >= 0; i--) {
      spans[i].laneId = cur;
      if (i - 1 >= 0 && cur !== 0) {
        const prev = laneInSection(overlapping[i].section, cur)?.link?.predecessorId;
        if (prev !== undefined) cur = prev;
      }
    }
  }

  return spans;
}
