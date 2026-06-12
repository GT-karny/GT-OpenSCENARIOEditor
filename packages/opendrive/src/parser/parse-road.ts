/**
 * Parse OpenDRIVE <road> elements.
 */
import type { OdrRoad, OdrRoadLink, OdrRoadLinkElement, OdrRoadTypeEntry } from '@osce/shared';
import { ensureArray, attrNum, attrStr, attrOptStr, attrOptNum } from './xml-helpers.js';
import { parsePlanView, parseElevations, parseSuperelevations, parseLaneOffsets, parseShapes } from './parse-geometry.js';
import { parseLaneSections } from './parse-lane.js';
import { parseObjects, parseObjectReferences, parseTunnels, parseBridges } from './parse-object.js';
import { parseSignals, parseSignalReferences } from './parse-signal.js';
import { parseRailroad } from './parse-railroad.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseRoad(raw: Raw): OdrRoad {
  const ruleStr = attrOptStr(raw, 'rule');
  const road: OdrRoad = {
    id: attrStr(raw, 'id'),
    name: attrStr(raw, 'name'),
    length: attrNum(raw, 'length'),
    junction: attrStr(raw, 'junction'),
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
          file: attrStr(crg, 'file'),
          sStart: attrOptNum(crg, 'sStart'),
          sEnd: attrOptNum(crg, 'sEnd'),
          orientation: attrOptStr(crg, 'orientation'),
          mode: attrOptStr(crg, 'mode'),
          purpose: attrOptStr(crg, 'purpose'),
          sOffset: attrOptNum(crg, 'sOffset'),
          tOffset: attrOptNum(crg, 'tOffset'),
          zOffset: attrOptNum(crg, 'zOffset'),
          zScale: attrOptNum(crg, 'zScale'),
          hOffset: attrOptNum(crg, 'hOffset'),
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
    elementType: attrStr(raw, 'elementType') as 'road' | 'junction',
    elementId: attrStr(raw, 'elementId'),
    contactPoint: attrOptStr(raw, 'contactPoint') as 'start' | 'end' | undefined,
    elementS: attrOptNum(raw, 'elementS'),
    elementDir: attrOptStr(raw, 'elementDir') as '+' | '-' | undefined,
  };
}

function parseRoadTypes(raw: Raw[] | undefined): OdrRoadTypeEntry[] | undefined {
  const arr = ensureArray(raw);
  if (arr.length === 0) return undefined;
  return arr.map((r) => {
    const entry: OdrRoadTypeEntry = {
      s: attrNum(r, 's'),
      type: attrStr(r, 'type'),
    };
    // speed can be a child element or nested
    const spd = r.speed;
    if (spd) {
      const speedArr = ensureArray(spd);
      if (speedArr.length > 0) {
        entry.speed = {
          max: attrNum(speedArr[0], 'max'),
          unit: attrStr(speedArr[0], 'unit', 'm/s'),
        };
      }
    }
    return entry;
  });
}
