import { test, expect } from '@playwright/test';

test.describe('Template Apply', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Switch to Templates tab
    await page.getByRole('tab', { name: /Templates|テンプレート/ }).click();
  });

  test('should display template categories', async ({ page }) => {
    // Accordion should show template categories
    await expect(page.getByText(/Highway|高速道路/i)).toBeVisible();
  });

  test('should expand category and show template cards', async ({ page }) => {
    // Highway category should be expanded by default
    // Look for a known template name (e.g., "Cut-In")
    await expect(page.getByText(/Cut.?In/i)).toBeVisible();
  });

  test('should open parameter dialog when clicking a template', async ({ page }) => {
    // Click on a template card (e.g., Cut-In)
    await page.getByText(/Cut.?In/i).first().click();

    // Parameter dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should apply template with default parameters', async ({ page }) => {
    // Click on a template
    await page.getByText(/Cut.?In/i).first().click();

    // Dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click Apply button
    await page.getByRole('dialog').getByRole('button', { name: /Apply|適用/ }).click();

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Node editor should now have nodes (check for entity count in status bar)
    const statusBar = page.getByTestId('status-bar');
    await expect(statusBar).not.toContainText(/Entities.*0|エンティティ.*0/);
  });
});
