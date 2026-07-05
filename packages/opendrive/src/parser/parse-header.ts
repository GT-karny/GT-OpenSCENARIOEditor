/**
 * Parse OpenDRIVE <header> element.
 */
import type { OdrHeader, OdrHeaderOffset } from '@osce/shared';
import { attrNum } from './xml-helpers.js';
import { trackNode } from './node-tracker.js';
import { parseUserData, parseDataQuality, parseIncludes } from './parse-common.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseHeader(raw: Raw | undefined): OdrHeader {
  if (!raw) {
    return { revMajor: 1, revMinor: 0, name: '', date: '' };
  }

  const t = trackNode(raw);
  const header: OdrHeader = {
    revMajor: t.num('revMajor', 1),
    revMinor: t.num('revMinor', 0),
    name: t.str('name'),
    date: t.str('date'),
    north: t.optNum('north'),
    south: t.optNum('south'),
    east: t.optNum('east'),
    west: t.optNum('west'),
    version: t.optStr('version'),
    vendor: t.optStr('vendor'),
    geoReference: extractGeoReference(t.takeChild('geoReference')),
    offset: parseHeaderOffset(t.takeChild('offset') as Raw | undefined),
  };

  // userData / dataQuality / include (lossless round-trip)
  const userData = parseUserData(t.takeChildren('userData'));
  if (userData.length > 0) header.userData = userData;

  const dataQuality = parseDataQuality(t.takeChild('dataQuality') as Raw | undefined);
  if (dataQuality) header.dataQuality = dataQuality;

  const includes = parseIncludes(t.takeChildren('include'));
  if (includes.length > 0) header.includes = includes;

  // Preserve unmodeled header children (1.9 <license>, <defaultRegulations>).
  const extra = t.rest();
  if (extra) header.extra = extra;

  return header;
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
