/**
 * OpenDRIVE 1.9 construct detection.
 *
 * Pure inspection of an {@link OpenDriveDocument}: reports which OpenDRIVE 1.9
 * features a document actually uses, so the save flow can auto-bump the declared
 * `<header>` `@revMinor` to 9 when the content requires it. No mutation.
 */
import type { OpenDriveDocument, OdrLane, OdrLaneAccess } from '@osce/shared';

/** Lane `@type` values introduced by OpenDRIVE 1.9. */
const ODR19_LANE_TYPES = new Set(['walking', 'slipLane', 'shared']);

/**
 * Inspect a document and return the human-readable names of the OpenDRIVE 1.9
 * constructs it uses. Empty array means the document is representable in the
 * pre-1.9 schema. Names are de-duplicated; iteration order is stable.
 */
export function detectOdr19Constructs(doc: OpenDriveDocument): string[] {
  const found = new Set<string>();

  for (const road of doc.roads) {
    if (road.temporaryLanes) found.add('temporary lane layer');
    if (road.crossSectionSurface) found.add('crossSectionSurface');

    // road-type speed with a non-numeric literal ("no limit"/"undefined")
    for (const typeEntry of road.type ?? []) {
      if (typeEntry.speed && typeof typeEntry.speed.max === 'string') {
        found.add('road-type speed literal');
      }
    }

    // lanes (permanent + temporary layers)
    for (const section of road.lanes) {
      inspectLanes([...section.leftLanes, section.centerLane, ...section.rightLanes], found);
    }
    if (road.temporaryLanes) {
      for (const section of road.temporaryLanes.sections) {
        inspectLanes([...section.leftLanes, section.centerLane, ...section.rightLanes], found);
      }
    }

    // validity @layer on signals/objects (and their references)
    for (const s of road.signals) inspectValidityLayer(s.validity, found);
    for (const o of road.objects) inspectValidityLayer(o.validity, found);
    for (const s of road.signalReferences ?? []) inspectValidityLayer(s.validity, found);
    for (const o of road.objectReferences ?? []) inspectValidityLayer(o.validity, found);
  }

  for (const junction of doc.junctions) {
    if (junction.type === 'crossing') found.add('crossing junction');
    if (junction.type === 'direct') found.add('direct junction');
    if (
      junction.type === 'virtual' ||
      junction.mainRoad !== undefined ||
      junction.sStart !== undefined ||
      junction.sEnd !== undefined ||
      junction.orientation !== undefined
    ) {
      found.add('virtual junction');
    }
    if (junction.crossPaths && junction.crossPaths.length > 0) found.add('junction crossPath');
    if (junction.roadSections && junction.roadSections.length > 0) {
      found.add('junction roadSection');
    }

    for (const conn of junction.connections) {
      if (conn.type === 'virtual') found.add('virtual connection');
      if (conn.linkedRoad !== undefined) found.add('direct junction');
      for (const ll of conn.laneLinks) {
        if (ll.overlapZone !== undefined) found.add('connection laneLink overlapZone');
        if (ll.fromLayer !== undefined || ll.toLayer !== undefined) {
          found.add('connection laneLink layer');
        }
      }
    }
  }

  return [...found];
}

function inspectLanes(lanes: OdrLane[], found: Set<string>): void {
  for (const lane of lanes) {
    if (lane.direction !== undefined) found.add('lane direction');
    if (lane.advisory !== undefined) found.add('lane advisory');
    if (lane.dynamicLaneType !== undefined) found.add('lane dynamicLaneType');
    if (lane.dynamicLaneDirection !== undefined) found.add('lane dynamicLaneDirection');
    if (lane.roadWorks !== undefined) found.add('lane roadWorks');
    if (ODR19_LANE_TYPES.has(lane.type)) found.add(`lane type "${lane.type}"`);
    for (const access of lane.access ?? []) inspectAccess(access, found);
    if (lane.link) {
      if (lane.link.predecessors.length > 1 || lane.link.successors.length > 1) {
        found.add('lane link multiplicity');
      }
      if (
        lane.link.predecessors.some((r) => r.layer !== undefined) ||
        lane.link.successors.some((r) => r.layer !== undefined)
      ) {
        found.add('lane link layer');
      }
    }
  }
}

function inspectAccess(access: OdrLaneAccess, found: Set<string>): void {
  if (access.restrictions && access.restrictions.length > 0) {
    found.add('lane access restrictions');
  }
}

function inspectValidityLayer(
  validity: { layer?: string }[] | undefined,
  found: Set<string>,
): void {
  if (validity?.some((v) => v.layer !== undefined)) found.add('validity layer');
}

/**
 * True when {@link detectOdr19Constructs} finds 1.9 content in a document whose
 * header declares OpenDRIVE 1.x with a minor below 9 — i.e. serializing with
 * `resolveVersion` would bump `@revMinor` to 9.
 */
export function willResolveToOdr19(doc: OpenDriveDocument): boolean {
  return (
    doc.header.revMajor === 1 &&
    doc.header.revMinor < 9 &&
    detectOdr19Constructs(doc).length > 0
  );
}
