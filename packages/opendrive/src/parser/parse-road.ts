/**
 * Parse OpenDRIVE <road> elements.
 */
import type { OdrRoad, OdrRoadLink, OdrRoadLinkElement, OdrRoadTypeEntry, OdrLanesLayer } from '@osce/shared';
import { ensureArray, attrStr, attrOptStr, attrOptNum } from './xml-helpers.js';
import { trackNode } from './node-tracker.js';
import { parsePlanView, parseElevations, parseSuperelevations, parseLaneOffsets, parseShapes } from './parse-geometry.js';
import { parseLaneSections, parseSpeedMax } from './parse-lane.js';
import { parseObjects, parseObjectReferences, parseTunnels, parseBridges } from './parse-object.js';
import { parseSignals, parseSignalReferences } from './parse-signal.js';
import { parseRailroad } from './parse-railroad.js';
import { parseUserData, parseDataQuality, parseIncludes } from './parse-common.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseRoad(raw: Raw): OdrRoad {
  const t = trackNode(raw);
  const ruleStr = t.optStr('rule');

  // OpenDRIVE 1.9 allows up to two <lanes> elements per road (permanent +
  // temporary layer). fast-xml-parser yields a single object for one <lanes>
  // and an array for two, so we must normalize before reading. The permanent
  // layer (@layer != 'temporary', or the first/unlabeled element) is parsed
  // into the typed model; a temporary layer is preserved raw (see below).
  const lanesLayers = t.takeChildren('lanes') as Raw[];
  const permanentLanes = lanesLayers.find((l) => attrOptStr(l, 'layer') !== 'temporary')
    ?? lanesLayers[0];
  const temporaryLanes = lanesLayers.find((l) => attrOptStr(l, 'layer') === 'temporary');

  // Read once and share the <objects>/<signals>/<lateralProfile> containers so
  // their sub-collections and passthrough extra come from a single tracked read.
  const objectsRaw = t.takeChild('objects') as Raw | undefined;
  const signalsRaw = t.takeChild('signals') as Raw | undefined;
  const lateralProfileRaw = t.takeChild('lateralProfile') as Raw | undefined;

  const road: OdrRoad = {
    id: t.str('id'),
    name: t.str('name'),
    length: t.num('length'),
    junction: t.str('junction'),
    rule: ruleStr === 'RHT' || ruleStr === 'LHT' ? ruleStr : undefined,
    link: parseRoadLink(t.takeChild('link') as Raw | undefined),
    type: parseRoadTypes(t.takeChildren('type') as Raw[]),
    planView: parsePlanView(t.takeChild('planView') as Raw | undefined),
    elevationProfile: parseElevations(t.takeChild('elevationProfile') as Raw | undefined),
    lateralProfile: parseSuperelevations(lateralProfileRaw),
    laneOffset: parseLaneOffsets(permanentLanes),
    lanes: parseLaneSections(permanentLanes),
    objects: parseObjects(objectsRaw),
    signals: parseSignals(signalsRaw),
  };

  // Temporary lane layer: parsed through the same laneOffset/laneSection model
  // as the permanent layer (OpenDRIVE 1.9 dual <lanes>).
  if (temporaryLanes !== undefined) {
    road.temporaryLanes = parseLanesLayer(temporaryLanes);
  }

  // objectReference, tunnel, bridge from <objects>
  const objReferences = parseObjectReferences(objectsRaw);
  if (objReferences.length > 0) road.objectReferences = objReferences;

  const tunnels = parseTunnels(objectsRaw);
  if (tunnels.length > 0) road.tunnels = tunnels;

  const bridges = parseBridges(objectsRaw);
  if (bridges.length > 0) road.bridges = bridges;

  // signalReference from <signals>
  const sigRefs = parseSignalReferences(signalsRaw);
  if (sigRefs.length > 0) road.signalReferences = sigRefs;

  // lateralProfile shapes + passthrough (crossSectionSurface etc.)
  const shapes = parseShapes(lateralProfileRaw);
  if (shapes.length > 0) road.shapes = shapes;
  if (lateralProfileRaw) {
    const lt = trackNode(lateralProfileRaw);
    lt.takeChildren('superelevation');
    lt.takeChildren('shape');
    const lpExtra = lt.rest();
    if (lpExtra) road.lateralProfileExtra = lpExtra;
  }

  // surface CRG. An empty or non-CRG <surface> is left unconsumed so `road.extra`
  // round-trips it (matching esmini's tolerant handling of bare surface elements).
  const surfaceRaw = raw.surface as Raw | undefined;
  if (surfaceRaw) {
    const crgArr = ensureArray(surfaceRaw.CRG ?? surfaceRaw.crg);
    if (crgArr.length > 0) {
      t.takeChild('surface');
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

  // railroad. An empty/contentless <railroad> is left unconsumed so `road.extra`
  // round-trips it rather than silently dropping it.
  const railroad = parseRailroad(raw.railroad as Raw | undefined);
  if (railroad) {
    t.takeChild('railroad');
    road.railroad = railroad;
  }

  // userData / dataQuality / include (lossless round-trip)
  const userData = parseUserData(t.takeChildren('userData'));
  if (userData.length > 0) road.userData = userData;

  const dataQuality = parseDataQuality(t.takeChild('dataQuality') as Raw | undefined);
  if (dataQuality) road.dataQuality = dataQuality;

  const includes = parseIncludes(t.takeChildren('include'));
  if (includes.length > 0) road.includes = includes;

  // Preserve any remaining unmodeled direct attrs/children of <road>.
  const extra = t.rest();
  if (extra) road.extra = extra;

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
    const t = trackNode(r);
    const entry: OdrRoadTypeEntry = {
      s: t.num('s'),
      type: t.str('type'),
    };
    // speed can be a child element or nested
    const speedArr = t.takeChildren('speed') as Raw[];
    if (speedArr.length > 0) {
      entry.speed = {
        max: parseSpeedMax(speedArr[0], `road type "${entry.type}" speed`),
        unit: attrStr(speedArr[0], 'unit', 'm/s'),
      };
    }
    // Preserve unmodeled <type> attrs (e.g. @country, v1.5+).
    const extra = t.rest();
    if (extra) entry.extra = extra;
    return entry;
  });
}

/**
 * Parse one `<lanes>` layer (permanent or temporary) into the typed model,
 * capturing any unmodeled layer-level content as {@link OdrLanesLayer.extra}.
 * `@layer` is consumed here (the serializer re-adds it) and laneOffset/laneSection
 * are parsed through the shared helpers.
 */
function parseLanesLayer(raw: Raw): OdrLanesLayer {
  const t = trackNode(raw);
  t.takeAttr('layer');
  t.takeChildren('laneOffset');
  t.takeChildren('laneSection');
  const layer: OdrLanesLayer = {
    laneOffset: parseLaneOffsets(raw),
    sections: parseLaneSections(raw),
  };
  const extra = t.rest();
  if (extra) layer.extra = extra;
  return layer;
}
