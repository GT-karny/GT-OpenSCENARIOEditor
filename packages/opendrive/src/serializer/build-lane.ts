/**
 * Build XML structure for OpenDRIVE lane elements.
 */
import type { OdrLaneOffset, OdrLaneSection, OdrLane, OdrLaneWidth, OdrRoadMark } from '@osce/shared';
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

  // roadMark
  if (lane.roadMarks.length > 0) {
    node.roadMark = lane.roadMarks.map(buildRoadMark);
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
  return node;
}
