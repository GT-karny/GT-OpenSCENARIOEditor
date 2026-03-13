/**
 * Build XML structure for OpenDRIVE <road> elements.
 */
import type {
  OdrRoad,
  OdrRoadLink,
  OdrRoadLinkElement,
  OdrRoadTypeEntry,
  OdrGeometry,
  OdrElevation,
  OdrSuperelevation,
  OdrLaneOffset,
  OdrLaneSection,
  OdrLane,
  OdrLaneWidth,
  OdrRoadMark,
  OdrRoadObject,
  OdrSignal,
} from '@osce/shared';
import { fmtNum, optAttr, numAttr } from './format-utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

export function buildRoad(road: OdrRoad): XmlNode {
  const node: XmlNode = {
    '@_name': road.name,
    '@_length': fmtNum(road.length),
    '@_id': road.id,
    '@_junction': road.junction,
  };

  if (road.rule != null) {
    node['@_rule'] = road.rule;
  }

  // link
  node.link = buildRoadLink(road.link);

  // type entries
  if (road.type != null && road.type.length > 0) {
    node.type = road.type.map(buildRoadType);
  }

  // planView
  node.planView = {
    geometry: road.planView.map(buildGeometry),
  };

  // elevationProfile
  if (road.elevationProfile.length > 0) {
    node.elevationProfile = {
      elevation: road.elevationProfile.map(buildElevation),
    };
  } else {
    node.elevationProfile = '';
  }

  // lateralProfile
  if (road.lateralProfile.length > 0) {
    node.lateralProfile = {
      superelevation: road.lateralProfile.map(buildSuperelevation),
    };
  } else {
    node.lateralProfile = '';
  }

  // lanes
  node.lanes = buildLanes(road.laneOffset, road.lanes);

  // objects
  if (road.objects.length > 0) {
    node.objects = {
      object: road.objects.map(buildObject),
    };
  } else {
    node.objects = '';
  }

  // signals
  if (road.signals.length > 0) {
    node.signals = {
      signal: road.signals.map(buildSignal),
    };
  } else {
    node.signals = '';
  }

  return node;
}

function buildRoadLink(link: OdrRoadLink | undefined): XmlNode | string {
  if (!link) return '';
  const node: XmlNode = {};
  if (link.predecessor) {
    node.predecessor = buildLinkElement(link.predecessor);
  }
  if (link.successor) {
    node.successor = buildLinkElement(link.successor);
  }
  // Return empty string if no children to produce <link/>
  if (!link.predecessor && !link.successor) return '';
  return node;
}

function buildLinkElement(elem: OdrRoadLinkElement): XmlNode {
  const node: XmlNode = {
    '@_elementType': elem.elementType,
    '@_elementId': elem.elementId,
  };
  optAttr(node, '@_contactPoint', elem.contactPoint);
  return node;
}

function buildRoadType(entry: OdrRoadTypeEntry): XmlNode {
  const node: XmlNode = {
    '@_s': fmtNum(entry.s),
    '@_type': entry.type,
  };
  if (entry.speed) {
    node.speed = {
      '@_max': fmtNum(entry.speed.max),
      '@_unit': entry.speed.unit,
    };
  }
  return node;
}

function buildGeometry(geom: OdrGeometry): XmlNode {
  const node: XmlNode = {
    '@_s': fmtNum(geom.s),
    '@_x': fmtNum(geom.x),
    '@_y': fmtNum(geom.y),
    '@_hdg': fmtNum(geom.hdg),
    '@_length': fmtNum(geom.length),
  };

  switch (geom.type) {
    case 'line':
      node.line = '';
      break;
    case 'arc':
      node.arc = { '@_curvature': fmtNum(geom.curvature ?? 0) };
      break;
    case 'spiral':
      node.spiral = {
        '@_curvStart': fmtNum(geom.curvStart ?? 0),
        '@_curvEnd': fmtNum(geom.curvEnd ?? 0),
      };
      break;
    case 'poly3':
      node.poly3 = {
        '@_a': fmtNum(geom.a ?? 0),
        '@_b': fmtNum(geom.b ?? 0),
        '@_c': fmtNum(geom.c ?? 0),
        '@_d': fmtNum(geom.d ?? 0),
      };
      break;
    case 'paramPoly3':
      node.paramPoly3 = {
        '@_aU': fmtNum(geom.aU ?? 0),
        '@_bU': fmtNum(geom.bU ?? 0),
        '@_cU': fmtNum(geom.cU ?? 0),
        '@_dU': fmtNum(geom.dU ?? 0),
        '@_aV': fmtNum(geom.aV ?? 0),
        '@_bV': fmtNum(geom.bV ?? 0),
        '@_cV': fmtNum(geom.cV ?? 0),
        '@_dV': fmtNum(geom.dV ?? 0),
        '@_pRange': geom.pRange ?? 'arcLength',
      };
      break;
  }

  return node;
}

function buildElevation(elev: OdrElevation): XmlNode {
  const node: XmlNode = {};
  numAttr(node, '@_s', elev.s);
  numAttr(node, '@_a', elev.a);
  numAttr(node, '@_b', elev.b);
  numAttr(node, '@_c', elev.c);
  numAttr(node, '@_d', elev.d);
  return node;
}

function buildSuperelevation(se: OdrSuperelevation): XmlNode {
  const node: XmlNode = {};
  numAttr(node, '@_s', se.s);
  numAttr(node, '@_a', se.a);
  numAttr(node, '@_b', se.b);
  numAttr(node, '@_c', se.c);
  numAttr(node, '@_d', se.d);
  return node;
}

function buildLanes(laneOffsets: OdrLaneOffset[], laneSections: OdrLaneSection[]): XmlNode {
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

function buildObject(obj: OdrRoadObject): XmlNode {
  const node: XmlNode = {
    '@_id': obj.id,
    '@_s': fmtNum(obj.s),
    '@_t': fmtNum(obj.t),
  };
  optAttr(node, '@_name', obj.name);
  optAttr(node, '@_type', obj.type);
  optAttr(node, '@_zOffset', obj.zOffset, fmtNum);
  optAttr(node, '@_hdg', obj.hdg, fmtNum);
  optAttr(node, '@_pitch', obj.pitch, fmtNum);
  optAttr(node, '@_roll', obj.roll, fmtNum);
  optAttr(node, '@_length', obj.length, fmtNum);
  optAttr(node, '@_width', obj.width, fmtNum);
  optAttr(node, '@_height', obj.height, fmtNum);
  optAttr(node, '@_radius', obj.radius, fmtNum);
  optAttr(node, '@_orientation', obj.orientation);
  return node;
}

function buildSignal(sig: OdrSignal): XmlNode {
  const node: XmlNode = {
    '@_id': sig.id,
    '@_s': fmtNum(sig.s),
    '@_t': fmtNum(sig.t),
    '@_orientation': sig.orientation,
  };
  optAttr(node, '@_name', sig.name);
  optAttr(node, '@_zOffset', sig.zOffset, fmtNum);
  optAttr(node, '@_dynamic', sig.dynamic);
  optAttr(node, '@_country', sig.country);
  optAttr(node, '@_type', sig.type);
  optAttr(node, '@_subtype', sig.subtype);
  optAttr(node, '@_value', sig.value, fmtNum);
  optAttr(node, '@_text', sig.text);
  optAttr(node, '@_hOffset', sig.hOffset, fmtNum);
  optAttr(node, '@_pitch', sig.pitch, fmtNum);
  optAttr(node, '@_roll', sig.roll, fmtNum);
  optAttr(node, '@_width', sig.width, fmtNum);
  optAttr(node, '@_height', sig.height, fmtNum);
  return node;
}
