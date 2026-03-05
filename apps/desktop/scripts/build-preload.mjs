import { build } from 'esbuild';

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

console.log('Preload script built successfully.');
