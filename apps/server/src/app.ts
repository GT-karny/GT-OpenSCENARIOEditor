import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import { ProjectService } from './services/project-service.js';
import { projectRoutes } from './routes/project-routes.js';
import { settingsRoutes } from './routes/settings-routes.js';
import { wsHandler } from './websocket/ws-handler.js';
import { registerErrorHandler } from './utils/errors.js';

declare module 'fastify' {
  interface FastifyInstance {
    projectService: ProjectService;
  }
}

export interface AppOptions {
  /** Custom base path for project storage (default: process.cwd()/data/projects) */
  projectsBasePath?: string;
  /** Enable Fastify logger (default: true) */
  logger?: boolean;
}

// Allowed CORS origins for development. Extend via CORS_ORIGINS env var
// (comma-separated list of additional origins).
function buildCorsOrigins(): string[] {
  const defaults = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const extra = process.env.CORS_ORIGINS;
  if (extra) {
    return [...defaults, ...extra.split(',').map((s) => s.trim()).filter(Boolean)];
  }
  return defaults;
}

export async function buildApp(options?: AppOptions) {
  const app = Fastify({ logger: options?.logger ?? true });

  // Plugins
  await app.register(cors, { origin: buildCorsOrigins() });
  await app.register(websocket);
  await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

  // Services
  const projectService = new ProjectService(options?.projectsBasePath);

  app.decorate('projectService', projectService);

  // Seed sample project from esmini resources (if available)
  await projectService.seedSampleProject();

  // Error handler
  registerErrorHandler(app);

  // Routes
  await app.register(projectRoutes);
  await app.register(settingsRoutes);
  await app.register(wsHandler);

  return app;
}
