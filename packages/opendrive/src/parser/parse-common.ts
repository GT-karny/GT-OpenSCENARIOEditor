/**
 * Parse OpenDRIVE common elements shared across multiple categories.
 */
import type { OdrLaneValidity, OdrDataQuality, OdrUserData, OdrInclude } from '@osce/shared';
import { ensureArray, attrNum, attrStr, attrOptStr } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/** Parse <validity> child elements into OdrLaneValidity[] */
export function parseLaneValidity(raw: Raw | undefined): OdrLaneValidity[] | undefined {
  if (!raw) return undefined;
  const arr = ensureArray(raw);
  if (arr.length === 0) return undefined;
  return arr.map((v: Raw) => ({
    fromLane: attrNum(v, 'fromLane'),
    toLane: attrNum(v, 'toLane'),
  }));
}

/** Parse <dataQuality> element */
export function parseDataQuality(raw: Raw | undefined): OdrDataQuality | undefined {
  if (!raw) return undefined;
  const dq: OdrDataQuality = {};
  if (raw.error) {
    dq.error = {
      xyAbsolute: attrNum(raw.error, 'xyAbsolute'),
      zAbsolute: attrNum(raw.error, 'zAbsolute'),
      xyRelative: attrNum(raw.error, 'xyRelative'),
      zRelative: attrNum(raw.error, 'zRelative'),
    };
  }
  if (raw.rawData) {
    dq.rawData = {
      date: attrOptStr(raw.rawData, 'date'),
      source: attrOptStr(raw.rawData, 'source'),
      sourceComment: attrOptStr(raw.rawData, 'sourceComment'),
      postProcessing: attrOptStr(raw.rawData, 'postProcessing'),
      postProcessingComment: attrOptStr(raw.rawData, 'postProcessingComment'),
    };
  }
  return dq.error || dq.rawData ? dq : undefined;
}

/** Parse <userData> elements */
export function parseUserData(raw: Raw | undefined): OdrUserData[] {
  if (!raw) return [];
  return ensureArray(raw).map((u: Raw) => ({
    code: attrStr(u, 'code'),
    value: attrOptStr(u, 'value'),
  }));
}

/** Parse <include> elements */
export function parseIncludes(raw: Raw | undefined): OdrInclude[] {
  if (!raw) return [];
  return ensureArray(raw).map((i: Raw) => ({
    file: attrStr(i, 'file'),
  }));
}
