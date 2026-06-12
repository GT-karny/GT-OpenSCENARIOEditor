/**
 * Parse OpenDRIVE controller elements.
 */
import type { OdrController } from '@osce/shared';
import { ensureArray, attrStr, attrOptNum, attrOptStr } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseController(raw: Raw): OdrController {
  return {
    id: attrStr(raw, 'id'),
    name: attrStr(raw, 'name'),
    sequence: attrOptNum(raw, 'sequence'),
    controls: ensureArray(raw.control).map((c: Raw) => ({
      signalId: attrStr(c, 'signalId'),
      type: attrOptStr(c, 'type'),
    })),
  };
}
