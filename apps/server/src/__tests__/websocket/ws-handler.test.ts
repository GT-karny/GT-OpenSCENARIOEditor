import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../app.js';
import type { FastifyInstance } from 'fastify';

describe('WebSocket Handler', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should respond with pong to ping', async () => {
    const ws = await app.injectWS('/ws');

    const response = await new Promise<string>((resolve) => {
      ws.on('message', (data: unknown) => {
        resolve(String(data));
      });
      ws.send(JSON.stringify({ type: 'ping' }));
    });

    const msg = JSON.parse(response);
    expect(msg.type).toBe('pong');
    ws.close();
  });

  it('should return error for invalid JSON', async () => {
    const ws = await app.injectWS('/ws');

    const response = await new Promise<string>((resolve) => {
      ws.on('message', (data: unknown) => {
        resolve(String(data));
      });
      ws.send('not json {{{');
    });

    const msg = JSON.parse(response);
    expect(msg.type).toBe('file:error');
    expect(msg.payload.error).toContain('Invalid JSON');
    ws.close();
  });

  it('should return simulation status', async () => {
    const ws = await app.injectWS('/ws');

    const response = await new Promise<string>((resolve) => {
      ws.on('message', (data: unknown) => {
        resolve(String(data));
      });
      ws.send(JSON.stringify({ type: 'simulation:status' }));
    });

    const msg = JSON.parse(response);
    expect(msg.type).toBe('simulation:status');
    expect(msg.payload.status).toBeDefined();
    ws.close();
  });

  it('should handle file:open error for missing file', async () => {
    const ws = await app.injectWS('/ws');

    const response = await new Promise<string>((resolve) => {
      ws.on('message', (data: unknown) => {
        resolve(String(data));
      });
      ws.send(
        JSON.stringify({
          type: 'file:open',
          payload: { filePath: '/nonexistent/file.xosc', fileType: 'xosc' },
        }),
      );
    });

    const msg = JSON.parse(response);
    expect(msg.type).toBe('file:error');
    ws.close();
  });

  it('should handle unknown message type', async () => {
    const ws = await app.injectWS('/ws');

    const response = await new Promise<string>((resolve) => {
      ws.on('message', (data: unknown) => {
        resolve(String(data));
      });
      ws.send(JSON.stringify({ type: 'unknown:type' }));
    });

    const msg = JSON.parse(response);
    expect(msg.type).toBe('file:error');
    expect(msg.payload.error).toContain('Unknown message type');
    ws.close();
  });
});
