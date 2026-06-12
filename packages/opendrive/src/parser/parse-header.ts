/**
 * Parse OpenDRIVE <header> element.
 */
import type { OdrHeader, OdrHeaderOffset } from '@osce/shared';
import { attrNum, attrStr, attrOptNum } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseHeader(raw: Raw | undefined): OdrHeader {
  if (!raw) {
    return { revMajor: 1, revMinor: 0, name: '', date: '' };
  }
  return {
    revMajor: attrNum(raw, 'revMajor', 1),
    revMinor: attrNum(raw, 'revMinor', 0),
    name: attrStr(raw, 'name'),
    date: attrStr(raw, 'date'),
    north: attrOptNum(raw, 'north'),
    south: attrOptNum(raw, 'south'),
    east: attrOptNum(raw, 'east'),
    west: attrOptNum(raw, 'west'),
    geoReference: extractGeoReference(raw.geoReference),
    offset: parseHeaderOffset(raw.offset),
  };
}

function parseHeaderOffset(raw: Raw | undefined): OdrHeaderOffset | undefined {
  if (!raw) return undefined;
  return {
    x: attrNum(raw, 'x'),
    y: attrNum(raw, 'y'),
    z: attrNum(raw, 'z'),
    hdg: attrNum(raw, 'hdg'),
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
