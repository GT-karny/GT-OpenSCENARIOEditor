import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { FileService } from './services/file-service.js';
import { ScenarioService } from './services/scenario-service.js';
import { SimulationService } from './services/simulation-service.js';
import { GtSimService } from '@osce/esmini';
import { MockEsminiService } from './services/mock-esmini-service.js';
import { fileRoutes } from './routes/file-routes.js';
import { scenarioRoutes } from './routes/scenario-routes.js';
import { simulationRoutes } from './routes/simulation-routes.js';
import { wsHandler } from './websocket/ws-handler.js';
import { registerErrorHandler } from './utils/errors.js';

declare module 'fastify' {
  interface FastifyInstance {
    fileService: FileService;
    scenarioService: ScenarioService;
    simulationService: SimulationService;
  }
}

export async function buildApp() {
  const app = Fastify({ logger: true });

  // Plugins
  await app.register(cors, { origin: true });
  await app.register(websocket);

  // Services
  const fileService = new FileService();
  const scenarioService = new ScenarioService();
  const esminiService = process.env.GT_SIM_URL
    ? new GtSimService({
        restBaseUrl: process.env.GT_SIM_URL,
        grpcHost: process.env.GT_SIM_GRPC ?? '127.0.0.1:50051',
        timeout: 30_000,
      })
    : new MockEsminiService();
  const simulationService = new SimulationService(esminiService);

  app.decorate('fileService', fileService);
  app.decorate('scenarioService', scenarioService);
  app.decorate('simulationService', simulationService);

  // Cleanup GtSimService gRPC channel on shutdown
  app.addHook('onClose', async () => {
    if ('dispose' in esminiService) {
      (esminiService as GtSimService).dispose();
    }
  });

  // Error handler
  registerErrorHandler(app);

  // Routes
  await app.register(fileRoutes);
  await app.register(scenarioRoutes);
  await app.register(simulationRoutes);
  await app.register(wsHandler);

  return app;
}
