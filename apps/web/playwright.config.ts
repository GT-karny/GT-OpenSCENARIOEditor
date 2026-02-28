import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'default',
      use: { ...devices['Desktop Chrome'] },
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
