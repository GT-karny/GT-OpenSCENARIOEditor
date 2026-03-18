/**
 * Parse OpenDRIVE <road> elements.
 */
import type { OdrRoad, OdrRoadLink, OdrRoadLinkElement, OdrRoadTypeEntry } from '@osce/shared';
import { ensureArray, toNum, toStr, toOptStr, toOptNum } from './xml-helpers.js';
import { parsePlanView, parseElevations, parseSuperelevations, parseLaneOffsets, parseShapes } from './parse-geometry.js';
import { parseLaneSections } from './parse-lane.js';
import { parseObjects, parseObjectReferences, parseTunnels, parseBridges } from './parse-object.js';
import { parseSignals, parseSignalReferences } from './parse-signal.js';
import { parseRailroad } from './parse-railroad.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseRoad(raw: Raw): OdrRoad {
  const ruleStr = toOptStr(raw.rule);
  const road: OdrRoad = {
    id: toStr(raw.id),
    name: toStr(raw.name),
    length: toNum(raw.length),
    junction: toStr(raw.junction),
    rule: ruleStr === 'RHT' || ruleStr === 'LHT' ? ruleStr : undefined,
    link: parseRoadLink(raw.link),
    type: parseRoadTypes(raw.type),
    planView: parsePlanView(raw.planView),
    elevationProfile: parseElevations(raw.elevationProfile),
    lateralProfile: parseSuperelevations(raw.lateralProfile),
    laneOffset: parseLaneOffsets(raw.lanes),
    lanes: parseLaneSections(raw.lanes),
    objects: parseObjects(raw.objects),
    signals: parseSignals(raw.signals),
  };

  // objectReference, tunnel, bridge from <objects>
  const objReferences = parseObjectReferences(raw.objects);
  if (objReferences.length > 0) road.objectReferences = objReferences;

  const tunnels = parseTunnels(raw.objects);
  if (tunnels.length > 0) road.tunnels = tunnels;

  const bridges = parseBridges(raw.objects);
  if (bridges.length > 0) road.bridges = bridges;

  // signalReference from <signals>
  const sigRefs = parseSignalReferences(raw.signals);
  if (sigRefs.length > 0) road.signalReferences = sigRefs;

  // lateralProfile shapes
  const shapes = parseShapes(raw.lateralProfile);
  if (shapes.length > 0) road.shapes = shapes;

  // surface CRG
  if (raw.surface) {
    const crgArr = ensureArray(raw.surface.CRG ?? raw.surface.crg);
    if (crgArr.length > 0) {
      road.surface = {
        crg: crgArr.map((crg: Raw) => ({
          file: toStr(crg.file),
          sStart: toOptNum(crg.sStart),
          sEnd: toOptNum(crg.sEnd),
          orientation: toOptStr(crg.orientation),
          mode: toOptStr(crg.mode),
          purpose: toOptStr(crg.purpose),
          sOffset: toOptNum(crg.sOffset),
          tOffset: toOptNum(crg.tOffset),
          zOffset: toOptNum(crg.zOffset),
          zScale: toOptNum(crg.zScale),
          hOffset: toOptNum(crg.hOffset),
        })),
      };
    }
  }

  // railroad
  const railroad = parseRailroad(raw.railroad);
  if (railroad) road.railroad = railroad;

  return road;
}

function parseRoadLink(raw: Raw | undefined): OdrRoadLink | undefined {
  if (!raw) return undefined;
  const pred = raw.predecessor;
  const succ = raw.successor;
  if (!pred && !succ) return undefined;
  return {
    predecessor: parseLinkElement(pred),
    successor: parseLinkElement(succ),
  };
}

function parseLinkElement(raw: Raw | undefined): OdrRoadLinkElement | undefined {
  if (!raw) return undefined;
  return {
    elementType: toStr(raw.elementType) as 'road' | 'junction',
    elementId: toStr(raw.elementId),
    contactPoint: toOptStr(raw.contactPoint) as 'start' | 'end' | undefined,
    elementS: toOptNum(raw.elementS),
    elementDir: toOptStr(raw.elementDir) as '+' | '-' | undefined,
  };
}

function parseRoadTypes(raw: Raw[] | undefined): OdrRoadTypeEntry[] | undefined {
  const arr = ensureArray(raw);
  if (arr.length === 0) return undefined;
  return arr.map((r) => {
    const entry: OdrRoadTypeEntry = {
      s: toNum(r.s),
      type: toStr(r.type),
    };
    // speed can be a child element or nested
    const spd = r.speed;
    if (spd) {
      const speedArr = ensureArray(spd);
      if (speedArr.length > 0) {
        entry.speed = {
          max: toNum(speedArr[0].max),
          unit: toStr(speedArr[0].unit, 'm/s'),
        };
      }
    }
    return entry;
  });
}
