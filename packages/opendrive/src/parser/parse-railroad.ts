/**
 * Parse OpenDRIVE railroad elements.
 */
import type { OdrRailroad, OdrStation } from '@osce/shared';
import { ensureArray, attrNum, attrStr, attrOptStr } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseRailroad(raw: Raw | undefined): OdrRailroad | undefined {
  if (!raw) return undefined;

  const railroad: OdrRailroad = {};

  const switchArr = ensureArray(raw.switch);
  if (switchArr.length > 0) {
    railroad.switches = switchArr.map((sw: Raw) => ({
      name: attrStr(sw, 'name'),
      id: attrStr(sw, 'id'),
      position: attrStr(sw, 'position', 'dynamic') as 'dynamic' | 'straight' | 'turn',
      mainTrack: {
        id: attrStr(sw.mainTrack, 'id'),
        s: attrNum(sw.mainTrack, 's'),
        dir: attrStr(sw.mainTrack, 'dir', '+') as '+' | '-',
      },
      sideTrack: {
        id: attrStr(sw.sideTrack, 'id'),
        s: attrNum(sw.sideTrack, 's'),
        dir: attrStr(sw.sideTrack, 'dir', '+') as '+' | '-',
      },
      partner: sw.partner
        ? {
            name: attrOptStr(sw.partner, 'name'),
            id: attrStr(sw.partner, 'id'),
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
    name: attrStr(st, 'name'),
    id: attrStr(st, 'id'),
    type: attrOptStr(st, 'type') as 'small' | 'medium' | 'large' | undefined,
    platforms: ensureArray(st.platform).map((pl: Raw) => ({
      name: attrOptStr(pl, 'name'),
      id: attrStr(pl, 'id'),
      segments: ensureArray(pl.segment).map((seg: Raw) => ({
        roadId: attrStr(seg, 'roadId'),
        sStart: attrNum(seg, 'sStart'),
        sEnd: attrNum(seg, 'sEnd'),
        side: attrStr(seg, 'side', 'left') as 'left' | 'right',
      })),
    })),
  }));
}
