/**
 * `GtSimSvClient` — `/ws/sv/{jobId}` scenario-variables stream client. WP1.
 *
 * Emits `scenario_variables` snapshots (a `Record` of scenario variable values
 * with a `sim_time`).
 */

import type { GtSimScenarioVariablesMessage } from './types.js';
import { gtSimSvWsUrl } from './types.js';
import { BaseStreamClient } from './base-stream-client.js';
import type { StreamClientOptions } from './base-stream-client.js';

export interface GtSimSvClientOptions extends StreamClientOptions {
  jobId: string;
}

export class GtSimSvClient extends BaseStreamClient {
  constructor(options: GtSimSvClientOptions) {
    super(gtSimSvWsUrl(options.wsBaseUrl, options.jobId), options);
  }

  /** Subscribe to scenario-variables snapshots. */
  onVariables(listener: (msg: GtSimScenarioVariablesMessage) => void): () => void {
    return this.onTyped('scenario_variables', listener);
  }
}
