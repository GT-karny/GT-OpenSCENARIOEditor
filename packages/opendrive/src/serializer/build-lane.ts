/**
 * Build XML structure for OpenDRIVE lane elements.
 */
import type {
  OdrLaneOffset,
  OdrLaneSection,
  OdrLane,
  OdrLaneWidth,
  OdrRoadMark,
  OdrLaneBorder,
  OdrLaneMaterial,
  OdrLaneAccess,
  OdrLaneRule,
  OdrRoadMarkTypeDef,
  OdrRoadMarkExplicit,
  OdrRoadMarkSway,
} from '@osce/shared';
import { fmtNum, optAttr, numAttr } from './format-utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

export function buildLanes(laneOffsets: OdrLaneOffset[], laneSections: OdrLaneSection[]): XmlNode {
  const node: XmlNode = {};

  if (laneOffsets.length > 0) {
    node.laneOffset = laneOffsets.map(buildLaneOffset);
  }

  node.laneSection = laneSections.map(buildLaneSection);

  return node;
}

function buildLaneOffset(lo: OdrLaneOffset): XmlNode {
  const node: XmlNode = {};
  numAttr(node, '@_s', lo.s);
  numAttr(node, '@_a', lo.a);
  numAttr(node, '@_b', lo.b);
  numAttr(node, '@_c', lo.c);
  numAttr(node, '@_d', lo.d);
  return node;
}

function buildLaneSection(section: OdrLaneSection): XmlNode {
  const node: XmlNode = {
    '@_s': fmtNum(section.s),
  };

  if (section.singleSide != null) {
    node['@_singleSide'] = section.singleSide ? 'true' : 'false';
  }

  if (section.leftLanes.length > 0) {
    node.left = {
      lane: section.leftLanes.map(buildLane),
    };
  }

  node.center = {
    lane: buildLane(section.centerLane),
  };

  if (section.rightLanes.length > 0) {
    node.right = {
      lane: section.rightLanes.map(buildLane),
    };
  }

  return node;
}

function buildLane(lane: OdrLane): XmlNode {
  const node: XmlNode = {
    '@_id': lane.id,
    '@_type': lane.type,
  };

  if (lane.level != null) {
    node['@_level'] = lane.level ? 'true' : 'false';
  }

  // link
  if (lane.link) {
    const linkNode: XmlNode = {};
    if (lane.link.predecessorId != null) {
      linkNode.predecessor = { '@_id': lane.link.predecessorId };
    }
    if (lane.link.successorId != null) {
      linkNode.successor = { '@_id': lane.link.successorId };
    }
    node.link = linkNode;
  }

  // width
  if (lane.width.length > 0) {
    node.width = lane.width.map(buildLaneWidth);
  }

  // border
  if (lane.border && lane.border.length > 0) {
    node.border = lane.border.map(buildLaneBorder);
  }

  // roadMark
  if (lane.roadMarks.length > 0) {
    node.roadMark = lane.roadMarks.map(buildRoadMark);
  }

  // material
  if (lane.material && lane.material.length > 0) {
    node.material = lane.material.map(buildLaneMaterial);
  }

  // speed
  if (lane.speed && lane.speed.length > 0) {
    node.speed = lane.speed.map((s) => {
      const sn: XmlNode = {};
      numAttr(sn, '@_sOffset', s.sOffset);
      numAttr(sn, '@_max', s.max);
      sn['@_unit'] = s.unit;
      return sn;
    });
  }

  // access
  if (lane.access && lane.access.length > 0) {
    node.access = lane.access.map(buildLaneAccess);
  }

  // height
  if (lane.height && lane.height.length > 0) {
    node.height = lane.height.map((h) => {
      const hn: XmlNode = {};
      numAttr(hn, '@_sOffset', h.sOffset);
      numAttr(hn, '@_inner', h.inner);
      numAttr(hn, '@_outer', h.outer);
      return hn;
    });
  }

  // rule
  if (lane.rule && lane.rule.length > 0) {
    node.rule = lane.rule.map(buildLaneRule);
  }

  return node;
}

function buildLaneWidth(w: OdrLaneWidth): XmlNode {
  const node: XmlNode = {};
  numAttr(node, '@_sOffset', w.sOffset);
  numAttr(node, '@_a', w.a);
  numAttr(node, '@_b', w.b);
  numAttr(node, '@_c', w.c);
  numAttr(node, '@_d', w.d);
  return node;
}

function buildLaneBorder(b: OdrLaneBorder): XmlNode {
  const node: XmlNode = {};
  numAttr(node, '@_sOffset', b.sOffset);
  numAttr(node, '@_a', b.a);
  numAttr(node, '@_b', b.b);
  numAttr(node, '@_c', b.c);
  numAttr(node, '@_d', b.d);
  return node;
}

function buildLaneMaterial(m: OdrLaneMaterial): XmlNode {
  const node: XmlNode = {};
  numAttr(node, '@_sOffset', m.sOffset);
  optAttr(node, '@_surface', m.surface);
  numAttr(node, '@_friction', m.friction);
  optAttr(node, '@_roughness', m.roughness, fmtNum);
  return node;
}

function buildLaneAccess(a: OdrLaneAccess): XmlNode {
  const node: XmlNode = {};
  numAttr(node, '@_sOffset', a.sOffset);
  optAttr(node, '@_rule', a.rule);
  node['@_restriction'] = a.restriction;
  return node;
}

function buildLaneRule(r: OdrLaneRule): XmlNode {
  const node: XmlNode = {};
  numAttr(node, '@_sOffset', r.sOffset);
  node['@_value'] = r.value;
  return node;
}

function buildRoadMark(rm: OdrRoadMark): XmlNode {
  const node: XmlNode = {};
  numAttr(node, '@_sOffset', rm.sOffset);
  node['@_type'] = rm.type;
  optAttr(node, '@_weight', rm.weight);
  optAttr(node, '@_color', rm.color);
  optAttr(node, '@_material', rm.material);
  optAttr(node, '@_width', rm.width, fmtNum);
  optAttr(node, '@_laneChange', rm.laneChange);
  optAttr(node, '@_height', rm.height, fmtNum);

  // typeDef → <type> child element
  if (rm.typeDef) {
    node.type = buildRoadMarkTypeDef(rm.typeDef);
  }

  // explicit
  if (rm.explicit) {
    node.explicit = buildRoadMarkExplicit(rm.explicit);
  }

  // sway
  if (rm.sway && rm.sway.length > 0) {
    node.sway = rm.sway.map(buildRoadMarkSway);
  }

  return node;
}

function buildRoadMarkTypeDef(td: OdrRoadMarkTypeDef): XmlNode {
  const node: XmlNode = {
    '@_name': td.name,
    '@_width': fmtNum(td.width),
  };
  if (td.lines.length > 0) {
    node.line = td.lines.map((l) => {
      const ln: XmlNode = {
        '@_length': fmtNum(l.length),
        '@_space': fmtNum(l.space),
        '@_tOffset': fmtNum(l.tOffset),
        '@_sOffset': fmtNum(l.sOffset),
      };
      optAttr(ln, '@_rule', l.rule);
      optAttr(ln, '@_width', l.width, fmtNum);
      optAttr(ln, '@_color', l.color);
      return ln;
    });
  }
  return node;
}

function buildRoadMarkExplicit(ex: OdrRoadMarkExplicit): XmlNode {
  const node: XmlNode = {};
  if (ex.lines.length > 0) {
    node.line = ex.lines.map((l) => {
      const ln: XmlNode = {
        '@_length': fmtNum(l.length),
        '@_tOffset': fmtNum(l.tOffset),
        '@_sOffset': fmtNum(l.sOffset),
      };
      optAttr(ln, '@_rule', l.rule);
      optAttr(ln, '@_width', l.width, fmtNum);
      return ln;
    });
  }
  return node;
}

function buildRoadMarkSway(sw: OdrRoadMarkSway): XmlNode {
  const node: XmlNode = {};
  numAttr(node, '@_ds', sw.ds);
  numAttr(node, '@_a', sw.a);
  numAttr(node, '@_b', sw.b);
  numAttr(node, '@_c', sw.c);
  numAttr(node, '@_d', sw.d);
  return node;
}
