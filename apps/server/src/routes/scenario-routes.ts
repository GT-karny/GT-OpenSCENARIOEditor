import type { FastifyInstance } from 'fastify';
import type { ScenarioDocument } from '@osce/shared';

export async function scenarioRoutes(app: FastifyInstance): Promise<void> {
  const scenarioService = app.scenarioService;

  // POST /api/scenario/export-xml
  app.post<{ Body: { document: ScenarioDocument } }>(
    '/api/scenario/export-xml',
    async (request, reply) => {
      const { document } = request.body;
      const xml = scenarioService.serializeXosc(document);
      return reply.send({ xml });
    },
  );

  // POST /api/scenario/import-xml
  app.post<{ Body: { xml: string } }>('/api/scenario/import-xml', async (request, reply) => {
    const { xml } = request.body;
    const doc = scenarioService.parseXosc(xml);
    return reply.send(doc);
  });
}
