import { test, expect } from '@playwright/test';
import { gotoEditor } from './helpers';

test.describe('Validation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test('should run validation from toolbar button', async ({ page }) => {
    await page.getByRole('button', { name: 'Validate' }).click();

    // Switch to the Validation tab to view results.
    await page.getByRole('tab', { name: /Validation|バリデーション/ }).click();

    // Summary badge appears once a validation result exists.
    await expect(page.getByTestId('validation-summary')).toBeVisible();
  });

  test('should show validation results for empty scenario', async ({ page }) => {
    // Run validation on the empty (freshly-opened) scenario.
    await page.getByRole('button', { name: 'Validate' }).click();

    // Switch to Validation tab.
    await page.getByRole('tab', { name: /Validation|バリデーション/ }).click();

    const summary = page.getByTestId('validation-summary');
    await expect(summary).toBeVisible();
  });

  test('should run validation from panel button', async ({ page }) => {
    // Switch to Validation tab.
    await page.getByRole('tab', { name: /Validation|バリデーション/ }).click();

    // Click validate button in the panel.
    await page.getByRole('button', { name: 'Run validation' }).click();

    await expect(page.getByTestId('validation-summary')).toBeVisible();
  });

  test('should show error/warning count in status bar after validation', async ({ page }) => {
    await page.getByRole('button', { name: 'Validate' }).click();

    const statusBar = page.getByTestId('status-bar');
    await expect(statusBar).toContainText(/errors|warnings/, { timeout: 5000 });
  });
});
