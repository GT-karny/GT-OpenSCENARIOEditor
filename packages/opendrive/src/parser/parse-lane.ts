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
import {
  ensureArray,
  attrNum,
  attrStr,
  attrOptStr,
  attrOptNum,
  attrBool,
} from './xml-helpers.js';

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
    s: attrNum(raw, 's'),
    singleSide: attrBool(raw, 'singleSide') === true ? true : undefined,
    leftLanes,
    centerLane,
    rightLanes,
  };
}

function parseLane(raw: Raw): OdrLane {
  const lane: OdrLane = {
    id: attrNum(raw, 'id'),
    type: attrStr(raw, 'type', 'none'),
    level: attrBool(raw, 'level'),
    width: ensureArray(raw.width).map(parseLaneWidth),
    roadMarks: ensureArray(raw.roadMark).map(parseRoadMark),
  };

  // Link
  const link = raw.link;
  if (link) {
    const laneLink: OdrLaneLink = {};
    if (link.predecessor) {
      const pred = ensureArray(link.predecessor);
      if (pred.length > 0) laneLink.predecessorId = attrNum(pred[0], 'id');
    }
    if (link.successor) {
      const succ = ensureArray(link.successor);
      if (succ.length > 0) laneLink.successorId = attrNum(succ[0], 'id');
    }
    if (laneLink.predecessorId !== undefined || laneLink.successorId !== undefined) {
      lane.link = laneLink;
    }
  }

  // Speed
  const speedArr = ensureArray(raw.speed);
  if (speedArr.length > 0) {
    lane.speed = speedArr.map((s: Raw) => ({
      sOffset: attrNum(s, 'sOffset'),
      max: attrNum(s, 'max'),
      unit: attrStr(s, 'unit', 'm/s'),
    }));
  }

  // Height
  const heightArr = ensureArray(raw.height);
  if (heightArr.length > 0) {
    lane.height = heightArr.map((h: Raw) => ({
      sOffset: attrNum(h, 'sOffset'),
      inner: attrNum(h, 'inner'),
      outer: attrNum(h, 'outer'),
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
  const ruleStr = attrOptStr(raw, 'rule');
  return {
    sOffset: attrNum(raw, 'sOffset'),
    rule: ruleStr === 'allow' || ruleStr === 'deny' ? ruleStr : undefined,
    restriction: attrStr(raw, 'restriction'),
  };
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
