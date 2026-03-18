/**
 * Parse OpenDRIVE signal elements.
 */
import type { OdrSignal } from '@osce/shared';
import { ensureArray, toNum, toStr, toOptNum, toOptStr } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseSignals(raw: Raw | undefined): OdrSignal[] {
  if (!raw) return [];
  return ensureArray(raw.signal).map((s: Raw) => ({
    id: toStr(s.id),
    name: toOptStr(s.name),
    s: toNum(s.s),
    t: toNum(s.t),
    zOffset: toOptNum(s.zOffset),
    orientation: toStr(s.orientation, '+'),
    dynamic: toOptStr(s.dynamic),
    country: toOptStr(s.country),
    type: toOptStr(s.type),
    subtype: toOptStr(s.subtype),
    value: toOptNum(s.value),
    text: toOptStr(s.text),
    hOffset: toOptNum(s.hOffset),
    pitch: toOptNum(s.pitch),
    roll: toOptNum(s.roll),
    width: toOptNum(s.width),
    height: toOptNum(s.height),
  }));
}
