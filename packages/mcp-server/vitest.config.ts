import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    root: resolve(__dirname),
    include: ['src/__tests__/**/*.test.ts'],
  },
});
