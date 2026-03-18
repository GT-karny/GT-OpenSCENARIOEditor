/**
 * Build XML structure for OpenDRIVE <road> elements.
 */
import type {
  OdrRoad,
  OdrRoadLink,
  OdrRoadLinkElement,
  OdrRoadTypeEntry,
  OdrGeometry,
  OdrElevation,
  OdrSuperelevation,
} from '@osce/shared';
import { fmtNum, optAttr, numAttr } from './format-utils.js';
import { buildLanes } from './build-lane.js';
import { buildObject, buildObjectReference, buildTunnel, buildBridge } from './build-object.js';
import { buildSignal, buildSignalRef } from './build-signal.js';
import { buildRailroad } from './build-railroad.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

export function buildRoad(road: OdrRoad): XmlNode {
  const node: XmlNode = {
    '@_name': road.name,
    '@_length': fmtNum(road.length),
    '@_id': road.id,
    '@_junction': road.junction,
  };

  if (road.rule != null) {
    node['@_rule'] = road.rule;
  }

  // link
  node.link = buildRoadLink(road.link);

  // type entries
  if (road.type != null && road.type.length > 0) {
    node.type = road.type.map(buildRoadType);
  }

  // planView
  node.planView = {
    geometry: road.planView.map(buildGeometry),
  };

  // elevationProfile
  if (road.elevationProfile.length > 0) {
    node.elevationProfile = {
      elevation: road.elevationProfile.map(buildElevation),
    };
  } else {
    node.elevationProfile = '';
  }

  // lateralProfile
  if (road.lateralProfile.length > 0) {
    node.lateralProfile = {
      superelevation: road.lateralProfile.map(buildSuperelevation),
    };
  } else {
    node.lateralProfile = '';
  }

  // lanes
  node.lanes = buildLanes(road.laneOffset, road.lanes);

  // objects (includes objectReference, tunnel, bridge)
  const hasObjects = road.objects.length > 0;
  const hasObjRefs = road.objectReferences && road.objectReferences.length > 0;
  const hasTunnels = road.tunnels && road.tunnels.length > 0;
  const hasBridges = road.bridges && road.bridges.length > 0;

  if (hasObjects || hasObjRefs || hasTunnels || hasBridges) {
    const objectsNode: XmlNode = {};
    if (hasObjects) {
      objectsNode.object = road.objects.map(buildObject);
    }
    if (hasObjRefs) {
      objectsNode.objectReference = road.objectReferences!.map(buildObjectReference);
    }
    if (hasTunnels) {
      objectsNode.tunnel = road.tunnels!.map(buildTunnel);
    }
    if (hasBridges) {
      objectsNode.bridge = road.bridges!.map(buildBridge);
    }
    node.objects = objectsNode;
  } else {
    node.objects = '';
  }

  // signals (includes signalReference)
  const hasSignals = road.signals.length > 0;
  const hasSigRefs = road.signalReferences && road.signalReferences.length > 0;

  if (hasSignals || hasSigRefs) {
    const signalsNode: XmlNode = {};
    if (hasSignals) {
      signalsNode.signal = road.signals.map(buildSignal);
    }
    if (hasSigRefs) {
      signalsNode.signalReference = road.signalReferences!.map(buildSignalRef);
    }
    node.signals = signalsNode;
  } else {
    node.signals = '';
  }

  // railroad
  if (road.railroad) {
    node.railroad = buildRailroad(road.railroad);
  }

  return node;
}

function buildRoadLink(link: OdrRoadLink | undefined): XmlNode | string {
  if (!link) return '';
  const node: XmlNode = {};
  if (link.predecessor) {
    node.predecessor = buildLinkElement(link.predecessor);
  }
  if (link.successor) {
    node.successor = buildLinkElement(link.successor);
  }
  // Return empty string if no children to produce <link/>
  if (!link.predecessor && !link.successor) return '';
  return node;
}

function buildLinkElement(elem: OdrRoadLinkElement): XmlNode {
  const node: XmlNode = {
    '@_elementType': elem.elementType,
    '@_elementId': elem.elementId,
  };
  optAttr(node, '@_contactPoint', elem.contactPoint);
  return node;
}

function buildRoadType(entry: OdrRoadTypeEntry): XmlNode {
  const node: XmlNode = {
    '@_s': fmtNum(entry.s),
    '@_type': entry.type,
  };
  if (entry.speed) {
    node.speed = {
      '@_max': fmtNum(entry.speed.max),
      '@_unit': entry.speed.unit,
    };
  }
  return node;
}

function buildGeometry(geom: OdrGeometry): XmlNode {
  const node: XmlNode = {
    '@_s': fmtNum(geom.s),
    '@_x': fmtNum(geom.x),
    '@_y': fmtNum(geom.y),
    '@_hdg': fmtNum(geom.hdg),
    '@_length': fmtNum(geom.length),
  };

  switch (geom.type) {
    case 'line':
      node.line = '';
      break;
    case 'arc':
      node.arc = { '@_curvature': fmtNum(geom.curvature ?? 0) };
      break;
    case 'spiral':
      node.spiral = {
        '@_curvStart': fmtNum(geom.curvStart ?? 0),
        '@_curvEnd': fmtNum(geom.curvEnd ?? 0),
      };
      break;
    case 'poly3':
      node.poly3 = {
        '@_a': fmtNum(geom.a ?? 0),
        '@_b': fmtNum(geom.b ?? 0),
        '@_c': fmtNum(geom.c ?? 0),
        '@_d': fmtNum(geom.d ?? 0),
      };
      break;
    case 'paramPoly3':
      node.paramPoly3 = {
        '@_aU': fmtNum(geom.aU ?? 0),
        '@_bU': fmtNum(geom.bU ?? 0),
        '@_cU': fmtNum(geom.cU ?? 0),
        '@_dU': fmtNum(geom.dU ?? 0),
        '@_aV': fmtNum(geom.aV ?? 0),
        '@_bV': fmtNum(geom.bV ?? 0),
        '@_cV': fmtNum(geom.cV ?? 0),
        '@_dV': fmtNum(geom.dV ?? 0),
        '@_pRange': geom.pRange ?? 'arcLength',
      };
      break;
  }

  return node;
}

function buildElevation(elev: OdrElevation): XmlNode {
  const node: XmlNode = {};
  numAttr(node, '@_s', elev.s);
  numAttr(node, '@_a', elev.a);
  numAttr(node, '@_b', elev.b);
  numAttr(node, '@_c', elev.c);
  numAttr(node, '@_d', elev.d);
  return node;
}

function buildSuperelevation(se: OdrSuperelevation): XmlNode {
  const node: XmlNode = {};
  numAttr(node, '@_s', se.s);
  numAttr(node, '@_a', se.a);
  numAttr(node, '@_b', se.b);
  numAttr(node, '@_c', se.c);
  numAttr(node, '@_d', se.d);
  return node;
}
