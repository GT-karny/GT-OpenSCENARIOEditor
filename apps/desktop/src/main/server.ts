import { app } from 'electron';
import path from 'node:path';
import { buildApp } from '@osce/server/app';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let server: any = null;

export async function startServer(): Promise<number> {
  // Desktop packaged app stores project data beside the exe:
  // <exe-dir>/OpenSCENARIOEditor-data/projects
  const exeDirPath = path.dirname(process.execPath);
  const dataRootPath = path.join(exeDirPath, 'OpenSCENARIOEditor-data');
  const projectsPath = path.join(dataRootPath, 'projects');

  server = await buildApp({
    projectsBasePath: projectsPath,
    logger: !app.isPackaged ? true : false,
  });

  // In production, serve the built web frontend as static files
  if (app.isPackaged) {
    const fastifyStatic = await import('@fastify/static');
    const webDistPath = path.join(process.resourcesPath, 'web-dist');

    await server.register(fastifyStatic.default, {
      root: webDistPath,
      prefix: '/',
    });

    // SPA fallback: serve index.html for all non-API, non-WS routes
    server.setNotFoundHandler(async (req: { url: string }, reply: { code: (n: number) => { send: (o: unknown) => void }; sendFile: (f: string) => void }) => {
      if (req.url.startsWith('/api/') || req.url.startsWith('/ws')) {
        return reply.code(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  const address = await server.listen({ port: 0, host: '127.0.0.1' });
  const addrInfo = server.server.address();
  const port = typeof addrInfo === 'object' && addrInfo ? addrInfo.port : 3001;

  console.log(`Server listening at ${address}`);
  return port;
}

export async function stopServer(): Promise<void> {
  if (server) {
    await server.close();
    server = null;
  }
}
