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
  const fileService = app.fileService;
  const scenarioService = app.scenarioService;
  const simulationService = app.simulationService;

  // Subscribe to simulation events and broadcast to all clients
  simulationService.onFrame((frame) => {
    broadcast({ type: 'simulation:frame', payload: frame });
  });

  simulationService.onComplete((result) => {
    broadcast({ type: 'simulation:complete', payload: result });
  });

  function broadcast(message: WsServerMessage): void {
    const data = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === WS_OPEN) {
        client.send(data);
      }
    }
  }

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
        send(ws, { type: 'file:error', payload: { error: 'Invalid JSON message' } });
        return;
      }

      try {
        switch (msg.type) {
          case 'ping':
            send(ws, { type: 'pong' });
            break;

          case 'simulation:start':
            await simulationService.startSimulation(msg.payload);
            send(ws, {
              type: 'simulation:status',
              payload: { status: simulationService.getStatus().status },
            });
            break;

          case 'simulation:stop':
            await simulationService.stopCurrentSimulation();
            send(ws, {
              type: 'simulation:status',
              payload: { status: simulationService.getStatus().status },
            });
            break;

          case 'simulation:status':
            send(ws, {
              type: 'simulation:status',
              payload: { status: simulationService.getStatus().status },
            });
            break;

          case 'file:open': {
            const { filePath, fileType } = msg.payload;
            const xml = await fileService.readFile(filePath);
            const doc =
              fileType === 'xosc' ? scenarioService.parseXosc(xml) : scenarioService.parseXodr(xml);
            send(ws, { type: 'file:opened', payload: doc });
            break;
          }

          case 'file:save': {
            const { filePath, document } = msg.payload;
            const xml = scenarioService.serializeXosc(document);
            await fileService.writeFile(filePath, xml);
            send(ws, { type: 'file:saved', payload: { success: true } });
            break;
          }

          default:
            send(ws, {
              type: 'file:error',
              payload: { error: `Unknown message type: ${(msg as { type: string }).type}` },
            });
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        send(ws, { type: 'file:error', payload: { error } });
      }
    });

    socket.on('close', () => {
      clients.delete(ws);
    });
  });
}
