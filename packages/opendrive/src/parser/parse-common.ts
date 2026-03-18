/**
 * Parse OpenDRIVE common elements shared across multiple categories.
 */
import type { OdrLaneValidity, OdrDataQuality, OdrUserData, OdrInclude } from '@osce/shared';
import { ensureArray, toNum, toStr, toOptStr } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/** Parse <validity> child elements into OdrLaneValidity[] */
export function parseLaneValidity(raw: Raw | undefined): OdrLaneValidity[] | undefined {
  if (!raw) return undefined;
  const arr = ensureArray(raw);
  if (arr.length === 0) return undefined;
  return arr.map((v: Raw) => ({
    fromLane: toNum(v.fromLane),
    toLane: toNum(v.toLane),
  }));
}

/** Parse <dataQuality> element */
export function parseDataQuality(raw: Raw | undefined): OdrDataQuality | undefined {
  if (!raw) return undefined;
  const dq: OdrDataQuality = {};
  if (raw.error) {
    dq.error = {
      xyAbsolute: toNum(raw.error.xyAbsolute),
      zAbsolute: toNum(raw.error.zAbsolute),
      xyRelative: toNum(raw.error.xyRelative),
      zRelative: toNum(raw.error.zRelative),
    };
  }
  if (raw.rawData) {
    dq.rawData = {
      date: toOptStr(raw.rawData.date),
      source: toOptStr(raw.rawData.source),
      sourceComment: toOptStr(raw.rawData.sourceComment),
      postProcessing: toOptStr(raw.rawData.postProcessing),
      postProcessingComment: toOptStr(raw.rawData.postProcessingComment),
    };
  }
  return dq.error || dq.rawData ? dq : undefined;
}

/** Parse <userData> elements */
export function parseUserData(raw: Raw | undefined): OdrUserData[] {
  if (!raw) return [];
  return ensureArray(raw).map((u: Raw) => ({
    code: toStr(u.code),
    value: toOptStr(u.value),
  }));
}

/** Parse <include> elements */
export function parseIncludes(raw: Raw | undefined): OdrInclude[] {
  if (!raw) return [];
  return ensureArray(raw).map((i: Raw) => ({
    file: toStr(i.file),
  }));
}
