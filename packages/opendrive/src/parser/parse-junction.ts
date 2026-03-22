/**
 * Parse OpenDRIVE junction elements.
 */
import type {
  OdrJunction,
  OdrJunctionConnection,
  OdrJunctionGroup,
} from '@osce/shared';
import { ensureArray, toNum, toStr, toOptStr, toOptNum } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseJunction(raw: Raw): OdrJunction {
  const junction: OdrJunction = {
    id: toStr(raw.id),
    name: toStr(raw.name),
    type: toOptStr(raw.type),
    connections: ensureArray(raw.connection).map(parseJunctionConnection),
  };

  // priority
  const priorityArr = ensureArray(raw.priority);
  if (priorityArr.length > 0) {
    junction.priority = priorityArr.map((p: Raw) => ({
      high: toOptStr(p.high),
      low: toOptStr(p.low),
    }));
  }

  // controller
  const controllerArr = ensureArray(raw.controller);
  if (controllerArr.length > 0) {
    junction.controller = controllerArr.map((c: Raw) => ({
      id: toStr(c.id),
      type: toOptStr(c.type),
      sequence: toOptNum(c.sequence),
    }));
  }

  // surface
  if (raw.surface) {
    const crgArr = ensureArray(raw.surface.CRG ?? raw.surface.crg);
    if (crgArr.length > 0) {
      junction.surface = {
        crg: crgArr.map((crg: Raw) => ({
          file: toStr(crg.file),
          sStart: toOptNum(crg.sStart),
          sEnd: toOptNum(crg.sEnd),
          orientation: toOptStr(crg.orientation),
          mode: toOptStr(crg.mode),
          purpose: toOptStr(crg.purpose),
          sOffset: toOptNum(crg.sOffset),
          tOffset: toOptNum(crg.tOffset),
          zOffset: toOptNum(crg.zOffset),
          zScale: toOptNum(crg.zScale),
          hOffset: toOptNum(crg.hOffset),
        })),
      };
    }
  }

  return junction;
}

function parseJunctionConnection(raw: Raw): OdrJunctionConnection {
  const conn: OdrJunctionConnection = {
    id: toStr(raw.id),
    incomingRoad: toStr(raw.incomingRoad),
    connectingRoad: toStr(raw.connectingRoad),
    contactPoint: toStr(raw.contactPoint, 'start') as 'start' | 'end',
    laneLinks: ensureArray(raw.laneLink).map((ll: Raw) => ({
      from: toNum(ll.from),
      to: toNum(ll.to),
    })),
  };

  // type (for virtual/direct junction connections)
  conn.type = toOptStr(raw.type);

  // predecessor
  if (raw.predecessor) {
    const p = raw.predecessor;
    conn.predecessor = {
      elementType: toStr(p.elementType),
      elementId: toStr(p.elementId),
      elementS: toNum(p.elementS),
      elementDir: toStr(p.elementDir, '+') as '+' | '-',
    };
  }

  // successor
  if (raw.successor) {
    const s = raw.successor;
    conn.successor = {
      elementType: toStr(s.elementType),
      elementId: toStr(s.elementId),
      elementS: toNum(s.elementS),
      elementDir: toStr(s.elementDir, '+') as '+' | '-',
    };
  }

  return conn;
}

export function parseJunctionGroups(raw: Raw[] | undefined): OdrJunctionGroup[] {
  if (!raw) return [];
  return ensureArray(raw).map((jg: Raw) => ({
    id: toStr(jg.id),
    name: toOptStr(jg.name),
    type: toStr(jg.type),
    junctionReferences: ensureArray(jg.junctionReference).map((jr: Raw) =>
      toStr(typeof jr === 'object' ? jr.junction : jr),
    ),
  }));
}
