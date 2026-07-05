/**
 * Parse OpenDRIVE junction elements.
 */
import type {
  OdrJunction,
  OdrJunctionConnection,
  OdrJunctionGroup,
  OdrExtra,
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
import { trackNode } from './node-tracker.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseJunction(raw: Raw): OdrJunction {
  const t = trackNode(raw);
  const junction: OdrJunction = {
    id: t.str('id'),
    name: t.str('name'),
    type: t.optStr('type'),
    connections: t.takeChildren('connection').map((c) => parseJunctionConnection(c as Raw)),
  };

  // Virtual junction attributes (t_junction_virtual): mandatory for type="virtual"
  const mainRoad = t.optStr('mainRoad');
  if (mainRoad !== undefined) junction.mainRoad = mainRoad;
  const sStart = t.optNum('sStart');
  if (sStart !== undefined) junction.sStart = sStart;
  const sEnd = t.optNum('sEnd');
  if (sEnd !== undefined) junction.sEnd = sEnd;
  const orientation = t.optStr('orientation');
  if (orientation !== undefined) junction.orientation = orientation;

  // priority
  const priorityArr = t.takeChildren('priority') as Raw[];
  if (priorityArr.length > 0) {
    junction.priority = priorityArr.map((p) => ({
      high: attrOptStr(p, 'high'),
      low: attrOptStr(p, 'low'),
    }));
  }

  // controller
  const controllerArr = t.takeChildren('controller') as Raw[];
  if (controllerArr.length > 0) {
    junction.controller = controllerArr.map((c) => ({
      id: attrStr(c, 'id'),
      type: attrOptStr(c, 'type'),
      sequence: attrOptNum(c, 'sequence'),
    }));
  }

  // surface
  const surface = t.takeChild('surface') as Raw | undefined;
  if (surface) {
    const crgArr = ensureArray(surface.CRG ?? surface.crg);
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

  // Preserve unmodeled attrs/children (crossing/direct-junction subtrees:
  // roadSection, crossPath, boundary, elevationGrid, planView, objects, …).
  const extra = t.rest();
  if (extra) junction.extra = extra;

  return junction;
}

function parseJunctionConnection(raw: Raw): OdrJunctionConnection {
  const t = trackNode(raw);
  const conn: OdrJunctionConnection = {
    id: t.str('id'),
    incomingRoad: t.str('incomingRoad'),
    connectingRoad: t.str('connectingRoad'),
    contactPoint: t.str('contactPoint', 'start') as 'start' | 'end',
    laneLinks: t.takeChildren('laneLink').map((ll) => {
      const lt = trackNode(ll as Raw);
      const link: { from: number; to: number; extra?: OdrExtra } = {
        from: lt.num('from'),
        to: lt.num('to'),
      };
      // Preserve unmodeled laneLink attrs (@overlapZone/@fromLayer/@toLayer).
      const ex = lt.rest();
      if (ex) link.extra = ex;
      return link;
    }),
  };

  // type (for virtual/direct junction connections)
  conn.type = t.optStr('type');

  // predecessor
  const p = t.takeChild('predecessor') as Raw | undefined;
  if (p) {
    conn.predecessor = {
      elementType: attrStr(p, 'elementType'),
      elementId: attrStr(p, 'elementId'),
      elementS: attrNum(p, 'elementS'),
      elementDir: attrStr(p, 'elementDir', '+') as '+' | '-',
    };
  }

  // successor
  const s = t.takeChild('successor') as Raw | undefined;
  if (s) {
    conn.successor = {
      elementType: attrStr(s, 'elementType'),
      elementId: attrStr(s, 'elementId'),
      elementS: attrNum(s, 'elementS'),
      elementDir: attrStr(s, 'elementDir', '+') as '+' | '-',
    };
  }

  // Preserve unmodeled connection attrs (linkedRoad, overlapZone, layer, …).
  const extra = t.rest();
  if (extra) conn.extra = extra;

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
