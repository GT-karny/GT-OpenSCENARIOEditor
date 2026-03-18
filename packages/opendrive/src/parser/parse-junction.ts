/**
 * Parse OpenDRIVE junction elements.
 */
import type { OdrJunction, OdrJunctionConnection } from '@osce/shared';
import { ensureArray, toNum, toStr, toOptStr } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseJunction(raw: Raw): OdrJunction {
  return {
    id: toStr(raw.id),
    name: toStr(raw.name),
    type: toOptStr(raw.type),
    connections: ensureArray(raw.connection).map(parseJunctionConnection),
  };
}

function parseJunctionConnection(raw: Raw): OdrJunctionConnection {
  return {
    id: toStr(raw.id),
    incomingRoad: toStr(raw.incomingRoad),
    connectingRoad: toStr(raw.connectingRoad),
    contactPoint: toStr(raw.contactPoint, 'start') as 'start' | 'end',
    laneLinks: ensureArray(raw.laneLink).map((ll: Raw) => ({
      from: toNum(ll.from),
      to: toNum(ll.to),
    })),
  };
}
