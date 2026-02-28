import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../app.js';
import type { FastifyInstance } from 'fastify';

describe('Simulation Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/simulation/start', () => {
    it('should start a simulation and return sessionId', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/simulation/start',
        payload: { scenarioXml: '<xml/>', duration: 1 },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.sessionId).toBeDefined();
      expect(typeof body.sessionId).toBe('string');

      // Stop it
      await app.inject({
        method: 'POST',
        url: '/api/simulation/stop',
        payload: { sessionId: body.sessionId },
      });
    });
  });

  describe('GET /api/simulation/status', () => {
    it('should return simulation status', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/simulation/status',
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.status).toBeDefined();
      expect(typeof body.frameCount).toBe('number');
    });
  });

  describe('POST /api/simulation/stop', () => {
    it('should stop a running simulation', async () => {
      // Start first
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/simulation/start',
        payload: { scenarioXml: '<xml/>', duration: 10 },
      });
      const { sessionId } = JSON.parse(startRes.payload);

      const res = await app.inject({
        method: 'POST',
        url: '/api/simulation/stop',
        payload: { sessionId },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).success).toBe(true);
    });

    it('should return 400 for invalid session ID', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/simulation/stop',
        payload: { sessionId: 'invalid-id' },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });
});
