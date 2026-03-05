import { build } from 'esbuild';

// Bundle main process — inlines all @osce/* workspace packages
// so electron-builder doesn't need to follow pnpm workspace symlinks.
await build({
  entryPoints: ['src/main/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/main/index.mjs',
  external: [
    'electron',
    'electron-store',
    '@fastify/static',
    // Fastify and its plugins (native or complex dynamic imports)
    'fastify',
    '@fastify/cors',
    '@fastify/websocket',
    '@fastify/multipart',
    // gRPC (optional, may have native bindings)
    '@grpc/grpc-js',
    '@grpc/proto-loader',
    // Other heavy deps that should stay in node_modules
    'adm-zip',
    'pino',
    'pino-pretty',
  ],
  sourcemap: true,
  banner: {
    js: '// Bundled main process — do not edit directly\n',
  },
});
console.log('Main process bundled successfully.');

// Bundle preload script (must be CJS for Electron)
await build({
  entryPoints: ['src/preload/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/preload/index.js',
  external: ['electron'],
  sourcemap: true,
});
console.log('Preload script bundled successfully.');
