/**
 * Parse OpenDRIVE road object elements.
 */
import type { OdrRoadObject } from '@osce/shared';
import { ensureArray, toNum, toStr, toOptNum, toOptStr } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseObjects(raw: Raw | undefined): OdrRoadObject[] {
  if (!raw) return [];
  return ensureArray(raw.object).map((o: Raw) => ({
    id: toStr(o.id),
    name: toOptStr(o.name),
    type: toOptStr(o.type),
    s: toNum(o.s),
    t: toNum(o.t),
    zOffset: toOptNum(o.zOffset),
    hdg: toOptNum(o.hdg),
    pitch: toOptNum(o.pitch),
    roll: toOptNum(o.roll),
    length: toOptNum(o.length),
    width: toOptNum(o.width),
    height: toOptNum(o.height),
    radius: toOptNum(o.radius),
    orientation: toOptStr(o.orientation),
  }));
}
