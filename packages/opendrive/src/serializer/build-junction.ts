/**
 * Build XML structure for OpenDRIVE <junction> elements.
 */
import type {
  OdrJunction,
  OdrJunctionConnection,
  OdrJunctionCrossPath,
  OdrJunctionCrossPathLaneLink,
  OdrJunctionRoadSection,
  OdrJunctionGroup,
} from '@osce/shared';
import { fmtNum, optAttr } from './format-utils.js';
import { applyExtra } from './apply-extra.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

export function buildJunction(junction: OdrJunction): XmlNode {
  const node: XmlNode = {
    '@_id': junction.id,
    '@_name': junction.name,
  };

  optAttr(node, '@_type', junction.type);

  // Virtual junction attributes (t_junction_virtual)
  optAttr(node, '@_mainRoad', junction.mainRoad);
  optAttr(node, '@_sStart', junction.sStart, fmtNum);
  optAttr(node, '@_sEnd', junction.sEnd, fmtNum);
  optAttr(node, '@_orientation', junction.orientation);

  if (junction.connections.length > 0) {
    node.connection = junction.connections.map(buildConnection);
  }

  // crossPath (common/virtual) then roadSection (crossing) — XSD child order.
  if (junction.crossPaths && junction.crossPaths.length > 0) {
    node.crossPath = junction.crossPaths.map(buildCrossPath);
  }
  if (junction.roadSections && junction.roadSections.length > 0) {
    node.roadSection = junction.roadSections.map(buildRoadSection);
  }

  // priority — XSD 1.9 makes both @high and @low required (use="required"),
  // so always emit both sides (empty string for a missing side rather than
  // dropping the attribute, which would be schema-invalid).
  if (junction.priority && junction.priority.length > 0) {
    node.priority = junction.priority.map((p) => ({
      '@_high': p.high ?? '',
      '@_low': p.low ?? '',
    }));
  }

  // controller
  if (junction.controller && junction.controller.length > 0) {
    node.controller = junction.controller.map((c) => {
      const cn: XmlNode = { '@_id': c.id };
      optAttr(cn, '@_type', c.type);
      optAttr(cn, '@_sequence', c.sequence);
      return cn;
    });
  }

  // surface
  if (junction.surface?.crg && junction.surface.crg.length > 0) {
    node.surface = {
      CRG: junction.surface.crg.map((crg) => {
        const cn: XmlNode = { '@_file': crg.file };
        optAttr(cn, '@_sStart', crg.sStart, fmtNum);
        optAttr(cn, '@_sEnd', crg.sEnd, fmtNum);
        optAttr(cn, '@_orientation', crg.orientation);
        optAttr(cn, '@_mode', crg.mode);
        optAttr(cn, '@_purpose', crg.purpose);
        optAttr(cn, '@_sOffset', crg.sOffset, fmtNum);
        optAttr(cn, '@_tOffset', crg.tOffset, fmtNum);
        optAttr(cn, '@_zOffset', crg.zOffset, fmtNum);
        optAttr(cn, '@_zScale', crg.zScale, fmtNum);
        optAttr(cn, '@_hOffset', crg.hOffset, fmtNum);
        return cn;
      }),
    };
  }

  return applyExtra(node, junction.extra);
}

function buildConnection(conn: OdrJunctionConnection): XmlNode {
  const node: XmlNode = {
    '@_id': conn.id,
    '@_incomingRoad': conn.incomingRoad,
    '@_connectingRoad': conn.connectingRoad,
    '@_contactPoint': conn.contactPoint,
  };

  optAttr(node, '@_type', conn.type);

  if (conn.laneLinks.length > 0) {
    node.laneLink = conn.laneLinks.map((ll) => {
      const ln: XmlNode = { '@_from': ll.from, '@_to': ll.to };
      optAttr(ln, '@_overlapZone', ll.overlapZone, fmtNum);
      optAttr(ln, '@_fromLayer', ll.fromLayer);
      optAttr(ln, '@_toLayer', ll.toLayer);
      return applyExtra(ln, ll.extra);
    });
  }

  // predecessor
  if (conn.predecessor) {
    node.predecessor = {
      '@_elementType': conn.predecessor.elementType,
      '@_elementId': conn.predecessor.elementId,
      '@_elementS': fmtNum(conn.predecessor.elementS),
      '@_elementDir': conn.predecessor.elementDir,
    };
  }

  // successor
  if (conn.successor) {
    node.successor = {
      '@_elementType': conn.successor.elementType,
      '@_elementId': conn.successor.elementId,
      '@_elementS': fmtNum(conn.successor.elementS),
      '@_elementDir': conn.successor.elementDir,
    };
  }

  return applyExtra(node, conn.extra);
}

function buildCrossPath(cp: OdrJunctionCrossPath): XmlNode {
  const node: XmlNode = {};
  optAttr(node, '@_crossingRoad', cp.crossingRoad);
  optAttr(node, '@_id', cp.id);
  optAttr(node, '@_roadAtEnd', cp.roadAtEnd);
  optAttr(node, '@_roadAtStart', cp.roadAtStart);
  node.startLaneLink = buildCrossPathLaneLink(cp.startLaneLink);
  node.endLaneLink = buildCrossPathLaneLink(cp.endLaneLink);
  return applyExtra(node, cp.extra);
}

function buildCrossPathLaneLink(link: OdrJunctionCrossPathLaneLink): XmlNode {
  const node: XmlNode = {};
  optAttr(node, '@_s', link.s, fmtNum);
  optAttr(node, '@_from', link.from);
  optAttr(node, '@_to', link.to);
  return applyExtra(node, link.extra);
}

function buildRoadSection(rs: OdrJunctionRoadSection): XmlNode {
  const node: XmlNode = {};
  optAttr(node, '@_id', rs.id);
  optAttr(node, '@_roadId', rs.roadId);
  optAttr(node, '@_sStart', rs.sStart, fmtNum);
  optAttr(node, '@_sEnd', rs.sEnd, fmtNum);
  return applyExtra(node, rs.extra);
}

export function buildJunctionGroup(group: OdrJunctionGroup): XmlNode {
  const node: XmlNode = {
    '@_id': group.id,
    '@_type': group.type,
  };
  optAttr(node, '@_name', group.name);
  if (group.junctionReferences.length > 0) {
    node.junctionReference = group.junctionReferences.map((jr) => ({
      '@_junction': jr,
    }));
  }
  return node;
}
