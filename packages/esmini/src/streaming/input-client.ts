/**
 * `GtSimInputClient` — `/ws/input/{jobId}` SEND-only stream client. WP1.
 *
 * Pushes `GtSimInputCommand` (steering/throttle/brake + button bitmask) to the
 * running job. The manual-override panel sends at `GT_SIM_INPUT_SEND_HZ` (30 Hz);
 * use `startSending` to drive that cadence from a live command source, or
 * `sendCommand` for one-off sends.
 */

import type { GtSimInputCommand } from './types.js';
import { GT_SIM_INPUT_SEND_HZ, gtSimInputWsUrl } from './types.js';
import { BaseStreamClient } from './base-stream-client.js';
import type { StreamClientOptions } from './base-stream-client.js';

export interface GtSimInputClientOptions extends StreamClientOptions {
  jobId: string;
}

export class GtSimInputClient extends BaseStreamClient {
  private sendTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: GtSimInputClientOptions) {
    super(gtSimInputWsUrl(options.wsBaseUrl, options.jobId), options);
  }

  /** Send a single input command (no-op while not connected). */
  sendCommand(command: GtSimInputCommand): void {
    this.conn.send(command as unknown as Record<string, unknown>);
  }

  /**
   * Start periodically sending at `GT_SIM_INPUT_SEND_HZ`. `getCommand` is polled
   * each tick for the current command. Returns a stop function; also stopped by
   * `stopSending`/`close`/`dispose`.
   */
  startSending(getCommand: () => GtSimInputCommand): () => void {
    this.stopSending();
    const intervalMs = 1000 / GT_SIM_INPUT_SEND_HZ;
    this.sendTimer = setInterval(() => {
      this.sendCommand(getCommand());
    }, intervalMs);
    return () => this.stopSending();
  }

  /** Stop the periodic sender. */
  stopSending(): void {
    if (this.sendTimer != null) {
      clearInterval(this.sendTimer);
      this.sendTimer = null;
    }
  }

  override close(): void {
    this.stopSending();
    super.close();
  }

  override dispose(): void {
    this.stopSending();
    super.dispose();
  }
}
