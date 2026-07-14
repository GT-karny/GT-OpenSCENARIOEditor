/**
 * `GtSimOsiClient` — `/ws/osi/{jobId}` stream client. WP1.
 *
 * Receives interleaved `ground_truth` (scene objects + traffic-light phases) and
 * `host_vehicle_data` (ego dynamics) frames. Subscribe to either kind
 * separately, or to both via `onMessage`.
 */

import type {
  GtSimGroundTruthMessage,
  GtSimHostVehicleDataMessage,
  GtSimOsiMessage,
} from './types.js';
import { gtSimOsiWsUrl } from './types.js';
import { BaseStreamClient } from './base-stream-client.js';
import type { StreamClientOptions } from './base-stream-client.js';

export interface GtSimOsiClientOptions extends StreamClientOptions {
  jobId: string;
}

export class GtSimOsiClient extends BaseStreamClient {
  constructor(options: GtSimOsiClientOptions) {
    super(gtSimOsiWsUrl(options.wsBaseUrl, options.jobId), options);
  }

  /** Subscribe to every OSI message (ground_truth + host_vehicle_data). */
  onMessage(listener: (msg: GtSimOsiMessage) => void): () => void {
    return this.conn.onMessage((msg) => {
      if (msg.type === 'ground_truth' || msg.type === 'host_vehicle_data') {
        listener(msg as unknown as GtSimOsiMessage);
      }
    });
  }

  /** Subscribe to `ground_truth` frames only. */
  onGroundTruth(listener: (msg: GtSimGroundTruthMessage) => void): () => void {
    return this.onTyped('ground_truth', listener);
  }

  /** Subscribe to `host_vehicle_data` frames only. */
  onHostVehicleData(listener: (msg: GtSimHostVehicleDataMessage) => void): () => void {
    return this.onTyped('host_vehicle_data', listener);
  }
}
