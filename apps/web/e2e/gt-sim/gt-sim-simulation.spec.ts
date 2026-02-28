import { test, expect } from '@playwright/test';

test.describe('GT_Sim Simulation Execution', () => {
  test.skip(!process.env.USE_GT_SIM, 'GT_Sim not available');

  test('should run a simulation and receive frames', async ({ page }) => {
    await page.goto('/');

    // Wait for connection
    await expect(page.getByTestId('status-bar')).toContainText(/Ready/, {
      timeout: 10_000,
    });

    // Click Run simulation button
    await page.getByRole('button', { name: /Run|実行/ }).click();

    // Should show running state
    await expect(
      page.getByTestId('simulation-timeline-running'),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for simulation to complete (may take a few seconds)
    await expect(page.getByTestId('playback-controls')).toBeVisible({
      timeout: 30_000,
    });

    // Playback controls should have time display
    await expect(page.getByTestId('time-display')).toBeVisible();
  });

  test('should support playback controls after simulation', async ({ page }) => {
    await page.goto('/');

    // Wait for connection and run simulation
    await expect(page.getByTestId('status-bar')).toContainText(/Ready/, {
      timeout: 10_000,
    });
    await page.getByRole('button', { name: /Run|実行/ }).click();

    // Wait for completion
    await expect(page.getByTestId('playback-controls')).toBeVisible({
      timeout: 30_000,
    });

    // Test play/pause
    await page.getByRole('button', { name: /Play simulation/ }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Pause simulation/ }).click();

    // Test skip to start
    await page.getByRole('button', { name: /Skip to start/ }).click();
    await expect(page.getByTestId('time-display')).toContainText('00:00');

    // Test speed selector
    await page.getByRole('button', { name: /Playback speed/ }).click();
    await page.getByRole('menuitem', { name: '2x' }).click();
  });

  test('should create and complete a simulation job via API', async ({
    request,
  }) => {
    // Get first available scenario
    const scenariosRes = await request.get(
      'http://127.0.0.1:8000/api/scenarios',
    );
    const scenarios = await scenariosRes.json();
    const scenario = scenarios.find(
      (s: { scenario_id: string }) =>
        s.scenario_id.includes('cut-in') ||
        s.scenario_id.includes('acc-test'),
    );
    expect(scenario).toBeTruthy();

    // Start simulation
    const simRes = await request.post(
      'http://127.0.0.1:8000/api/simulations',
      {
        data: {
          scenario_id: scenario.scenario_id,
          headless: true,
          timeout: 30,
        },
      },
    );
    expect(simRes.ok()).toBeTruthy();
    const { job_id } = await simRes.json();
    expect(job_id).toBeTruthy();

    // Poll for completion
    let status = 'running';
    for (let i = 0; i < 60 && status === 'running'; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const statusRes = await request.get(
        `http://127.0.0.1:8000/api/simulations/${job_id}`,
      );
      const statusBody = await statusRes.json();
      status = statusBody.status;
    }

    expect(status).toBe('completed');

    // Get metrics
    const metricsRes = await request.get(
      `http://127.0.0.1:8000/api/results/${job_id}/metrics`,
    );
    expect(metricsRes.ok()).toBeTruthy();
  });
});
