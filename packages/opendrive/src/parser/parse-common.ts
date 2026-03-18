/**
 * Parse OpenDRIVE common elements shared across multiple categories.
 */
import type { OdrLaneValidity } from '@osce/shared';
import { ensureArray, toNum } from './xml-helpers.js';

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
