/**
 * `GtSimPresetsClient` — `/ws/presets/{projectId}` stream client. WP1.
 *
 * Emits `presets_changed` notices when preset files change on disk (external
 * edits), optionally scoped to one scenario via `scenario_stem`.
 */

import type { GtSimPresetsChangedMessage } from './types.js';
import { gtSimPresetsWsUrl } from './types.js';
import { BaseStreamClient } from './base-stream-client.js';
import type { StreamClientOptions } from './base-stream-client.js';

export interface GtSimPresetsClientOptions extends StreamClientOptions {
  projectId: string;
}

export class GtSimPresetsClient extends BaseStreamClient {
  constructor(options: GtSimPresetsClientOptions) {
    super(gtSimPresetsWsUrl(options.wsBaseUrl, options.projectId), options);
  }

  /** Subscribe to external preset-change notices. */
  onPresetsChanged(listener: (msg: GtSimPresetsChangedMessage) => void): () => void {
    return this.onTyped('presets_changed', listener);
  }
}
