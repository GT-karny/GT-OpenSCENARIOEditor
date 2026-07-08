/**
 * Build XML structure for OpenDRIVE <header> element.
 */
import type { OdrHeader } from '@osce/shared';
import { fmtNum, optAttr } from './format-utils.js';
import { appendAdditionalData } from './build-common.js';
import { applyExtra } from './apply-extra.js';

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
  optAttr(node, '@_version', header.version);
  optAttr(node, '@_vendor', header.vendor);

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

  // XSD t_header sequence: geoReference, offset, license, g_additionalData,
  // defaultRegulations. <license> and <defaultRegulations> are unmodeled and
  // ride through `extra`; emit <license> here so it precedes the additionalData
  // group (applyExtra then skips it as already-present), leaving
  // <defaultRegulations> to trail after the group.
  const license = header.extra?.children?.find((c) => c.name === 'license');
  if (license) node.license = license.raw;

  // g_additionalData: dataQuality → include → userData
  appendAdditionalData(node, {
    dataQuality: header.dataQuality,
    includes: header.includes,
    userData: header.userData,
  });

  // Re-emit remaining unmodeled header children (1.9 <defaultRegulations>).
  return applyExtra(node, header.extra);
}
