/**
 * Build XML structure for OpenDRIVE <junction> elements.
 */
import type { OdrJunction, OdrJunctionConnection, OdrJunctionGroup } from '@osce/shared';
import { fmtNum, optAttr } from './format-utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

export function buildJunction(junction: OdrJunction): XmlNode {
  const node: XmlNode = {
    '@_id': junction.id,
    '@_name': junction.name,
  };

  optAttr(node, '@_type', junction.type);

  if (junction.connections.length > 0) {
    node.connection = junction.connections.map(buildConnection);
  }

  // priority
  if (junction.priority && junction.priority.length > 0) {
    node.priority = junction.priority.map((p) => {
      const pn: XmlNode = {};
      optAttr(pn, '@_high', p.high);
      optAttr(pn, '@_low', p.low);
      return pn;
    });
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

  return node;
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
    node.laneLink = conn.laneLinks.map((ll) => ({
      '@_from': ll.from,
      '@_to': ll.to,
    }));
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

  return node;
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
