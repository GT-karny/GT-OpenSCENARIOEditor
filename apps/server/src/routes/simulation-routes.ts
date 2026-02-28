import type { FastifyInstance } from 'fastify';
import type { SimulationRequest } from '@osce/shared';

export async function simulationRoutes(app: FastifyInstance): Promise<void> {
  const simulationService = app.simulationService;

  // POST /api/simulation/start
  app.post<{ Body: SimulationRequest }>('/api/simulation/start', async (request, reply) => {
    const sessionId = await simulationService.startSimulation(request.body);
    return reply.send({ sessionId });
  });

  // POST /api/simulation/stop
  app.post<{ Body: { sessionId: string } }>('/api/simulation/stop', async (request, reply) => {
    await simulationService.stopSimulation(request.body.sessionId);
    return reply.send({ success: true });
  });

  // GET /api/simulation/status
  app.get('/api/simulation/status', async (_request, reply) => {
    const status = simulationService.getStatus();
    return reply.send(status);
  });
}
