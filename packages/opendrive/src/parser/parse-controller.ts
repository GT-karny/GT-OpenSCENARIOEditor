/**
 * Parse OpenDRIVE controller elements.
 */
import type { OdrController } from '@osce/shared';
import { ensureArray, toStr, toOptNum, toOptStr } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parseController(raw: Raw): OdrController {
  return {
    id: toStr(raw.id),
    name: toStr(raw.name),
    sequence: toOptNum(raw.sequence),
    controls: ensureArray(raw.control).map((c: Raw) => ({
      signalId: toStr(c.signalId),
      type: toOptStr(c.type),
    })),
  };
}
