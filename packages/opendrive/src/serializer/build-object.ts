/**
 * Build XML structure for OpenDRIVE road object elements.
 */
import type { OdrRoadObject } from '@osce/shared';
import { fmtNum, optAttr } from './format-utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

export function buildObject(obj: OdrRoadObject): XmlNode {
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
