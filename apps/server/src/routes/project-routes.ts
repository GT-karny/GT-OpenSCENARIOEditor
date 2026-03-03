import type { FastifyInstance } from 'fastify';
import type { ProjectCreateRequest, ProjectUpdateRequest } from '@osce/shared';

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  const projectService = app.projectService;

  // GET /api/projects — list all projects
  app.get('/api/projects', async (_request, reply) => {
    const projects = await projectService.listProjects();
    return reply.send(projects);
  });

  // POST /api/projects — create a new project
  app.post<{ Body: ProjectCreateRequest }>('/api/projects', async (request, reply) => {
    const detail = await projectService.createProject(request.body);
    return reply.status(201).send(detail);
  });

  // GET /api/projects/:id — get project detail
  app.get<{ Params: { id: string } }>('/api/projects/:id', async (request, reply) => {
    const detail = await projectService.getProject(request.params.id);
    return reply.send(detail);
  });

  // PATCH /api/projects/:id — update project metadata
  app.patch<{ Params: { id: string }; Body: ProjectUpdateRequest }>(
    '/api/projects/:id',
    async (request, reply) => {
      const meta = await projectService.updateProject(request.params.id, request.body);
      return reply.send(meta);
    },
  );

  // DELETE /api/projects/:id — delete a project
  app.delete<{ Params: { id: string } }>('/api/projects/:id', async (request, reply) => {
    await projectService.deleteProject(request.params.id);
    return reply.send({ success: true });
  });

  // GET /api/projects/:id/files/* — read a file
  app.get<{ Params: { id: string; '*': string } }>(
    '/api/projects/:id/files/*',
    async (request, reply) => {
      const content = await projectService.readFile(request.params.id, request.params['*']);
      return reply.send({ content });
    },
  );

  // PUT /api/projects/:id/files/* — write a file
  app.put<{ Params: { id: string; '*': string }; Body: { content: string } }>(
    '/api/projects/:id/files/*',
    async (request, reply) => {
      await projectService.writeFile(request.params.id, request.params['*'], request.body.content);
      return reply.send({ success: true });
    },
  );

  // DELETE /api/projects/:id/files/* — delete a file
  app.delete<{ Params: { id: string; '*': string } }>(
    '/api/projects/:id/files/*',
    async (request, reply) => {
      await projectService.deleteFile(request.params.id, request.params['*']);
      return reply.send({ success: true });
    },
  );

  // POST /api/projects/:id/files/rename — rename/move a file
  app.post<{ Params: { id: string }; Body: { from: string; to: string } }>(
    '/api/projects/:id/files/rename',
    async (request, reply) => {
      await projectService.renameFile(request.params.id, request.body.from, request.body.to);
      return reply.send({ success: true });
    },
  );

  // GET /api/projects/:id/export — export project as ZIP
  app.get<{ Params: { id: string } }>(
    '/api/projects/:id/export',
    async (request, reply) => {
      const buffer = await projectService.exportZip(request.params.id);
      return reply
        .header('Content-Type', 'application/zip')
        .header('Content-Disposition', `attachment; filename="${request.params.id}.zip"`)
        .send(buffer);
    },
  );

  // POST /api/projects/import — import project from ZIP
  app.post('/api/projects/import', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'ZIP file is required', code: 'VALIDATION_ERROR' });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk as Buffer);
    }
    const zipBuffer = Buffer.concat(chunks);

    // Try to get the name from the multipart field if present
    const nameField = data.fields['name'];
    let name: string | undefined;
    if (nameField && 'value' in nameField && typeof nameField.value === 'string') {
      name = nameField.value;
    }

    const detail = await projectService.importZip(zipBuffer, name);
    return reply.status(201).send(detail);
  });
}
