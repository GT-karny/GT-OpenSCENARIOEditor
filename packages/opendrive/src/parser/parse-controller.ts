/**
 * Parse OpenDRIVE controller elements.
 */
import type { OdrController } from '@osce/shared';
import { attrStr, attrOptStr } from './xml-helpers.js';
import { trackNode } from './node-tracker.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseController(raw: Raw): OdrController {
  const t = trackNode(raw);
  const controller: OdrController = {
    id: t.str('id'),
    name: t.str('name'),
    sequence: t.optNum('sequence'),
    controls: (t.takeChildren('control') as Raw[]).map((c) => ({
      signalId: attrStr(c, 'signalId'),
      type: attrOptStr(c, 'type'),
    })),
  };
  const extra = t.rest();
  if (extra) controller.extra = extra;
  return controller;
}
