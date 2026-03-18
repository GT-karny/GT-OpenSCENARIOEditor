/**
 * Parse OpenDRIVE lane elements.
 */
import type {
  OdrLaneSection,
  OdrLane,
  OdrLaneWidth,
  OdrRoadMark,
  OdrLaneLink,
  OdrLaneBorder,
  OdrLaneMaterial,
  OdrLaneAccess,
  OdrLaneRule,
  OdrRoadMarkTypeDef,
  OdrRoadMarkExplicit,
  OdrRoadMarkSway,
} from '@osce/shared';
import { ensureArray, toNum, toStr, toOptStr, toOptNum } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseLaneSections(raw: Raw | undefined): OdrLaneSection[] {
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
    level:
      raw.level === true || raw.level === 'true'
        ? true
        : raw.level === false || raw.level === 'false'
          ? false
          : undefined,
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

  // Border
  const borderArr = ensureArray(raw.border);
  if (borderArr.length > 0) {
    lane.border = borderArr.map(parseLaneBorder);
  }

  // Material
  const materialArr = ensureArray(raw.material);
  if (materialArr.length > 0) {
    lane.material = materialArr.map(parseLaneMaterial);
  }

  // Access
  const accessArr = ensureArray(raw.access);
  if (accessArr.length > 0) {
    lane.access = accessArr.map(parseLaneAccess);
  }

  // Rule
  const ruleArr = ensureArray(raw.rule);
  if (ruleArr.length > 0) {
    lane.rule = ruleArr.map(parseLaneRule);
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

function parseLaneBorder(raw: Raw): OdrLaneBorder {
  return {
    sOffset: toNum(raw.sOffset),
    a: toNum(raw.a),
    b: toNum(raw.b),
    c: toNum(raw.c),
    d: toNum(raw.d),
  };
}

function parseLaneMaterial(raw: Raw): OdrLaneMaterial {
  return {
    sOffset: toNum(raw.sOffset),
    surface: toOptStr(raw.surface),
    friction: toNum(raw.friction),
    roughness: toOptNum(raw.roughness),
  };
}

function parseLaneAccess(raw: Raw): OdrLaneAccess {
  const ruleStr = toOptStr(raw.rule);
  return {
    sOffset: toNum(raw.sOffset),
    rule: ruleStr === 'allow' || ruleStr === 'deny' ? ruleStr : undefined,
    restriction: toStr(raw.restriction),
  };
}

function parseLaneRule(raw: Raw): OdrLaneRule {
  return {
    sOffset: toNum(raw.sOffset),
    value: toStr(raw.value),
  };
}

function parseRoadMark(raw: Raw): OdrRoadMark {
  const rm: OdrRoadMark = {
    sOffset: toNum(raw.sOffset),
    type: toStr(raw.type, 'none'),
    weight: toOptStr(raw.weight),
    color: toOptStr(raw.color),
    material: toOptStr(raw.material),
    width: toOptNum(raw.width),
    laneChange: toOptStr(raw.laneChange),
    height: toOptNum(raw.height),
  };

  // typeDef — the <type> child element (has name+line children)
  // Note: fast-xml-parser puts `type` as both the attribute (string) and child element (object).
  // The attribute is already captured above. The child element <type> has `name`, `width`, `line`.
  // In the parsed raw, if there's a child <type> element, it appears as an array item with `name` property.
  const typeArr = ensureArray(raw.type);
  for (const t of typeArr) {
    if (typeof t === 'object' && t != null && t.name != null) {
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
    name: toStr(raw.name),
    width: toNum(raw.width),
    lines: ensureArray(raw.line).map((l: Raw) => ({
      length: toNum(l.length),
      space: toNum(l.space),
      tOffset: toNum(l.tOffset),
      sOffset: toNum(l.sOffset),
      rule: toOptStr(l.rule),
      width: toOptNum(l.width),
      color: toOptStr(l.color),
    })),
  };
}

function parseRoadMarkExplicit(raw: Raw): OdrRoadMarkExplicit {
  return {
    lines: ensureArray(raw.line).map((l: Raw) => ({
      length: toNum(l.length),
      tOffset: toNum(l.tOffset),
      sOffset: toNum(l.sOffset),
      rule: toOptStr(l.rule),
      width: toOptNum(l.width),
    })),
  };
}

function parseRoadMarkSway(raw: Raw): OdrRoadMarkSway {
  return {
    ds: toNum(raw.ds),
    a: toNum(raw.a),
    b: toNum(raw.b),
    c: toNum(raw.c),
    d: toNum(raw.d),
  };
}
