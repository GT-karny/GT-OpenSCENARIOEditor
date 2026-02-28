import { test, expect } from '@playwright/test';

test.describe('App Startup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display APEX logo and title', async ({ page }) => {
    await expect(page.getByText('APEX')).toBeVisible();
    await expect(page.locator('[aria-label="APEX Logo"]')).toBeVisible();
  });

  test('should display header toolbar with navigation items', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'File' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Validate' })).toBeVisible();
  });

  test('should display status bar', async ({ page }) => {
    const statusBar = page.getByTestId('status-bar');
    await expect(statusBar).toBeVisible();
    // Should show either "Ready" or "Disconnected" depending on server connection
    await expect(statusBar).toContainText(/Ready|Disconnected/);
  });

  test('should display left sidebar with Entities and Templates tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Entities|エンティティ/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Templates|テンプレート/ })).toBeVisible();
  });

  test('should display right sidebar with Properties and Validation tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Properties|プロパティ/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Validation|バリデーション/ })).toBeVisible();
  });

  test('should display Node Editor panel', async ({ page }) => {
    await expect(page.getByTestId('node-editor-panel')).toBeVisible();
  });

  test('should display 3D Viewer panel', async ({ page }) => {
    await expect(page.getByTestId('viewer-3d-panel')).toBeVisible();
  });

  test('should display language toggle', async ({ page }) => {
    const langToggle = page.getByTestId('language-toggle');
    await expect(langToggle).toBeVisible();
    await expect(langToggle).toContainText(/EN|JA/);
  });

  test('should display OpenSCENARIO version in status bar', async ({ page }) => {
    await expect(page.getByTestId('status-bar')).toContainText('OpenSCENARIO v1.2');
  });
});
