// Client → Server
export type WsClientMessage = { type: 'ping' } | { type: string };

// Server → Client
export type WsServerMessage =
  | { type: 'pong' }
  | { type: 'error'; payload: { error: string } };
