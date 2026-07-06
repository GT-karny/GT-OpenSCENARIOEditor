/**
 * Parse OpenDRIVE lane elements.
 */
import type {
  OdrLaneSection,
  OdrLane,
  OdrLaneWidth,
  OdrRoadMark,
  OdrLaneBorder,
  OdrLaneMaterial,
  OdrLaneAccess,
  OdrLaneAccessRestriction,
  OdrLaneLinkRef,
  OdrLaneRule,
  OdrRoadMarkTypeDef,
  OdrRoadMarkExplicit,
  OdrRoadMarkSway,
  OdrSpeedMaxSpecial,
} from '@osce/shared';
import { ODR_LANE_DIRECTIONS, ODR_LANE_ADVISORIES } from '@osce/shared';
import {
  ensureArray,
  attr,
  attrNum,
  attrStr,
  attrOptStr,
  attrOptNum,
} from './xml-helpers.js';
import { trackNode } from './node-tracker.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/** Narrow a raw attribute string to a member of `allowed`, else `undefined`. */
function asEnum<T extends string>(val: string | undefined, allowed: readonly T[]): T | undefined {
  return val !== undefined && (allowed as readonly string[]).includes(val) ? (val as T) : undefined;
}

/**
 * Parse a road-type speed `@max`. OpenDRIVE 1.9 `t_maxSpeed` is a union of a
 * non-negative number and the literals "no limit" / "undefined". With
 * `parseAttributeValue`, numeric values arrive as numbers and the literals as
 * strings; an unrecognized non-numeric value falls back to 0 with a warning.
 */
export function parseSpeedMax(raw: Raw, label: string): number | OdrSpeedMaxSpecial {
  const v = attr(raw, 'max');
  if (typeof v === 'number') return v;
  if (v === 'no limit' || v === 'undefined') return v;
  if (v == null) return 0;
  const n = Number(v);
  if (!Number.isNaN(n)) return n;
  console.warn(`${label}: unrecognized speed @max "${String(v)}"; falling back to 0.`);
  return 0;
}

/**
 * Parse a lane speed `@max`. Per 1.9 XSD this is `t_grEqZero` (numeric only) —
 * the special "no limit"/"undefined" literals are valid on road-type speed but
 * NOT on a lane, so a non-numeric value here is schema-invalid and falls back to
 * 0 with a warning.
 */
function parseLaneSpeedMax(raw: Raw, label: string): number {
  const v = attr(raw, 'max');
  if (typeof v === 'number') return v;
  if (v != null) {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
    console.warn(`${label}: non-numeric speed @max "${String(v)}" is invalid on a lane; falling back to 0.`);
  }
  return 0;
}

export function parseLaneSections(raw: Raw | undefined): OdrLaneSection[] {
  if (!raw) return [];
  return ensureArray(raw.laneSection).map(parseLaneSection);
}

function parseLaneSection(raw: Raw): OdrLaneSection {
  const t = trackNode(raw);
  const leftRaw = t.takeChild('left') as Raw | undefined;
  const rightRaw = t.takeChild('right') as Raw | undefined;
  const centerRaw = t.takeChild('center') as Raw | undefined;

  const leftLanes = leftRaw ? ensureArray(leftRaw.lane).map(parseLane) : [];
  const rightLanes = rightRaw ? ensureArray(rightRaw.lane).map(parseLane) : [];

  // Center lane - always id=0
  let centerLane: OdrLane;
  if (centerRaw?.lane) {
    centerLane = parseLane(ensureArray(centerRaw.lane)[0]);
  } else {
    centerLane = { id: 0, type: 'none', width: [], roadMarks: [] };
  }

  const section: OdrLaneSection = {
    s: t.num('s'),
    singleSide: t.bool('singleSide') === true ? true : undefined,
    leftLanes,
    centerLane,
    rightLanes,
  };

  // @length (valid only on a temporary layer per XSD; parsed permissively).
  const length = t.optNum('length');
  if (length !== undefined) section.length = length;

  // Preserve unmodeled <laneSection> children (userData).
  const extra = t.rest();
  if (extra) section.extra = extra;

  return section;
}

function parseLane(raw: Raw): OdrLane {
  const t = trackNode(raw);
  const lane: OdrLane = {
    id: t.num('id'),
    type: t.str('type', 'none'),
    level: t.bool('level'),
    width: t.takeChildren('width').map((w) => parseLaneWidth(w as Raw)),
    roadMarks: t.takeChildren('roadMark').map((r) => parseRoadMark(r as Raw)),
  };

  // New 1.9 lane attributes. direction/advisory are validated against their
  // enum and only consumed when valid, so an unknown value round-trips via extra.
  const direction = asEnum(attrOptStr(raw, 'direction'), ODR_LANE_DIRECTIONS);
  if (direction) {
    lane.direction = direction;
    t.takeAttr('direction');
  }
  const advisory = asEnum(attrOptStr(raw, 'advisory'), ODR_LANE_ADVISORIES);
  if (advisory) {
    lane.advisory = advisory;
    t.takeAttr('advisory');
  }
  const dynamicLaneType = t.bool('dynamicLaneType');
  if (dynamicLaneType !== undefined) lane.dynamicLaneType = dynamicLaneType;
  const dynamicLaneDirection = t.bool('dynamicLaneDirection');
  if (dynamicLaneDirection !== undefined) lane.dynamicLaneDirection = dynamicLaneDirection;
  const roadWorks = t.bool('roadWorks');
  if (roadWorks !== undefined) lane.roadWorks = roadWorks;

  // Link. OpenDRIVE 1.9 allows multiple <predecessor>/<successor> per link, each
  // with its own @layer, so every ref is captured (the [0]-collapse is retired).
  const link = t.takeChild('link') as Raw | undefined;
  if (link) {
    const predecessors = ensureArray(link.predecessor).map(parseLaneLinkRef);
    const successors = ensureArray(link.successor).map(parseLaneLinkRef);
    if (predecessors.length > 0 || successors.length > 0) {
      lane.link = { predecessors, successors };
    }
  }

  // Speed
  const speedArr = t.takeChildren('speed') as Raw[];
  if (speedArr.length > 0) {
    lane.speed = speedArr.map((s) => ({
      sOffset: attrNum(s, 'sOffset'),
      max: parseLaneSpeedMax(s, `lane ${lane.id} speed`),
      unit: attrStr(s, 'unit', 'm/s'),
    }));
  }

  // Height
  const heightArr = t.takeChildren('height') as Raw[];
  if (heightArr.length > 0) {
    lane.height = heightArr.map((h) => ({
      sOffset: attrNum(h, 'sOffset'),
      inner: attrNum(h, 'inner'),
      outer: attrNum(h, 'outer'),
    }));
  }

  // Border
  const borderArr = t.takeChildren('border') as Raw[];
  if (borderArr.length > 0) {
    lane.border = borderArr.map(parseLaneBorder);
  }

  // Material
  const materialArr = t.takeChildren('material') as Raw[];
  if (materialArr.length > 0) {
    lane.material = materialArr.map(parseLaneMaterial);
  }

  // Access
  const accessArr = t.takeChildren('access') as Raw[];
  if (accessArr.length > 0) {
    lane.access = accessArr.map(parseLaneAccess);
  }

  // Rule
  const ruleArr = t.takeChildren('rule') as Raw[];
  if (ruleArr.length > 0) {
    lane.rule = ruleArr.map(parseLaneRule);
  }

  // Preserve unmodeled lane attrs (@direction/@advisory/@dynamic*) / children (userData).
  const extra = t.rest();
  if (extra) lane.extra = extra;

  return lane;
}

function parseLaneLinkRef(raw: Raw): OdrLaneLinkRef {
  const ref: OdrLaneLinkRef = { id: attrNum(raw, 'id') };
  // @layer is xs:string per XSD, so any value is carried verbatim (no filtering).
  const layer = attrOptStr(raw, 'layer');
  if (layer !== undefined) ref.layer = layer;
  return ref;
}

function parseLaneWidth(raw: Raw): OdrLaneWidth {
  return {
    sOffset: attrNum(raw, 'sOffset'),
    a: attrNum(raw, 'a'),
    b: attrNum(raw, 'b'),
    c: attrNum(raw, 'c'),
    d: attrNum(raw, 'd'),
  };
}

function parseLaneBorder(raw: Raw): OdrLaneBorder {
  return {
    sOffset: attrNum(raw, 'sOffset'),
    a: attrNum(raw, 'a'),
    b: attrNum(raw, 'b'),
    c: attrNum(raw, 'c'),
    d: attrNum(raw, 'd'),
  };
}

function parseLaneMaterial(raw: Raw): OdrLaneMaterial {
  return {
    sOffset: attrNum(raw, 'sOffset'),
    surface: attrOptStr(raw, 'surface'),
    friction: attrNum(raw, 'friction'),
    roughness: attrOptNum(raw, 'roughness'),
  };
}

function parseLaneAccess(raw: Raw): OdrLaneAccess {
  const t = trackNode(raw);
  const access: OdrLaneAccess = {
    sOffset: t.num('sOffset'),
    // @restriction is optional in 1.9 (superseded by <restriction> children).
    restriction: t.optStr('restriction'),
  };
  // @rule: only 'allow'/'deny' are typed; any other value rides through extra.
  const ruleStr = attrOptStr(raw, 'rule');
  if (ruleStr === 'allow' || ruleStr === 'deny') {
    access.rule = ruleStr;
    t.takeAttr('rule');
  }
  const restrictions = t
    .takeChildren('restriction')
    .map((r) => parseLaneAccessRestriction(r as Raw));
  if (restrictions.length > 0) access.restrictions = restrictions;
  // Preserve unmodeled <access> attrs (out-of-enum @rule) / children (userData).
  const extra = t.rest();
  if (extra) access.extra = extra;
  return access;
}

function parseLaneAccessRestriction(raw: Raw): OdrLaneAccessRestriction {
  const t = trackNode(raw);
  const restriction: OdrLaneAccessRestriction = {};
  const type = t.optStr('type');
  if (type) restriction.type = type;
  const extra = t.rest();
  if (extra) restriction.extra = extra;
  return restriction;
}

function parseLaneRule(raw: Raw): OdrLaneRule {
  return {
    sOffset: attrNum(raw, 'sOffset'),
    value: attrStr(raw, 'value'),
  };
}

function parseRoadMark(raw: Raw): OdrRoadMark {
  const rm: OdrRoadMark = {
    sOffset: attrNum(raw, 'sOffset'),
    type: attrStr(raw, 'type', 'none'),
    weight: attrOptStr(raw, 'weight'),
    color: attrOptStr(raw, 'color'),
    material: attrOptStr(raw, 'material'),
    width: attrOptNum(raw, 'width'),
    laneChange: attrOptStr(raw, 'laneChange'),
    height: attrOptNum(raw, 'height'),
  };

  // typeDef — the <type> child element (detailed line definitions).
  // The `type` attribute is read above as `@_type`; the `<type>` child element
  // lives at the bare `type` key, so the two no longer collide.
  const typeArr = ensureArray(raw.type);
  for (const t of typeArr) {
    if (typeof t === 'object' && t != null) {
      rm.typeDef = parseRoadMarkTypeDef(t);
      break;
    }
  }

  // explicit
  if (raw.explicit) {
    rm.explicit = parseRoadMarkExplicit(raw.explicit);
  }

  // sway
  const swayArr = ensureArray(raw.sway);
  if (swayArr.length > 0) {
    rm.sway = swayArr.map(parseRoadMarkSway);
  }

  return rm;
}

function parseRoadMarkTypeDef(raw: Raw): OdrRoadMarkTypeDef {
  return {
    name: attrStr(raw, 'name'),
    width: attrNum(raw, 'width'),
    lines: ensureArray(raw.line).map((l: Raw) => ({
      length: attrNum(l, 'length'),
      space: attrNum(l, 'space'),
      tOffset: attrNum(l, 'tOffset'),
      sOffset: attrNum(l, 'sOffset'),
      rule: attrOptStr(l, 'rule'),
      width: attrOptNum(l, 'width'),
      color: attrOptStr(l, 'color'),
    })),
  };
}

function parseRoadMarkExplicit(raw: Raw): OdrRoadMarkExplicit {
  return {
    lines: ensureArray(raw.line).map((l: Raw) => ({
      length: attrNum(l, 'length'),
      tOffset: attrNum(l, 'tOffset'),
      sOffset: attrNum(l, 'sOffset'),
      rule: attrOptStr(l, 'rule'),
      width: attrOptNum(l, 'width'),
    })),
  };
}

function parseRoadMarkSway(raw: Raw): OdrRoadMarkSway {
  return {
    ds: attrNum(raw, 'ds'),
    a: attrNum(raw, 'a'),
    b: attrNum(raw, 'b'),
    c: attrNum(raw, 'c'),
    d: attrNum(raw, 'd'),
  };
}
