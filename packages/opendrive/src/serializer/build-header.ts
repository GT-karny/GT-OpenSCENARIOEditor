/**
 * Build XML structure for OpenDRIVE <header> element.
 */
import type { OdrHeader } from '@osce/shared';
import { fmtNum, optAttr } from './format-utils.js';
import { buildUserData, buildDataQuality, buildInclude } from './build-common.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

export function buildHeader(header: OdrHeader): XmlNode {
  const node: XmlNode = {
    '@_revMajor': header.revMajor,
    '@_revMinor': header.revMinor,
    '@_name': header.name,
    '@_date': header.date,
  };

  optAttr(node, '@_north', header.north, fmtNum);
  optAttr(node, '@_south', header.south, fmtNum);
  optAttr(node, '@_east', header.east, fmtNum);
  optAttr(node, '@_west', header.west, fmtNum);

  if (header.geoReference != null) {
    node.geoReference = { __cdata: header.geoReference };
  }

  if (header.offset) {
    node.offset = {
      '@_x': fmtNum(header.offset.x),
      '@_y': fmtNum(header.offset.y),
      '@_z': fmtNum(header.offset.z),
      '@_hdg': fmtNum(header.offset.hdg),
    };
  }

  // userData / dataQuality / include (lossless round-trip, XSD-correct positions at end of header element)
  if (header.userData && header.userData.length > 0) {
    node.userData = header.userData.map(buildUserData);
  }
  if (header.dataQuality) {
    node.dataQuality = buildDataQuality(header.dataQuality);
  }
  if (header.includes && header.includes.length > 0) {
    node.include = header.includes.map(buildInclude);
  }

  return node;
}
