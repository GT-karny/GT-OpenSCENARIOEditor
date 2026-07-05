/**
 * Build XML structure for OpenDRIVE common elements (dataQuality, userData, include).
 */
import type { OdrDataQuality, OdrUserData, OdrInclude } from '@osce/shared';
import { fmtNum, optAttr } from './format-utils.js';
import { applyExtra } from './apply-extra.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

export function buildDataQuality(dq: OdrDataQuality): XmlNode {
  const node: XmlNode = {};
  if (dq.error) {
    node.error = {
      '@_xyAbsolute': fmtNum(dq.error.xyAbsolute),
      '@_zAbsolute': fmtNum(dq.error.zAbsolute),
      '@_xyRelative': fmtNum(dq.error.xyRelative),
      '@_zRelative': fmtNum(dq.error.zRelative),
    };
  }
  if (dq.rawData) {
    const rd: XmlNode = {};
    optAttr(rd, '@_date', dq.rawData.date);
    optAttr(rd, '@_source', dq.rawData.source);
    optAttr(rd, '@_sourceComment', dq.rawData.sourceComment);
    optAttr(rd, '@_postProcessing', dq.rawData.postProcessing);
    optAttr(rd, '@_postProcessingComment', dq.rawData.postProcessingComment);
    node.rawData = rd;
  }
  return node;
}

export function buildUserData(ud: OdrUserData): XmlNode {
  const node: XmlNode = { '@_code': ud.code };
  optAttr(node, '@_value', ud.value);
  return applyExtra(node, ud.extra);
}

export function buildInclude(inc: OdrInclude): XmlNode {
  return { '@_file': inc.file };
}

interface AdditionalDataSource {
  dataQuality?: OdrDataQuality;
  includes?: OdrInclude[];
  userData?: OdrUserData[];
}

/**
 * Append the g_additionalData group children in XSD 1.9 sequence order
 * (dataQuality → include → userData). Every g_additionalData occurrence must
 * emit this order regardless of how the model stores the fields.
 */
export function appendAdditionalData(node: XmlNode, src: AdditionalDataSource): XmlNode {
  if (src.dataQuality) node.dataQuality = buildDataQuality(src.dataQuality);
  if (src.includes && src.includes.length > 0) node.include = src.includes.map(buildInclude);
  if (src.userData && src.userData.length > 0) node.userData = src.userData.map(buildUserData);
  return node;
}
