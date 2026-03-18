/**
 * Build XML structure for OpenDRIVE railroad elements.
 */
import type { OdrRailroad, OdrStation } from '@osce/shared';
import { fmtNum, optAttr } from './format-utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

export function buildRailroad(railroad: OdrRailroad): XmlNode {
  const node: XmlNode = {};

  if (railroad.switches && railroad.switches.length > 0) {
    node.switch = railroad.switches.map((sw) => {
      const swNode: XmlNode = {
        '@_name': sw.name,
        '@_id': sw.id,
        '@_position': sw.position,
        mainTrack: {
          '@_id': sw.mainTrack.id,
          '@_s': fmtNum(sw.mainTrack.s),
          '@_dir': sw.mainTrack.dir,
        },
        sideTrack: {
          '@_id': sw.sideTrack.id,
          '@_s': fmtNum(sw.sideTrack.s),
          '@_dir': sw.sideTrack.dir,
        },
      };
      if (sw.partner) {
        const partnerNode: XmlNode = { '@_id': sw.partner.id };
        optAttr(partnerNode, '@_name', sw.partner.name);
        swNode.partner = partnerNode;
      }
      return swNode;
    });
  }

  return node;
}

export function buildStation(station: OdrStation): XmlNode {
  const node: XmlNode = {
    '@_name': station.name,
    '@_id': station.id,
  };
  optAttr(node, '@_type', station.type);

  if (station.platforms.length > 0) {
    node.platform = station.platforms.map((pl) => {
      const plNode: XmlNode = {
        '@_id': pl.id,
      };
      optAttr(plNode, '@_name', pl.name);
      if (pl.segments.length > 0) {
        plNode.segment = pl.segments.map((seg) => ({
          '@_roadId': seg.roadId,
          '@_sStart': fmtNum(seg.sStart),
          '@_sEnd': fmtNum(seg.sEnd),
          '@_side': seg.side,
        }));
      }
      return plNode;
    });
  }

  return node;
}
