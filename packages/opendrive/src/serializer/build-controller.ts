/**
 * Build XML structure for OpenDRIVE <controller> elements.
 */
import type { OdrController } from '@osce/shared';
import { optAttr } from './format-utils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

export function buildController(controller: OdrController): XmlNode {
  const node: XmlNode = {
    '@_id': controller.id,
    '@_name': controller.name,
  };

  optAttr(node, '@_sequence', controller.sequence);

  if (controller.controls.length > 0) {
    node.control = controller.controls.map((c) => {
      const cn: XmlNode = {
        '@_signalId': c.signalId,
      };
      optAttr(cn, '@_type', c.type);
      return cn;
    });
  }

  return node;
}
