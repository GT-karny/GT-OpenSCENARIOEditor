/**
 * Build XML structure for OpenDRIVE signal elements.
 */
import type { OdrSignal, OdrSignalRef, OdrLaneValidity } from '@osce/shared';
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
  optAttr(node, '@_countryRevision', sig.countryRevision);
  optAttr(node, '@_type', sig.type);
  optAttr(node, '@_subtype', sig.subtype);
  optAttr(node, '@_value', sig.value, fmtNum);
  optAttr(node, '@_unit', sig.unit);
  optAttr(node, '@_text', sig.text);
  optAttr(node, '@_hOffset', sig.hOffset, fmtNum);
  optAttr(node, '@_pitch', sig.pitch, fmtNum);
  optAttr(node, '@_roll', sig.roll, fmtNum);
  optAttr(node, '@_width', sig.width, fmtNum);
  optAttr(node, '@_height', sig.height, fmtNum);

  // validity
  if (sig.validity && sig.validity.length > 0) {
    node.validity = buildLaneValidityArray(sig.validity);
  }

  // dependency
  if (sig.dependency && sig.dependency.length > 0) {
    node.dependency = sig.dependency.map((d) => {
      const dn: XmlNode = { '@_id': d.id };
      optAttr(dn, '@_type', d.type);
      return dn;
    });
  }

  // reference
  if (sig.reference && sig.reference.length > 0) {
    node.reference = sig.reference.map((r) => {
      const rn: XmlNode = {
        '@_elementType': r.elementType,
        '@_elementId': r.elementId,
      };
      optAttr(rn, '@_type', r.type);
      return rn;
    });
  }

  // positionRoad
  if (sig.positionRoad) {
    const pr = sig.positionRoad;
    const prNode: XmlNode = {
      '@_roadId': pr.roadId,
      '@_s': fmtNum(pr.s),
      '@_t': fmtNum(pr.t),
      '@_zOffset': fmtNum(pr.zOffset),
      '@_hOffset': fmtNum(pr.hOffset),
    };
    optAttr(prNode, '@_pitch', pr.pitch, fmtNum);
    optAttr(prNode, '@_roll', pr.roll, fmtNum);
    node.positionRoad = prNode;
  }

  // positionInertial
  if (sig.positionInertial) {
    const pi = sig.positionInertial;
    const piNode: XmlNode = {
      '@_x': fmtNum(pi.x),
      '@_y': fmtNum(pi.y),
      '@_z': fmtNum(pi.z),
      '@_hdg': fmtNum(pi.hdg),
    };
    optAttr(piNode, '@_pitch', pi.pitch, fmtNum);
    optAttr(piNode, '@_roll', pi.roll, fmtNum);
    node.positionInertial = piNode;
  }

  return node;
}

export function buildSignalRef(ref: OdrSignalRef): XmlNode {
  const node: XmlNode = {
    '@_s': fmtNum(ref.s),
    '@_t': fmtNum(ref.t),
    '@_id': ref.id,
    '@_orientation': ref.orientation,
  };
  if (ref.validity && ref.validity.length > 0) {
    node.validity = buildLaneValidityArray(ref.validity);
  }
  return node;
}

function buildLaneValidityArray(validity: OdrLaneValidity[]): XmlNode[] {
  return validity.map((v) => ({
    '@_fromLane': v.fromLane,
    '@_toLane': v.toLane,
  }));
}
