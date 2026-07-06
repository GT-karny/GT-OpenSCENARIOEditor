import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: process.env.USE_GT_SIM ? './e2e/global-setup.ts' : undefined,
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // One local retry: WASM-simulation specs saturate the CPU in fully-parallel
  // local runs and can starve UI specs of render time (they pass in isolation).
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  // CI: line reporter for readable step logs, plus a non-opening html report
  // that the workflow uploads as a failure artifact. Local runs keep the
  // interactive html report.
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    // Wide viewport so the header toolbar renders in full (non-compact) mode.
    // Below 1300px the toolbar collapses Validate/Catalog/etc. to icon-only
    // buttons, which hides their text labels from getByRole name matching.
    viewport: { width: 1600, height: 900 },
  },

  projects: [
    {
      name: 'default',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } },
      testIgnore: /gt-sim\//,
    },
    ...(process.env.USE_GT_SIM
      ? [
          {
            name: 'gt-sim',
            use: { ...devices['Desktop Chrome'] },
            testMatch: /gt-sim\//,
          },
        ]
      : []),
  ],

  webServer: [
    {
      command: 'pnpm --filter @osce/server dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      cwd: '../../',
    },
    {
      command: 'pnpm dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
