import { test, expect } from '@playwright/test';
import { gotoEditor } from './helpers';

test.describe('App Startup', () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test('should display app title and logo', async ({ page }) => {
    const banner = page.getByRole('banner');
    await expect(banner.getByText('OpenSCENARIO Editor')).toBeVisible();
    await expect(banner.getByLabel('Logo')).toBeVisible();
  });

  test('should display header toolbar with navigation items', async ({ page }) => {
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('button', { name: 'File', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Validate' })).toBeVisible();
  });

  test('should display status bar', async ({ page }) => {
    const statusBar = page.getByTestId('status-bar');
    await expect(statusBar).toBeVisible();
    // Status label reflects the (idle) simulation state.
    await expect(statusBar).toContainText(/Ready|Disconnected/);
  });

  test('should display left sidebar with Entities and Variables tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Entities|エンティティ/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Variables|変数/ })).toBeVisible();
  });

  test('should display right sidebar with Properties and Validation tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Properties|プロパティ/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Validation|バリデーション/ })).toBeVisible();
  });

  test('should display Node Editor panel', async ({ page }) => {
    // The Graph (node editor) view is mounted under the center "Graph" tab.
    await page.getByRole('tab', { name: 'Graph' }).click();
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
    await expect(page.getByTestId('status-bar')).toContainText('OpenSCENARIO v1.3');
  });
});
