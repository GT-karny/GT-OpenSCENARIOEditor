import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { buildApp } from '../../app.js';
import type { FastifyInstance } from 'fastify';

function findRepoRoot(): string {
  let dir = path.resolve(__dirname, '../../../../..');
  if (dir.includes('.claude')) {
    dir = dir.replace(/[/\\]\.claude[/\\]worktrees[/\\][^/\\]+/, '');
  }
  return dir;
}

const REPO_ROOT = findRepoRoot();
const XOSC_DIR = path.join(REPO_ROOT, 'Thirdparty/esmini-demo_Windows/esmini-demo/resources/xosc');
const XODR_DIR = path.join(REPO_ROOT, 'Thirdparty/esmini-demo_Windows/esmini-demo/resources/xodr');

describe('File Routes', () => {
  let app: FastifyInstance;
  let tmpDir: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'osce-route-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('POST /api/files/open-xosc', () => {
    it('should open and parse a .xosc file', async () => {
      const filePath = path.join(XOSC_DIR, 'cut-in.xosc');
      const res = await app.inject({
        method: 'POST',
        url: '/api/files/open-xosc',
        payload: { filePath },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.fileHeader).toBeDefined();
      expect(body.entities).toBeDefined();
      expect(body.storyboard).toBeDefined();
    });

    it('should return 404 for missing file', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/files/open-xosc',
        payload: { filePath: path.join(tmpDir, 'nonexistent.xosc') },
      });
      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/files/save-xosc', () => {
    it('should save a ScenarioDocument to file', async () => {
      // First parse a file via API
      const openRes = await app.inject({
        method: 'POST',
        url: '/api/files/open-xosc',
        payload: { filePath: path.join(XOSC_DIR, 'cut-in.xosc') },
      });
      const doc = JSON.parse(openRes.payload);

      // Save to tmp
      const savePath = path.join(tmpDir, 'saved.xosc');
      const saveRes = await app.inject({
        method: 'POST',
        url: '/api/files/save-xosc',
        payload: { filePath: savePath, document: doc },
      });
      expect(saveRes.statusCode).toBe(200);
      expect(JSON.parse(saveRes.payload).success).toBe(true);

      // Verify saved file exists and is valid XML
      const readRes = await app.inject({
        method: 'POST',
        url: '/api/files/open-xosc',
        payload: { filePath: savePath },
      });
      expect(readRes.statusCode).toBe(200);
    });
  });

  describe('POST /api/files/open-xodr', () => {
    it('should open and parse a .xodr file', async () => {
      const filePath = path.join(XODR_DIR, 'straight_500m.xodr');
      const res = await app.inject({
        method: 'POST',
        url: '/api/files/open-xodr',
        payload: { filePath },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.header).toBeDefined();
      expect(body.roads).toBeDefined();
    });
  });

  describe('GET /api/files/browse', () => {
    it('should list xosc files', async () => {
      await writeFile(path.join(tmpDir, 'a.xosc'), '<xml/>');
      await writeFile(path.join(tmpDir, 'b.xodr'), '<xml/>');

      const res = await app.inject({
        method: 'GET',
        url: `/api/files/browse?dir=${encodeURIComponent(tmpDir)}&filter=xosc`,
      });
      expect(res.statusCode).toBe(200);
      const files = JSON.parse(res.payload);
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('a.xosc');
    });

    it('should return 404 for missing directory', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/files/browse?dir=${encodeURIComponent(path.join(tmpDir, 'nope'))}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/files/validate', () => {
    it('should validate a document', async () => {
      const openRes = await app.inject({
        method: 'POST',
        url: '/api/files/open-xosc',
        payload: { filePath: path.join(XOSC_DIR, 'cut-in.xosc') },
      });
      const doc = JSON.parse(openRes.payload);

      const res = await app.inject({
        method: 'POST',
        url: '/api/files/validate',
        payload: { document: doc },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(typeof body.valid).toBe('boolean');
      expect(Array.isArray(body.errors)).toBe(true);
    });
  });
});
