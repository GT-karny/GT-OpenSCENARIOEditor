import { DEFAULT_SERVER_PORT } from '@osce/shared';
import { buildApp } from './app.js';

const PORT = parseInt(process.env.PORT ?? String(DEFAULT_SERVER_PORT), 10);
// Bind to localhost by default; override via HOST env var for intentional LAN exposure
const HOST = process.env.HOST ?? '127.0.0.1';

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const shutdown = async () => {
    app.log.info('Shutting down...');
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
