/**
 * OpenDRIVE controller types.
 */

import type { OdrExtra } from './odr-common.js';

export interface OdrController {
  id: string;
  name: string;
  sequence?: number;
  controls: { signalId: string; type?: string }[];
  /** Unmodeled controller attrs/children preserved for round-trip. */
  extra?: OdrExtra;
}
