/**
 * Parse OpenDRIVE <header> element.
 */
import type { OdrHeader } from '@osce/shared';
import { toNum, toStr, toOptNum } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseHeader(raw: Raw | undefined): OdrHeader {
  if (!raw) {
    return { revMajor: 1, revMinor: 0, name: '', date: '' };
  }
  return {
    revMajor: toNum(raw.revMajor, 1),
    revMinor: toNum(raw.revMinor, 0),
    name: toStr(raw.name),
    date: toStr(raw.date),
    north: toOptNum(raw.north),
    south: toOptNum(raw.south),
    east: toOptNum(raw.east),
    west: toOptNum(raw.west),
    geoReference: extractGeoReference(raw.geoReference),
  };
}

function extractGeoReference(val: unknown): string | undefined {
  if (val == null) return undefined;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Raw;
    // CDATA content
    if (obj.__cdata) return String(obj.__cdata);
    if (obj['#text']) return String(obj['#text']);
  }
  return String(val);
}
