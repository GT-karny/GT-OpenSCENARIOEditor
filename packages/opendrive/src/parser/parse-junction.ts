/**
 * Parse OpenDRIVE junction elements.
 */
import type {
  OdrJunction,
  OdrJunctionConnection,
  OdrJunctionLaneLink,
  OdrJunctionCrossPath,
  OdrJunctionCrossPathLaneLink,
  OdrJunctionRoadSection,
  OdrJunctionGroup,
} from '@osce/shared';
import { ODR_JUNCTION_TYPES, ODR_LAYER_TYPES } from '@osce/shared';
import {
  ensureArray,
  toStr,
  attr,
  attrNum,
  attrStr,
  attrOptStr,
  attrOptNum,
  asEnum,
} from './xml-helpers.js';
import { trackNode } from './node-tracker.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseJunction(raw: Raw): OdrJunction {
  const t = trackNode(raw);
  const junction: OdrJunction = {
    id: t.str('id'),
    name: t.str('name'),
    connections: t.takeChildren('connection').map((c) => parseJunctionConnection(c as Raw)),
  };

  // @type: validate against the enum. An unknown value is left unconsumed so it
  // round-trips via extra (with a warning); absent stays undefined (as before).
  const rawType = attrOptStr(raw, 'type');
  const jType = asEnum(rawType, ODR_JUNCTION_TYPES);
  if (jType) {
    junction.type = jType;
    t.takeAttr('type');
  } else if (rawType !== undefined) {
    console.warn(`Junction ${junction.id}: unrecognized @type "${rawType}" preserved via extra.`);
  }

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

  // crossPath (common/virtual junctions)
  const crossPathArr = t.takeChildren('crossPath') as Raw[];
  if (crossPathArr.length > 0) {
    junction.crossPaths = crossPathArr.map(parseCrossPath);
  }

  // roadSection (crossing junctions)
  const roadSectionArr = t.takeChildren('roadSection') as Raw[];
  if (roadSectionArr.length > 0) {
    junction.roadSections = roadSectionArr.map(parseRoadSection);
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
    laneLinks: t.takeChildren('laneLink').map((ll) => {
      const llRaw = ll as Raw;
      const lt = trackNode(llRaw);
      const link: OdrJunctionLaneLink = {
        from: lt.num('from'),
        to: lt.num('to'),
      };
      // 1.9 laneLink attrs: @overlapZone (t_grZero), @fromLayer/@toLayer (e_layerType).
      const overlapZone = lt.optNum('overlapZone');
      if (overlapZone !== undefined) link.overlapZone = overlapZone;
      const fromLayer = asEnum(attrOptStr(llRaw, 'fromLayer'), ODR_LAYER_TYPES);
      if (fromLayer) {
        link.fromLayer = fromLayer;
        lt.takeAttr('fromLayer');
      }
      const toLayer = asEnum(attrOptStr(llRaw, 'toLayer'), ODR_LAYER_TYPES);
      if (toLayer) {
        link.toLayer = toLayer;
        lt.takeAttr('toLayer');
      }
      const ex = lt.rest();
      if (ex) link.extra = ex;
      return link;
    }),
  };

  // @contactPoint (e_contactPoint): only set when present (absent on virtual).
  const contactPoint = t.optStr('contactPoint');
  if (contactPoint === 'start' || contactPoint === 'end') conn.contactPoint = contactPoint;

  // @type (e_connection_type). Validate; an unknown value round-trips via extra.
  const rawConnType = attrOptStr(raw, 'type');
  if (rawConnType === 'default' || rawConnType === 'virtual') {
    conn.type = rawConnType;
    t.takeAttr('type');
  }

  // @linkedRoad (t_junction_connection_direct): typed on direct-junction
  // connections. Only present on direct junctions; consumed so it no longer
  // rides through extra.
  const linkedRoad = t.optStr('linkedRoad');
  if (linkedRoad !== undefined) conn.linkedRoad = linkedRoad;

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

  // Preserve any remaining unmodeled connection attrs/children for round-trip.
  const extra = t.rest();
  if (extra) conn.extra = extra;

  return conn;
}

function parseCrossPath(raw: Raw): OdrJunctionCrossPath {
  const t = trackNode(raw);
  const crossPath: OdrJunctionCrossPath = {
    startLaneLink: parseCrossPathLaneLink(t.takeChild('startLaneLink') as Raw | undefined),
    endLaneLink: parseCrossPathLaneLink(t.takeChild('endLaneLink') as Raw | undefined),
  };
  const id = t.optStr('id');
  if (id !== undefined) crossPath.id = id;
  const crossingRoad = t.optStr('crossingRoad');
  if (crossingRoad !== undefined) crossPath.crossingRoad = crossingRoad;
  const roadAtStart = t.optStr('roadAtStart');
  if (roadAtStart !== undefined) crossPath.roadAtStart = roadAtStart;
  const roadAtEnd = t.optStr('roadAtEnd');
  if (roadAtEnd !== undefined) crossPath.roadAtEnd = roadAtEnd;
  const extra = t.rest();
  if (extra) crossPath.extra = extra;
  return crossPath;
}

function parseCrossPathLaneLink(raw: Raw | undefined): OdrJunctionCrossPathLaneLink {
  if (!raw || typeof raw !== 'object') return {};
  const t = trackNode(raw);
  const link: OdrJunctionCrossPathLaneLink = {};
  const s = t.optNum('s');
  if (s !== undefined) link.s = s;
  const from = t.optNum('from');
  if (from !== undefined) link.from = from;
  const to = t.optNum('to');
  if (to !== undefined) link.to = to;
  const extra = t.rest();
  if (extra) link.extra = extra;
  return link;
}

function parseRoadSection(raw: Raw): OdrJunctionRoadSection {
  const t = trackNode(raw);
  const rs: OdrJunctionRoadSection = {};
  const id = t.optStr('id');
  if (id !== undefined) rs.id = id;
  const roadId = t.optStr('roadId');
  if (roadId !== undefined) rs.roadId = roadId;
  const sStart = t.optNum('sStart');
  if (sStart !== undefined) rs.sStart = sStart;
  const sEnd = t.optNum('sEnd');
  if (sEnd !== undefined) rs.sEnd = sEnd;
  const extra = t.rest();
  if (extra) rs.extra = extra;
  return rs;
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
