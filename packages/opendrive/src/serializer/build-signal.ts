/**
 * Build XML structure for OpenDRIVE signal elements.
 */
import type { OdrSignal } from '@osce/shared';
import { fmtNum, optAttr } from './format-utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

export function buildSignal(sig: OdrSignal): XmlNode {
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
