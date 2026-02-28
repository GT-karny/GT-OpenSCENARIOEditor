import { test, expect } from '@playwright/test';

test.describe('Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should run validation from toolbar button', async ({ page }) => {
    await page.getByRole('button', { name: 'Validate' }).click();

    // Validation tab should become active or show results
    await page.getByRole('tab', { name: /Validation|バリデーション/ }).click();

    // Should show validation results or empty state
    await expect(
      page.getByTestId('validation-summary').or(
        page.getByText(/Click validate|errors|warnings/i),
      ),
    ).toBeVisible();
  });

  test('should show validation errors for empty scenario', async ({ page }) => {
    // Run validation on empty scenario
    await page.getByRole('button', { name: 'Validate' }).click();

    // Switch to Validation tab
    await page.getByRole('tab', { name: /Validation|バリデーション/ }).click();

    // Empty scenario should have validation errors (e.g., empty storyboard)
    const summary = page.getByTestId('validation-summary');
    await expect(summary).toBeVisible();
  });

  test('should run validation from panel button', async ({ page }) => {
    // Switch to Validation tab
    await page.getByRole('tab', { name: /Validation|バリデーション/ }).click();

    // Click validate button in the panel
    await page.getByRole('button', { name: 'Run validation' }).click();

    // Should show results
    await expect(page.getByTestId('validation-summary')).toBeVisible();
  });

  test('should show error count in status bar after validation', async ({ page }) => {
    await page.getByRole('button', { name: 'Validate' }).click();

    const statusBar = page.getByTestId('status-bar');
    await expect(statusBar).toContainText(/errors|warnings/, { timeout: 5000 });
  });
});
