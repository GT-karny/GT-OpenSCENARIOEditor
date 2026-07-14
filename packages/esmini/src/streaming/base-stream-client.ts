/**
 * `BaseStreamClient` — shared lifecycle wrapper around a `GtSimWsConnection`.
 * Each of the five GT_Sim streams (OSI/VD/SV/presets/input) extends this and
 * adds its own typed message subscription(s). WP1.
 */

import type { GtSimWsConnectionState } from './types.js';
import { GtSimWsConnection } from './ws-connection.js';
import type { WsFactory } from './ws-connection.js';

/** Common construction options for every stream client. */
export interface StreamClientOptions {
  /** Absolute WS base URL, e.g. `ws://127.0.0.1:8000` (host injected). */
  wsBaseUrl: string;
  /** Auto-reconnect on unexpected close (default `false`). */
  autoReconnect?: boolean;
  /** Initial reconnect delay in ms (default 500). */
  reconnectDelayMs?: number;
  /** Maximum reconnect delay in ms (default 10000). */
  maxReconnectDelayMs?: number;
  /** WebSocket factory (injectable for tests / non-browser hosts). */
  webSocketFactory?: WsFactory;
}

export abstract class BaseStreamClient {
  protected readonly conn: GtSimWsConnection;

  protected constructor(url: string, opts: StreamClientOptions) {
    this.conn = new GtSimWsConnection({
      url,
      autoReconnect: opts.autoReconnect,
      reconnectDelayMs: opts.reconnectDelayMs,
      maxReconnectDelayMs: opts.maxReconnectDelayMs,
      webSocketFactory: opts.webSocketFactory,
    });
  }

  /** Current connection state. */
  get state(): GtSimWsConnectionState {
    return this.conn.state;
  }

  /** Open the stream. */
  connect(): void {
    this.conn.connect();
  }

  /** Close the stream (disables reconnect). */
  close(): void {
    this.conn.close();
  }

  /** Tear down: close + clear all listeners. */
  dispose(): void {
    this.conn.dispose();
  }

  /** Subscribe to connection-state changes. Returns an unsubscribe function. */
  onStateChange(listener: (state: GtSimWsConnectionState) => void): () => void {
    return this.conn.onStateChange(listener);
  }

  /** Subscribe to transport/stream errors. Returns an unsubscribe function. */
  onError(listener: (error: Error) => void): () => void {
    return this.conn.onError(listener);
  }

  /**
   * Subscribe to envelopes whose `type` matches. The narrowing to `T` is by
   * construction: each stream's message contract (streaming/types.ts) ties the
   * `type` discriminant to its payload shape.
   */
  protected onTyped<T>(type: string, listener: (msg: T) => void): () => void {
    return this.conn.onMessage((msg) => {
      if (msg.type === type) {
        listener(msg as unknown as T);
      }
    });
  }
}
