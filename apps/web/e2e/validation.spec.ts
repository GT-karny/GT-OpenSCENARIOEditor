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

  // --- B2: debounced auto-validation on edit (no manual Validate press) ---
  // Requires useValidationAutorun mounted in EditorLayout (mainSessionActions).
  test('auto-validates after an edit without pressing Validate', async ({ page }) => {
    const statusBar = page.getByTestId('status-bar');
    // Fresh scenario is clean → no count text yet.
    await expect(statusBar).not.toContainText(/errors|warnings/);

    // Add a behavior group: creates a Story/Act/ManeuverGroup that yields
    // structural warnings (empty StartTrigger, no actors) — a document change.
    await page.getByRole('button', { name: 'Add Entity Behavior' }).click();

    // The debounced autorun (~700ms) should populate the status bar count
    // without any Validate click.
    await expect(statusBar).toContainText(/errors|warnings/, { timeout: 5000 });
  });

  // --- B2: click-to-navigate switches to the Graph tab and selects element ---
  // Requires centerTabRequest consumption in EditorLayout (mainSessionActions).
  test('clicking a validation issue switches to Graph tab and selects the element', async ({
    page,
  }) => {
    // Induce navigable structural warnings.
    await page.getByRole('button', { name: 'Add Entity Behavior' }).click();

    // Run validation and open the panel.
    await page.getByRole('button', { name: 'Validate' }).click();
    await page.getByRole('tab', { name: /Validation|バリデーション/ }).click();
    await expect(page.getByTestId('validation-summary')).toBeVisible();

    // Default center tab is Composer.
    const graphTab = page.getByRole('tab', { name: 'Graph' });
    await expect(graphTab).toHaveAttribute('data-state', 'inactive');

    // Click the first navigable issue row (has a real onClick target).
    const firstIssue = page.locator('button:not([disabled])', {
      hasText: /StartTrigger|actor|ManeuverGroup|Act/i,
    });
    await firstIssue.first().click();

    // The Graph tab becomes active (node focus is only visible there).
    await expect(graphTab).toHaveAttribute('data-state', 'active');
  });
});
