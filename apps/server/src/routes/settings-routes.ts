import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { ValidationError } from '../utils/errors.js';

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  const projectService = app.projectService;

  // GET /api/settings/projects-root — get current projects base path
  app.get('/api/settings/projects-root', async (_request, reply) => {
    return reply.send({ path: projectService.getBasePath() });
  });

  // PUT /api/settings/projects-root — change projects base path
  app.put<{ Body: { path: string } }>(
    '/api/settings/projects-root',
    async (request, reply) => {
      const newPath = request.body?.path;
      if (!newPath || typeof newPath !== 'string' || newPath.trim().length === 0) {
        throw new ValidationError('Path is required');
      }

      const trimmed = newPath.trim();

      // Must be an absolute path
      if (!path.isAbsolute(trimmed)) {
        throw new ValidationError('Path must be absolute');
      }

      await projectService.setBasePath(trimmed);
      return reply.send({ path: projectService.getBasePath() });
    },
  );
}
