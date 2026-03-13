/**
 * Build XML structure for OpenDRIVE <junction> elements.
 */
import type { OdrJunction, OdrJunctionConnection } from '@osce/shared';
import { optAttr } from './format-utils.js';

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

  return node;
}

function buildConnection(conn: OdrJunctionConnection): XmlNode {
  const node: XmlNode = {
    '@_id': conn.id,
    '@_incomingRoad': conn.incomingRoad,
    '@_connectingRoad': conn.connectingRoad,
    '@_contactPoint': conn.contactPoint,
  };

  if (conn.laneLinks.length > 0) {
    node.laneLink = conn.laneLinks.map((ll) => ({
      '@_from': ll.from,
      '@_to': ll.to,
    }));
  }

  return node;
}
