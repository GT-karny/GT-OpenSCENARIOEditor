/**
 * Parse OpenDRIVE junction elements.
 */
import type {
  OdrJunction,
  OdrJunctionConnection,
  OdrJunctionGroup,
} from '@osce/shared';
import {
  ensureArray,
  toStr,
  attr,
  attrNum,
  attrStr,
  attrOptStr,
  attrOptNum,
} from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseJunction(raw: Raw): OdrJunction {
  const junction: OdrJunction = {
    id: attrStr(raw, 'id'),
    name: attrStr(raw, 'name'),
    type: attrOptStr(raw, 'type'),
    connections: ensureArray(raw.connection).map(parseJunctionConnection),
  };

  // Virtual junction attributes (t_junction_virtual): mandatory for type="virtual"
  const mainRoad = attrOptStr(raw, 'mainRoad');
  if (mainRoad !== undefined) junction.mainRoad = mainRoad;
  const sStart = attrOptNum(raw, 'sStart');
  if (sStart !== undefined) junction.sStart = sStart;
  const sEnd = attrOptNum(raw, 'sEnd');
  if (sEnd !== undefined) junction.sEnd = sEnd;
  const orientation = attrOptStr(raw, 'orientation');
  if (orientation !== undefined) junction.orientation = orientation;

  // priority
  const priorityArr = ensureArray(raw.priority);
  if (priorityArr.length > 0) {
    junction.priority = priorityArr.map((p: Raw) => ({
      high: attrOptStr(p, 'high'),
      low: attrOptStr(p, 'low'),
    }));
  }

  // controller
  const controllerArr = ensureArray(raw.controller);
  if (controllerArr.length > 0) {
    junction.controller = controllerArr.map((c: Raw) => ({
      id: attrStr(c, 'id'),
      type: attrOptStr(c, 'type'),
      sequence: attrOptNum(c, 'sequence'),
    }));
  }

  // surface
  if (raw.surface) {
    const crgArr = ensureArray(raw.surface.CRG ?? raw.surface.crg);
    if (crgArr.length > 0) {
      junction.surface = {
        crg: crgArr.map((crg: Raw) => ({
          file: attrStr(crg, 'file'),
          sStart: attrOptNum(crg, 'sStart'),
          sEnd: attrOptNum(crg, 'sEnd'),
          orientation: attrOptStr(crg, 'orientation'),
          mode: attrOptStr(crg, 'mode'),
          purpose: attrOptStr(crg, 'purpose'),
          sOffset: attrOptNum(crg, 'sOffset'),
          tOffset: attrOptNum(crg, 'tOffset'),
          zOffset: attrOptNum(crg, 'zOffset'),
          zScale: attrOptNum(crg, 'zScale'),
          hOffset: attrOptNum(crg, 'hOffset'),
        })),
      };
    }
  }

  return junction;
}

function parseJunctionConnection(raw: Raw): OdrJunctionConnection {
  const conn: OdrJunctionConnection = {
    id: attrStr(raw, 'id'),
    incomingRoad: attrStr(raw, 'incomingRoad'),
    connectingRoad: attrStr(raw, 'connectingRoad'),
    contactPoint: attrStr(raw, 'contactPoint', 'start') as 'start' | 'end',
    laneLinks: ensureArray(raw.laneLink).map((ll: Raw) => ({
      from: attrNum(ll, 'from'),
      to: attrNum(ll, 'to'),
    })),
  };

  // type (for virtual/direct junction connections)
  conn.type = attrOptStr(raw, 'type');

  // predecessor
  if (raw.predecessor) {
    const p = raw.predecessor;
    conn.predecessor = {
      elementType: attrStr(p, 'elementType'),
      elementId: attrStr(p, 'elementId'),
      elementS: attrNum(p, 'elementS'),
      elementDir: attrStr(p, 'elementDir', '+') as '+' | '-',
    };
  }

  // successor
  if (raw.successor) {
    const s = raw.successor;
    conn.successor = {
      elementType: attrStr(s, 'elementType'),
      elementId: attrStr(s, 'elementId'),
      elementS: attrNum(s, 'elementS'),
      elementDir: attrStr(s, 'elementDir', '+') as '+' | '-',
    };
  }

  return conn;
}

export function parseJunctionGroups(raw: Raw[] | undefined): OdrJunctionGroup[] {
  if (!raw) return [];
  return ensureArray(raw).map((jg: Raw) => ({
    id: attrStr(jg, 'id'),
    name: attrOptStr(jg, 'name'),
    type: attrStr(jg, 'type'),
    junctionReferences: ensureArray(jg.junctionReference).map((jr: Raw) =>
      toStr(typeof jr === 'object' ? attr(jr, 'junction') : jr),
    ),
  }));
}
