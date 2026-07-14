import type { WsLike } from '../../streaming/ws-connection.js';

/** Minimal scriptable fake WebSocket shared by the WP1 streaming tests. */
export class FakeWebSocket implements WsLike {
  static instances: FakeWebSocket[] = [];
  readonly url: string;
  readyState = 0;
  sent: string[] = [];
  closed = false;
  onopen: ((this: unknown, ev: unknown) => unknown) | null = null;
  onclose: ((this: unknown, ev: unknown) => unknown) | null = null;
  onerror: ((this: unknown, ev: unknown) => unknown) | null = null;
  onmessage: ((this: unknown, ev: { data: unknown }) => unknown) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.closed = true;
    this.readyState = 3;
    this.onclose?.(undefined);
  }

  // --- Test helpers ---

  open(): void {
    this.readyState = 1;
    this.onopen?.(undefined);
  }

  message(payload: unknown): void {
    this.onmessage?.({ data: typeof payload === 'string' ? payload : JSON.stringify(payload) });
  }

  fail(): void {
    this.onerror?.(undefined);
  }

  serverClose(): void {
    this.readyState = 3;
    this.onclose?.(undefined);
  }
}

/** Factory for injecting FakeWebSocket into connections/clients. */
export const fakeWsFactory = (url: string) => new FakeWebSocket(url);

/** The most recently constructed fake socket. */
export const lastFakeWs = (): FakeWebSocket =>
  FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
