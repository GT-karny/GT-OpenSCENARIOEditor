import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { buildApp } from '../../app.js';
import type { FastifyInstance } from 'fastify';

describe('WebSocket Handler', () => {
  let app: FastifyInstance;
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'osce-ws-test-'));
    app = await buildApp({ projectsBasePath: tmpDir, logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await rm(tmpDir, { recursive: true, force: true });
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
    expect(msg.type).toBe('error');
    expect(msg.payload.error).toContain('Invalid JSON');
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
    expect(msg.type).toBe('error');
    expect(msg.payload.error).toContain('Unknown message type');
    ws.close();
  });
});
