/**
 * Parse OpenDRIVE <road> elements.
 */
import type { OdrRoad, OdrRoadLink, OdrRoadLinkElement, OdrRoadTypeEntry } from '@osce/shared';
import { ensureArray, toNum, toStr, toOptStr } from './xml-helpers.js';
import { parsePlanView, parseElevations, parseSuperelevations, parseLaneOffsets } from './parse-geometry.js';
import { parseLaneSections } from './parse-lane.js';
import { parseObjects } from './parse-object.js';
import { parseSignals } from './parse-signal.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseRoad(raw: Raw): OdrRoad {
  const ruleStr = toOptStr(raw.rule);
  return {
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
