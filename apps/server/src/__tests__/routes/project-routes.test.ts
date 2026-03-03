import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { buildApp } from '../../app.js';
import { ProjectService } from '../../services/project-service.js';
import type { FastifyInstance } from 'fastify';
import type { ProjectDetail, ProjectSummary } from '@osce/shared';

describe('Project Routes', () => {
  let app: FastifyInstance;
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'osce-project-route-test-'));
    app = await buildApp();

    // Replace the projectService with one using a temp directory
    const testService = new ProjectService(tmpDir);
    (app as unknown as Record<string, unknown>).projectService = testService;

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('POST /api/projects', () => {
    it('should create a project and return 201 with ProjectDetail', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { name: 'Route Test Project', description: 'Testing routes' },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload) as ProjectDetail;
      expect(body.meta.name).toBe('Route Test Project');
      expect(body.meta.description).toBe('Testing routes');
      expect(body.meta.id).toBeDefined();
      expect(Array.isArray(body.files)).toBe(true);
    });
  });

  describe('GET /api/projects', () => {
    it('should return 200 with an array of ProjectSummary', async () => {
      // Ensure at least one project exists
      await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { name: 'List Test' },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/projects',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload) as ProjectSummary[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0].name).toBeDefined();
      expect(typeof body[0].scenarioCount).toBe('number');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return 200 with ProjectDetail', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { name: 'Detail Route Test' },
      });
      const created = JSON.parse(createRes.payload) as ProjectDetail;

      const res = await app.inject({
        method: 'GET',
        url: `/api/projects/${created.meta.id}`,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload) as ProjectDetail;
      expect(body.meta.id).toBe(created.meta.id);
      expect(body.meta.name).toBe('Detail Route Test');
    });

    it('should return 404 for nonexistent project', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/projects/nonexistent-id',
      });

      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('should update project metadata', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { name: 'Before Update' },
      });
      const created = JSON.parse(createRes.payload) as ProjectDetail;

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/projects/${created.meta.id}`,
        payload: { name: 'After Update', description: 'Updated' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.name).toBe('After Update');
      expect(body.description).toBe('Updated');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project and return success', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { name: 'To Delete' },
      });
      const created = JSON.parse(createRes.payload) as ProjectDetail;

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/projects/${created.meta.id}`,
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).success).toBe(true);

      // Verify it's gone
      const getRes = await app.inject({
        method: 'GET',
        url: `/api/projects/${created.meta.id}`,
      });
      expect(getRes.statusCode).toBe(404);
    });
  });

  describe('File operations', () => {
    let projectId: string;

    beforeAll(async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { name: 'File Ops Project' },
      });
      const created = JSON.parse(createRes.payload) as ProjectDetail;
      projectId = created.meta.id;
    });

    it('PUT then GET file should round-trip content', async () => {
      const putRes = await app.inject({
        method: 'PUT',
        url: `/api/projects/${projectId}/files/xosc/test.xosc`,
        payload: { content: '<OpenSCENARIO/>' },
      });
      expect(putRes.statusCode).toBe(200);

      const getRes = await app.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/files/xosc/test.xosc`,
      });
      expect(getRes.statusCode).toBe(200);
      const body = JSON.parse(getRes.payload);
      expect(body.content).toBe('<OpenSCENARIO/>');
    });

    it('DELETE file should remove it', async () => {
      // Write a file first
      await app.inject({
        method: 'PUT',
        url: `/api/projects/${projectId}/files/xosc/to-delete.xosc`,
        payload: { content: '<xml/>' },
      });

      const delRes = await app.inject({
        method: 'DELETE',
        url: `/api/projects/${projectId}/files/xosc/to-delete.xosc`,
      });
      expect(delRes.statusCode).toBe(200);

      const getRes = await app.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/files/xosc/to-delete.xosc`,
      });
      expect(getRes.statusCode).toBe(404);
    });

    it('POST rename should move a file', async () => {
      // Write a file first
      await app.inject({
        method: 'PUT',
        url: `/api/projects/${projectId}/files/xosc/old-name.xosc`,
        payload: { content: '<renamed/>' },
      });

      const renameRes = await app.inject({
        method: 'POST',
        url: `/api/projects/${projectId}/files/rename`,
        payload: { from: 'xosc/old-name.xosc', to: 'xosc/new-name.xosc' },
      });
      expect(renameRes.statusCode).toBe(200);

      const getRes = await app.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/files/xosc/new-name.xosc`,
      });
      expect(getRes.statusCode).toBe(200);
      expect(JSON.parse(getRes.payload).content).toBe('<renamed/>');
    });
  });

  describe('ZIP export', () => {
    it('should export a project as ZIP', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { name: 'Export Test' },
      });
      const created = JSON.parse(createRes.payload) as ProjectDetail;

      // Add a file
      await app.inject({
        method: 'PUT',
        url: `/api/projects/${created.meta.id}/files/xosc/export.xosc`,
        payload: { content: '<OpenSCENARIO/>' },
      });

      const res = await app.inject({
        method: 'GET',
        url: `/api/projects/${created.meta.id}/export`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/zip');
      expect(res.headers['content-disposition']).toContain('.zip');
    });
  });
});
