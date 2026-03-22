/**
 * Parse OpenDRIVE railroad elements.
 */
import type { OdrRailroad, OdrStation } from '@osce/shared';
import { ensureArray, toNum, toStr, toOptStr } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseRailroad(raw: Raw | undefined): OdrRailroad | undefined {
  if (!raw) return undefined;

  const railroad: OdrRailroad = {};

  const switchArr = ensureArray(raw.switch);
  if (switchArr.length > 0) {
    railroad.switches = switchArr.map((sw: Raw) => ({
      name: toStr(sw.name),
      id: toStr(sw.id),
      position: toStr(sw.position, 'dynamic') as 'dynamic' | 'straight' | 'turn',
      mainTrack: {
        id: toStr(sw.mainTrack?.id),
        s: toNum(sw.mainTrack?.s),
        dir: toStr(sw.mainTrack?.dir, '+') as '+' | '-',
      },
      sideTrack: {
        id: toStr(sw.sideTrack?.id),
        s: toNum(sw.sideTrack?.s),
        dir: toStr(sw.sideTrack?.dir, '+') as '+' | '-',
      },
      partner: sw.partner
        ? {
            name: toOptStr(sw.partner.name),
            id: toStr(sw.partner.id),
          }
        : undefined,
    }));
  }

  // Only return railroad if it has content
  if (!railroad.switches || railroad.switches.length === 0) return undefined;

  return railroad;
}

export function parseStations(raw: Raw[] | undefined): OdrStation[] {
  if (!raw) return [];
  return ensureArray(raw).map((st: Raw) => ({
    name: toStr(st.name),
    id: toStr(st.id),
    type: toOptStr(st.type) as 'small' | 'medium' | 'large' | undefined,
    platforms: ensureArray(st.platform).map((pl: Raw) => ({
      name: toOptStr(pl.name),
      id: toStr(pl.id),
      segments: ensureArray(pl.segment).map((seg: Raw) => ({
        roadId: toStr(seg.roadId),
        sStart: toNum(seg.sStart),
        sEnd: toNum(seg.sEnd),
        side: toStr(seg.side, 'left') as 'left' | 'right',
      })),
    })),
  }));
}
