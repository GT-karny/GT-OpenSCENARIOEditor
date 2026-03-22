/**
 * Build XML structure for OpenDRIVE road object elements.
 */
import type {
  OdrRoadObject,
  OdrObjectReference,
  OdrTunnel,
  OdrBridge,
  OdrLaneValidity,
} from '@osce/shared';
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
  optAttr(node, '@_subtype', obj.subtype);
  optAttr(node, '@_dynamic', obj.dynamic);
  optAttr(node, '@_zOffset', obj.zOffset, fmtNum);
  optAttr(node, '@_validLength', obj.validLength, fmtNum);
  optAttr(node, '@_hdg', obj.hdg, fmtNum);
  optAttr(node, '@_pitch', obj.pitch, fmtNum);
  optAttr(node, '@_roll', obj.roll, fmtNum);
  optAttr(node, '@_length', obj.length, fmtNum);
  optAttr(node, '@_width', obj.width, fmtNum);
  optAttr(node, '@_height', obj.height, fmtNum);
  optAttr(node, '@_radius', obj.radius, fmtNum);
  optAttr(node, '@_orientation', obj.orientation);

  // repeat
  if (obj.repeat && obj.repeat.length > 0) {
    node.repeat = obj.repeat.map((r) => {
      const rn: XmlNode = {
        '@_s': fmtNum(r.s),
        '@_length': fmtNum(r.length),
        '@_distance': fmtNum(r.distance),
        '@_tStart': fmtNum(r.tStart),
        '@_tEnd': fmtNum(r.tEnd),
        '@_heightStart': fmtNum(r.heightStart),
        '@_heightEnd': fmtNum(r.heightEnd),
        '@_zOffsetStart': fmtNum(r.zOffsetStart),
        '@_zOffsetEnd': fmtNum(r.zOffsetEnd),
      };
      optAttr(rn, '@_widthStart', r.widthStart, fmtNum);
      optAttr(rn, '@_widthEnd', r.widthEnd, fmtNum);
      optAttr(rn, '@_lengthStart', r.lengthStart, fmtNum);
      optAttr(rn, '@_lengthEnd', r.lengthEnd, fmtNum);
      optAttr(rn, '@_radiusStart', r.radiusStart, fmtNum);
      optAttr(rn, '@_radiusEnd', r.radiusEnd, fmtNum);
      return rn;
    });
  }

  // outline (single)
  if (obj.outline) {
    node.outline = buildOutline(obj.outline);
  }

  // outlines (wrapper)
  if (obj.outlines && obj.outlines.length > 0) {
    node.outlines = {
      outline: obj.outlines.map(buildOutline),
    };
  }

  // material
  if (obj.material && obj.material.length > 0) {
    node.material = obj.material.map((m) => {
      const mn: XmlNode = {};
      optAttr(mn, '@_surface', m.surface);
      optAttr(mn, '@_friction', m.friction, fmtNum);
      optAttr(mn, '@_roughness', m.roughness, fmtNum);
      return mn;
    });
  }

  // validity
  if (obj.validity && obj.validity.length > 0) {
    node.validity = buildLaneValidityArray(obj.validity);
  }

  // parkingSpace
  if (obj.parkingSpace) {
    const psNode: XmlNode = { '@_access': obj.parkingSpace.access };
    optAttr(psNode, '@_restrictions', obj.parkingSpace.restrictions);
    node.parkingSpace = psNode;
  }

  // markings
  if (obj.markings && obj.markings.length > 0) {
    node.markings = {
      marking: obj.markings.map((m) => {
        const mn: XmlNode = {
          '@_side': m.side,
          '@_color': m.color,
          '@_spaceLength': fmtNum(m.spaceLength),
          '@_lineLength': fmtNum(m.lineLength),
          '@_startOffset': fmtNum(m.startOffset),
          '@_stopOffset': fmtNum(m.stopOffset),
        };
        optAttr(mn, '@_weight', m.weight);
        optAttr(mn, '@_width', m.width, fmtNum);
        optAttr(mn, '@_zOffset', m.zOffset, fmtNum);
        if (m.cornerReferences.length > 0) {
          mn.cornerReference = m.cornerReferences.map((cr) => ({ '@_id': cr }));
        }
        return mn;
      }),
    };
  }

  // borders
  if (obj.borders && obj.borders.length > 0) {
    node.borders = {
      border: obj.borders.map((b) => {
        const bn: XmlNode = {
          '@_outlineId': b.outlineId,
          '@_type': b.type,
          '@_width': fmtNum(b.width),
        };
        if (b.useCompleteOutline != null) {
          bn['@_useCompleteOutline'] = b.useCompleteOutline ? 'true' : 'false';
        }
        if (b.cornerReferences.length > 0) {
          bn.cornerReference = b.cornerReferences.map((cr) => ({ '@_id': cr }));
        }
        return bn;
      }),
    };
  }

  return node;
}

function buildOutline(outline: {
  id?: string;
  fillType?: string;
  outer?: boolean;
  closed?: boolean;
  laneType?: string;
  cornerRoad?: { s: number; t: number; dz: number; height: number; id?: number }[];
  cornerLocal?: { u: number; v: number; z: number; height: number; id?: number }[];
}): XmlNode {
  const node: XmlNode = {};
  optAttr(node, '@_id', outline.id);
  optAttr(node, '@_fillType', outline.fillType);
  if (outline.outer != null) node['@_outer'] = outline.outer ? 'true' : 'false';
  if (outline.closed != null) node['@_closed'] = outline.closed ? 'true' : 'false';
  optAttr(node, '@_laneType', outline.laneType);

  if (outline.cornerRoad && outline.cornerRoad.length > 0) {
    node.cornerRoad = outline.cornerRoad.map((c) => {
      const cn: XmlNode = {
        '@_s': fmtNum(c.s),
        '@_t': fmtNum(c.t),
        '@_dz': fmtNum(c.dz),
        '@_height': fmtNum(c.height),
      };
      optAttr(cn, '@_id', c.id);
      return cn;
    });
  }

  if (outline.cornerLocal && outline.cornerLocal.length > 0) {
    node.cornerLocal = outline.cornerLocal.map((c) => {
      const cn: XmlNode = {
        '@_u': fmtNum(c.u),
        '@_v': fmtNum(c.v),
        '@_z': fmtNum(c.z),
        '@_height': fmtNum(c.height),
      };
      optAttr(cn, '@_id', c.id);
      return cn;
    });
  }

  return node;
}

export function buildObjectReference(ref: OdrObjectReference): XmlNode {
  const node: XmlNode = {
    '@_s': fmtNum(ref.s),
    '@_t': fmtNum(ref.t),
    '@_id': ref.id,
  };
  optAttr(node, '@_zOffset', ref.zOffset, fmtNum);
  optAttr(node, '@_validLength', ref.validLength, fmtNum);
  optAttr(node, '@_orientation', ref.orientation);
  if (ref.validity && ref.validity.length > 0) {
    node.validity = buildLaneValidityArray(ref.validity);
  }
  return node;
}

export function buildTunnel(tunnel: OdrTunnel): XmlNode {
  const node: XmlNode = {
    '@_s': fmtNum(tunnel.s),
    '@_length': fmtNum(tunnel.length),
    '@_id': tunnel.id,
    '@_type': tunnel.type,
  };
  optAttr(node, '@_name', tunnel.name);
  optAttr(node, '@_lighting', tunnel.lighting, fmtNum);
  optAttr(node, '@_daylight', tunnel.daylight, fmtNum);
  if (tunnel.validity && tunnel.validity.length > 0) {
    node.validity = buildLaneValidityArray(tunnel.validity);
  }
  return node;
}

export function buildBridge(bridge: OdrBridge): XmlNode {
  const node: XmlNode = {
    '@_s': fmtNum(bridge.s),
    '@_length': fmtNum(bridge.length),
    '@_id': bridge.id,
    '@_type': bridge.type,
  };
  optAttr(node, '@_name', bridge.name);
  if (bridge.validity && bridge.validity.length > 0) {
    node.validity = buildLaneValidityArray(bridge.validity);
  }
  return node;
}

function buildLaneValidityArray(validity: OdrLaneValidity[]): XmlNode[] {
  return validity.map((v) => ({
    '@_fromLane': v.fromLane,
    '@_toLane': v.toLane,
  }));
}
