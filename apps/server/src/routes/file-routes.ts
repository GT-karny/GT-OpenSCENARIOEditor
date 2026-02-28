import type { FastifyInstance } from 'fastify';
import type { ScenarioDocument } from '@osce/shared';

export async function fileRoutes(app: FastifyInstance): Promise<void> {
  const fileService = app.fileService;
  const scenarioService = app.scenarioService;

  // POST /api/files/open-xosc
  app.post<{ Body: { filePath: string } }>('/api/files/open-xosc', async (request, reply) => {
    const { filePath } = request.body;
    const xml = await fileService.readFile(filePath);
    const doc = scenarioService.parseXosc(xml);
    return reply.send(doc);
  });

  // POST /api/files/save-xosc
  app.post<{ Body: { filePath: string; document: ScenarioDocument } }>(
    '/api/files/save-xosc',
    async (request, reply) => {
      const { filePath, document } = request.body;
      const xml = scenarioService.serializeXosc(document);
      await fileService.writeFile(filePath, xml);
      return reply.send({ success: true });
    },
  );

  // POST /api/files/open-xodr
  app.post<{ Body: { filePath: string } }>('/api/files/open-xodr', async (request, reply) => {
    const { filePath } = request.body;
    const xml = await fileService.readFile(filePath);
    const doc = scenarioService.parseXodr(xml);
    return reply.send(doc);
  });

  // GET /api/files/browse
  app.get<{ Querystring: { dir: string; filter?: 'xosc' | 'xodr' } }>(
    '/api/files/browse',
    async (request, reply) => {
      const { dir, filter } = request.query;
      const files = await fileService.listFiles(dir, filter);
      return reply.send(files);
    },
  );

  // POST /api/files/validate
  app.post<{ Body: { document: ScenarioDocument } }>(
    '/api/files/validate',
    async (request, reply) => {
      const { document } = request.body;
      const result = scenarioService.validate(document);
      return reply.send(result);
    },
  );
}
