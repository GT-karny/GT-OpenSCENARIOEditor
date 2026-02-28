import { test, expect } from '@playwright/test';
import { GT_SIM_API } from './constants';

test.describe('GT_Sim Connection', () => {
  test.skip(!process.env.USE_GT_SIM, 'GT_Sim not available');

  test('should pass health check', async ({ request }) => {
    const res = await request.get(`${GT_SIM_API}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('should return scenario list with 78+ scenarios', async ({ request }) => {
    const res = await request.get(`${GT_SIM_API}/api/scenarios`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThanOrEqual(78);
  });

  test('should show connected status in the app', async ({ page }) => {
    await page.goto('/');
    const statusBar = page.getByTestId('status-bar');

    // Wait for WebSocket connection
    await expect(statusBar).toContainText(/Ready|接続済み/, { timeout: 10_000 });
  });

  test('should show system configuration', async ({ request }) => {
    const res = await request.get(`${GT_SIM_API}/api/config/system`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('scenario_count');
    expect(body.scenario_count).toBeGreaterThanOrEqual(78);
  });
});
