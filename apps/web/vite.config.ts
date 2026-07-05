import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

// Workspace packages resolved to their source in dev so edits inside
// packages/*/src hot-reload without a `dist` rebuild. Production `vite build`
// and vitest keep reading the tsc-built `dist` (declared package exports) to
// avoid double-compiling the same sources.
const OSCE_SOURCE_PACKAGES = [
  'shared',
  'i18n',
  'theme-apex',
  'opendrive',
  'opendrive-engine',
  'openscenario',
  'scenario-engine',
  'node-editor',
  'templates',
  '3d-viewer',
];

function osceSourceAlias(): Record<string, string> {
  const pkgRoot = resolve(__dirname, '../../packages');
  // The theme-apex `/styles` subpath must be resolved before the bare package
  // alias, otherwise it would be rewritten to `<src/index.ts>/styles`.
  const alias: Record<string, string> = {
    '@osce/theme-apex/styles': resolve(pkgRoot, 'theme-apex/src/styles/apex.css'),
  };
  for (const pkg of OSCE_SOURCE_PACKAGES) {
    alias[`@osce/${pkg}`] = resolve(pkgRoot, `${pkg}/src/index.ts`);
  }
  return alias;
}

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // dev server only — build/test resolve `@osce/*` from dist exports.
      ...(command === 'serve' ? osceSourceAlias() : {}),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
  },
}));
