import type { FastifyInstance } from 'fastify';
import type { WsClientMessage, WsServerMessage } from './ws-messages.js';

interface WsLike {
  readyState: number;
  send(data: string): void;
  on(event: string, listener: (...args: unknown[]) => void): void;
}

const WS_OPEN = 1;

export async function wsHandler(app: FastifyInstance): Promise<void> {
  const clients = new Set<WsLike>();

  function broadcast(message: WsServerMessage): void {
    const data = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === WS_OPEN) {
        client.send(data);
      }
    }
  }

  // broadcast is retained for future server-push notifications
  void broadcast;

  function send(ws: WsLike, message: WsServerMessage): void {
    if (ws.readyState === WS_OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  app.get('/ws', { websocket: true }, (socket) => {
    const ws = socket as unknown as WsLike;
    clients.add(ws);

    socket.on('message', async (raw: unknown) => {
      let msg: WsClientMessage;
      try {
        msg = JSON.parse(String(raw)) as WsClientMessage;
      } catch {
        send(ws, { type: 'error', payload: { error: 'Invalid JSON message' } });
        return;
      }

      switch (msg.type) {
        case 'ping':
          send(ws, { type: 'pong' });
          break;

        default:
          send(ws, {
            type: 'error',
            payload: { error: `Unknown message type: ${(msg as { type: string }).type}` },
          });
      }
    });

    socket.on('close', () => {
      clients.delete(ws);
    });
  });
}
