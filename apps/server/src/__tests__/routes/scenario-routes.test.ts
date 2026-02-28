import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { buildApp } from '../../app.js';
import type { FastifyInstance } from 'fastify';

function findRepoRoot(): string {
  let dir = path.resolve(__dirname, '../../../../..');
  if (dir.includes('.claude')) {
    dir = dir.replace(/[/\\]\.claude[/\\]worktrees[/\\][^/\\]+/, '');
  }
  return dir;
}

const XOSC_DIR = path.join(
  findRepoRoot(),
  'Thirdparty/esmini-demo_Windows/esmini-demo/resources/xosc',
);

describe('Scenario Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/scenario/import-xml', () => {
    it('should parse XML string to ScenarioDocument', async () => {
      const xml = readFileSync(path.join(XOSC_DIR, 'cut-in.xosc'), 'utf-8');
      const res = await app.inject({
        method: 'POST',
        url: '/api/scenario/import-xml',
        payload: { xml },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.fileHeader).toBeDefined();
      expect(body.entities).toBeDefined();
    });

    it('should return 422 for invalid XML', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/scenario/import-xml',
        payload: { xml: 'not valid xml {{{}}}' },
      });
      expect(res.statusCode).toBe(422);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('PARSE_ERROR');
    });
  });

  describe('POST /api/scenario/export-xml', () => {
    it('should serialize ScenarioDocument to XML', async () => {
      const xml = readFileSync(path.join(XOSC_DIR, 'cut-in.xosc'), 'utf-8');
      const importRes = await app.inject({
        method: 'POST',
        url: '/api/scenario/import-xml',
        payload: { xml },
      });
      const doc = JSON.parse(importRes.payload);

      const res = await app.inject({
        method: 'POST',
        url: '/api/scenario/export-xml',
        payload: { document: doc },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.xml).toContain('<?xml');
      expect(body.xml).toContain('OpenSCENARIO');
    });
  });
});
