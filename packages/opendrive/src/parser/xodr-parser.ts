/**
 * OpenDRIVE (.xodr) XML parser.
 * Implements IXodrParser from @osce/shared.
 */
import type {
  IXodrParser,
  OpenDriveDocument,
  OdrHeader,
  OdrRoad,
  OdrRoadLink,
  OdrRoadLinkElement,
  OdrRoadTypeEntry,
  OdrGeometry,
  OdrElevation,
  OdrSuperelevation,
  OdrLaneSection,
  OdrLane,
  OdrLaneWidth,
  OdrRoadMark,
  OdrLaneLink,
  OdrRoadObject,
  OdrSignal,
  OdrController,
  OdrJunction,
  OdrJunctionConnection,
} from '@osce/shared';
import { createXodrXmlParser, ensureArray, toNum, toStr, toOptNum, toOptStr } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export class XodrParser implements IXodrParser {
  parse(xml: string): OpenDriveDocument {
    const parser = createXodrXmlParser();
    const parsed = parser.parse(xml);
    const root: Raw = parsed.OpenDRIVE ?? parsed['OpenDRIVE'];

    if (!root) {
      throw new Error('Invalid OpenDRIVE XML: missing <OpenDRIVE> root element');
    }

    return {
      header: parseHeader(root.header),
      roads: ensureArray(root.road).map(parseRoad),
      controllers: ensureArray(root.controller).map(parseController),
      junctions: ensureArray(root.junction).map(parseJunction),
    };
  }
}

function parseHeader(raw: Raw | undefined): OdrHeader {
  if (!raw) {
    return { revMajor: 1, revMinor: 0, name: '', date: '' };
  }
  return {
    revMajor: toNum(raw.revMajor, 1),
    revMinor: toNum(raw.revMinor, 0),
    name: toStr(raw.name),
    date: toStr(raw.date),
    north: toOptNum(raw.north),
    south: toOptNum(raw.south),
    east: toOptNum(raw.east),
    west: toOptNum(raw.west),
    geoReference: extractGeoReference(raw.geoReference),
  };
}

function extractGeoReference(val: unknown): string | undefined {
  if (val == null) return undefined;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Raw;
    // CDATA content
    if (obj.__cdata) return String(obj.__cdata);
    if (obj['#text']) return String(obj['#text']);
  }
  return String(val);
}

function parseRoad(raw: Raw): OdrRoad {
  return {
    id: toStr(raw.id),
    name: toStr(raw.name),
    length: toNum(raw.length),
    junction: toStr(raw.junction),
    link: parseRoadLink(raw.link),
    type: parseRoadTypes(raw.type),
    planView: parsePlanView(raw.planView),
    elevationProfile: parseElevations(raw.elevationProfile),
    lateralProfile: parseSuperelevations(raw.lateralProfile),
    lanes: parseLaneSections(raw.lanes),
    objects: parseObjects(raw.objects),
    signals: parseSignals(raw.signals),
  };
}

function parseRoadLink(raw: Raw | undefined): OdrRoadLink | undefined {
  if (!raw) return undefined;
  const pred = raw.predecessor;
  const succ = raw.successor;
  if (!pred && !succ) return undefined;
  return {
    predecessor: parseLinkElement(pred),
    successor: parseLinkElement(succ),
  };
}

function parseLinkElement(raw: Raw | undefined): OdrRoadLinkElement | undefined {
  if (!raw) return undefined;
  return {
    elementType: toStr(raw.elementType) as 'road' | 'junction',
    elementId: toStr(raw.elementId),
    contactPoint: toOptStr(raw.contactPoint) as 'start' | 'end' | undefined,
  };
}

function parseRoadTypes(raw: Raw[] | undefined): OdrRoadTypeEntry[] | undefined {
  const arr = ensureArray(raw);
  if (arr.length === 0) return undefined;
  return arr.map((r) => {
    const entry: OdrRoadTypeEntry = {
      s: toNum(r.s),
      type: toStr(r.type),
    };
    // speed can be a child element or nested
    const spd = r.speed;
    if (spd) {
      const speedArr = ensureArray(spd);
      if (speedArr.length > 0) {
        entry.speed = {
          max: toNum(speedArr[0].max),
          unit: toStr(speedArr[0].unit, 'm/s'),
        };
      }
    }
    return entry;
  });
}

function parsePlanView(raw: Raw | undefined): OdrGeometry[] {
  if (!raw) return [];
  return ensureArray(raw.geometry).map(parseGeometry);
}

function parseGeometry(raw: Raw): OdrGeometry {
  const base = {
    s: toNum(raw.s),
    x: toNum(raw.x),
    y: toNum(raw.y),
    hdg: toNum(raw.hdg),
    length: toNum(raw.length),
  };

  if ('line' in raw) {
    return { ...base, type: 'line' as const };
  }

  if ('arc' in raw) {
    const arc = typeof raw.arc === 'object' && raw.arc !== null ? raw.arc : {};
    return {
      ...base,
      type: 'arc' as const,
      curvature: toNum(arc.curvature),
    };
  }

  if ('spiral' in raw) {
    const sp = typeof raw.spiral === 'object' && raw.spiral !== null ? raw.spiral : {};
    return {
      ...base,
      type: 'spiral' as const,
      curvStart: toNum(sp.curvStart),
      curvEnd: toNum(sp.curvEnd),
    };
  }

  if ('poly3' in raw) {
    const p = typeof raw.poly3 === 'object' && raw.poly3 !== null ? raw.poly3 : {};
    return {
      ...base,
      type: 'poly3' as const,
      a: toNum(p.a),
      b: toNum(p.b),
      c: toNum(p.c),
      d: toNum(p.d),
    };
  }

  if ('paramPoly3' in raw) {
    const pp = typeof raw.paramPoly3 === 'object' && raw.paramPoly3 !== null ? raw.paramPoly3 : {};
    return {
      ...base,
      type: 'paramPoly3' as const,
      aU: toNum(pp.aU),
      bU: toNum(pp.bU),
      cU: toNum(pp.cU),
      dU: toNum(pp.dU),
      aV: toNum(pp.aV),
      bV: toNum(pp.bV),
      cV: toNum(pp.cV),
      dV: toNum(pp.dV),
      pRange: pp.pRange === 'normalized' ? 'normalized' as const : 'arcLength' as const,
    };
  }

  // Fallback: treat unknown geometry as a line
  return { ...base, type: 'line' as const };
}

function parseElevations(raw: Raw | undefined): OdrElevation[] {
  if (!raw) return [];
  return ensureArray(raw.elevation).map((e: Raw) => ({
    s: toNum(e.s),
    a: toNum(e.a),
    b: toNum(e.b),
    c: toNum(e.c),
    d: toNum(e.d),
  }));
}

function parseSuperelevations(raw: Raw | undefined): OdrSuperelevation[] {
  if (!raw) return [];
  return ensureArray(raw.superelevation).map((e: Raw) => ({
    s: toNum(e.s),
    a: toNum(e.a),
    b: toNum(e.b),
    c: toNum(e.c),
    d: toNum(e.d),
  }));
}

function parseLaneSections(raw: Raw | undefined): OdrLaneSection[] {
  if (!raw) return [];
  return ensureArray(raw.laneSection).map(parseLaneSection);
}

function parseLaneSection(raw: Raw): OdrLaneSection {
  const leftLanes = raw.left ? ensureArray(raw.left.lane).map(parseLane) : [];
  const rightLanes = raw.right ? ensureArray(raw.right.lane).map(parseLane) : [];

  // Center lane - always id=0
  let centerLane: OdrLane;
  if (raw.center?.lane) {
    const centerArr = ensureArray(raw.center.lane);
    centerLane = parseLane(centerArr[0]);
  } else {
    centerLane = { id: 0, type: 'none', width: [], roadMarks: [] };
  }

  return {
    s: toNum(raw.s),
    singleSide: raw.singleSide === true || raw.singleSide === 'true' ? true : undefined,
    leftLanes,
    centerLane,
    rightLanes,
  };
}

function parseLane(raw: Raw): OdrLane {
  const lane: OdrLane = {
    id: toNum(raw.id),
    type: toStr(raw.type, 'none'),
    level: raw.level === true || raw.level === 'true' ? true : raw.level === false || raw.level === 'false' ? false : undefined,
    width: ensureArray(raw.width).map(parseLaneWidth),
    roadMarks: ensureArray(raw.roadMark).map(parseRoadMark),
  };

  // Link
  const link = raw.link;
  if (link) {
    const laneLink: OdrLaneLink = {};
    if (link.predecessor) {
      const pred = ensureArray(link.predecessor);
      if (pred.length > 0) laneLink.predecessorId = toNum(pred[0].id);
    }
    if (link.successor) {
      const succ = ensureArray(link.successor);
      if (succ.length > 0) laneLink.successorId = toNum(succ[0].id);
    }
    if (laneLink.predecessorId !== undefined || laneLink.successorId !== undefined) {
      lane.link = laneLink;
    }
  }

  // Speed
  const speedArr = ensureArray(raw.speed);
  if (speedArr.length > 0) {
    lane.speed = speedArr.map((s: Raw) => ({
      sOffset: toNum(s.sOffset),
      max: toNum(s.max),
      unit: toStr(s.unit, 'm/s'),
    }));
  }

  // Height
  const heightArr = ensureArray(raw.height);
  if (heightArr.length > 0) {
    lane.height = heightArr.map((h: Raw) => ({
      sOffset: toNum(h.sOffset),
      inner: toNum(h.inner),
      outer: toNum(h.outer),
    }));
  }

  return lane;
}

function parseLaneWidth(raw: Raw): OdrLaneWidth {
  return {
    sOffset: toNum(raw.sOffset),
    a: toNum(raw.a),
    b: toNum(raw.b),
    c: toNum(raw.c),
    d: toNum(raw.d),
  };
}

function parseRoadMark(raw: Raw): OdrRoadMark {
  return {
    sOffset: toNum(raw.sOffset),
    type: toStr(raw.type, 'none'),
    weight: toOptStr(raw.weight),
    color: toOptStr(raw.color),
    material: toOptStr(raw.material),
    width: toOptNum(raw.width),
    laneChange: toOptStr(raw.laneChange),
    height: toOptNum(raw.height),
  };
}

function parseObjects(raw: Raw | undefined): OdrRoadObject[] {
  if (!raw) return [];
  return ensureArray(raw.object).map((o: Raw) => ({
    id: toStr(o.id),
    name: toOptStr(o.name),
    type: toOptStr(o.type),
    s: toNum(o.s),
    t: toNum(o.t),
    zOffset: toOptNum(o.zOffset),
    hdg: toOptNum(o.hdg),
    pitch: toOptNum(o.pitch),
    roll: toOptNum(o.roll),
    length: toOptNum(o.length),
    width: toOptNum(o.width),
    height: toOptNum(o.height),
    radius: toOptNum(o.radius),
    orientation: toOptStr(o.orientation),
  }));
}

function parseSignals(raw: Raw | undefined): OdrSignal[] {
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

function parseController(raw: Raw): OdrController {
  return {
    id: toStr(raw.id),
    name: toStr(raw.name),
    sequence: toOptNum(raw.sequence),
    controls: ensureArray(raw.control).map((c: Raw) => ({
      signalId: toStr(c.signalId),
      type: toOptStr(c.type),
    })),
  };
}

function parseJunction(raw: Raw): OdrJunction {
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
