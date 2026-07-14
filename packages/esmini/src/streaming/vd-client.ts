/**
 * `GtSimVdClient` — `/ws/vd/{jobId}` VirtualDriver telemetry stream client. WP1.
 *
 * Emits `virtual_driver_telemetry` frames whose payload is a `VdTelemetryFrame`
 * (same shape as recorded replay, so live and replay drive the same overlays).
 */

import type { VdTelemetryFrame } from '../client/gt-sim-api-types.js';
import type { GtSimVdMessage } from './types.js';
import { gtSimVdWsUrl } from './types.js';
import { BaseStreamClient } from './base-stream-client.js';
import type { StreamClientOptions } from './base-stream-client.js';

export interface GtSimVdClientOptions extends StreamClientOptions {
  jobId: string;
}

export class GtSimVdClient extends BaseStreamClient {
  constructor(options: GtSimVdClientOptions) {
    super(gtSimVdWsUrl(options.wsBaseUrl, options.jobId), options);
  }

  /** Subscribe to VirtualDriver telemetry frames. */
  onTelemetry(listener: (frame: VdTelemetryFrame) => void): () => void {
    return this.onTyped<GtSimVdMessage>('virtual_driver_telemetry', listener);
  }
}
