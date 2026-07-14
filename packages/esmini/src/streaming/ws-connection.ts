/**
 * `GtSimWsConnection` — the shared WebSocket connection base for all five GT_Sim
 * live streams (OSI/VD/SV/presets/input). WP1.
 *
 * React-free (this package has no React dependency): the fork's
 * `useWebSocketStream` hook is reimplemented here as a pure-TS class with a
 * subscribe API. Phase 2 wraps this in React hooks in `apps/web`.
 *
 * Responsibilities:
 *  - connection lifecycle + state machine (`GtSimWsConnectionState` per the
 *    frozen `streaming/types.ts` contract),
 *  - JSON envelope parsing with `type: 'end'` (stream complete) and truthy
 *    `error` (stream-level error) handling,
 *  - optional auto-reconnect with exponential backoff (off by default; a
 *    backend-signalled `end`/`error` never reconnects).
 *
 * The URL is INJECTED (built by the `gtSim*WsUrl` helpers). The `WebSocket`
 * implementation is injectable for tests / non-browser hosts.
 */

import type { GtSimWsConnectionState, GtSimWsEnvelope } from './types.js';

/** Minimal structural type for the subset of `WebSocket` this class uses. */
export interface WsLike {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  onopen: ((this: unknown, ev: unknown) => unknown) | null;
  onclose: ((this: unknown, ev: unknown) => unknown) | null;
  onerror: ((this: unknown, ev: unknown) => unknown) | null;
  onmessage: ((this: unknown, ev: { data: unknown }) => unknown) | null;
  readyState: number;
}

/** Constructor shape for an injectable WebSocket implementation. */
export type WsFactory = (url: string) => WsLike;

export interface GtSimWsConnectionOptions {
  /** Absolute WS URL (use the `gtSim*WsUrl` builders). */
  url: string;
  /** Auto-reconnect on unexpected close (default `false`). */
  autoReconnect?: boolean;
  /** Initial reconnect delay in ms (default 500). */
  reconnectDelayMs?: number;
  /** Maximum reconnect delay in ms (default 10000). */
  maxReconnectDelayMs?: number;
  /**
   * WebSocket factory. Defaults to `(url) => new WebSocket(url)`. Injectable so
   * tests can supply a fake and non-browser hosts can plug in a polyfill.
   */
  webSocketFactory?: WsFactory;
}

type MessageListener = (msg: GtSimWsEnvelope) => void;
type StateListener = (state: GtSimWsConnectionState) => void;
type ErrorListener = (error: Error) => void;

export class GtSimWsConnection {
  private readonly url: string;
  private readonly autoReconnect: boolean;
  private readonly reconnectDelayMs: number;
  private readonly maxReconnectDelayMs: number;
  private readonly factory: WsFactory;

  private ws: WsLike | null = null;
  private _state: GtSimWsConnectionState = 'disconnected';
  private closedByUser = false;
  private ended = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly messageListeners = new Set<MessageListener>();
  private readonly stateListeners = new Set<StateListener>();
  private readonly errorListeners = new Set<ErrorListener>();

  constructor(options: GtSimWsConnectionOptions) {
    this.url = options.url;
    this.autoReconnect = options.autoReconnect ?? false;
    this.reconnectDelayMs = options.reconnectDelayMs ?? 500;
    this.maxReconnectDelayMs = options.maxReconnectDelayMs ?? 10_000;
    this.factory =
      options.webSocketFactory ??
      ((url: string) => new WebSocket(url) as unknown as WsLike);
  }

  /** Current connection state. */
  get state(): GtSimWsConnectionState {
    return this._state;
  }

  /** Open the connection. Idempotent while already open/connecting. */
  connect(): void {
    if (this.ws && (this._state === 'connecting' || this._state === 'connected')) {
      return;
    }
    // A reconnect may be pending (backoff, this.ws === null). Cancel it so an
    // explicit connect() cannot race the timer into a second socket.
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.closedByUser = false;
    this.ended = false;
    this.openSocket();
  }

  private openSocket(): void {
    this.setState('connecting');
    let ws: WsLike;
    try {
      ws = this.factory(this.url);
    } catch (err) {
      this.setState('error');
      this.emitError(asError(err));
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setState('connected');
    };

    ws.onmessage = (event: { data: unknown }) => {
      this.handleMessage(event.data);
    };

    ws.onerror = () => {
      this.setState('error');
      this.emitError(new Error(`GT_Sim WS error: ${this.url}`));
    };

    ws.onclose = () => {
      this.ws = null;
      if (this.closedByUser) {
        this.setState('disconnected');
        return;
      }
      if (this.ended) {
        // Backend-signalled termination: a stream-level `error` state stays
        // sticky through the subsequent socket close; a clean `end` reads as
        // disconnected.
        if (this._state !== 'error') this.setState('disconnected');
        return;
      }
      // Unexpected close: reconnect if enabled, otherwise disconnected.
      if (this.autoReconnect) {
        this.scheduleReconnect();
      } else {
        this.setState('disconnected');
      }
    };
  }

  private handleMessage(data: unknown): void {
    let msg: GtSimWsEnvelope;
    try {
      msg = JSON.parse(typeof data === 'string' ? data : String(data)) as GtSimWsEnvelope;
    } catch {
      // Ignore malformed frames (matches the fork).
      return;
    }

    if (msg.type === 'end') {
      // Backend signalled stream completion — do not reconnect.
      this.ended = true;
      this.setState('disconnected');
      this.closeSocket();
      return;
    }

    if (msg.error) {
      // Backend signalled a stream-level error — terminal, no reconnect.
      this.ended = true;
      this.setState('error');
      this.emitError(new Error(`GT_Sim WS stream error: ${stringifyError(msg.error)}`));
      this.closeSocket();
      return;
    }

    for (const listener of this.messageListeners) listener(msg);
  }

  /** Send a payload. Objects are JSON-stringified. No-op if not connected. */
  send(payload: string | Record<string, unknown>): void {
    if (!this.ws || this._state !== 'connected') return;
    this.ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
  }

  /** Close the connection and disable reconnect. */
  close(): void {
    this.closedByUser = true;
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.closeSocket();
    this.setState('disconnected');
  }

  private closeSocket(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.closedByUser || this.ended || !this.autoReconnect) return;
    const delay = Math.min(
      this.maxReconnectDelayMs,
      this.reconnectDelayMs * 2 ** this.reconnectAttempts,
    );
    this.reconnectAttempts += 1;
    this.setState('connecting');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.closedByUser || this.ended) return;
      this.openSocket();
    }, delay);
  }

  private setState(state: GtSimWsConnectionState): void {
    if (this._state === state) return;
    this._state = state;
    for (const listener of this.stateListeners) listener(state);
  }

  private emitError(error: Error): void {
    for (const listener of this.errorListeners) listener(error);
  }

  /** Subscribe to parsed (non-envelope-control) messages. */
  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  /** Subscribe to connection-state changes. */
  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /** Subscribe to transport/stream errors. */
  onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /** Tear down: close socket + clear all listeners. */
  dispose(): void {
    this.close();
    this.messageListeners.clear();
    this.stateListeners.clear();
    this.errorListeners.clear();
  }
}

function asError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

function stringifyError(error: unknown): string {
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
