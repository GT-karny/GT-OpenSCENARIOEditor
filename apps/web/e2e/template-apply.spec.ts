import { test, expect } from '@playwright/test';
import { gotoEditor } from './helpers';

/**
 * NOTE (E2E repair): The use-case Template Palette is no longer reachable from
 * the editor UI. The component still exists (apps/web/src/components/panels/
 * TemplatePalettePanel.tsx) but it is not mounted anywhere in the live app —
 * the only reference is its own unit test. The editor's left sidebar now hosts
 * "Entities" + "Variables" tabs (see EditorLayout.tsx); there is no "Templates"
 * tab and no other entry point that renders the category accordion / template
 * cards these tests drive.
 *
 * This is a removed/relocated feature, not an app defect, so the assertions
 * below cannot be exercised. They are kept as test.fixme so the intent is
 * preserved and visible: re-enable (and update selectors) if/when a template
 * palette entry point is reintroduced. Templates currently reach the canvas
 * only via drag-and-drop, which has no static palette source to drag from.
 */
test.describe('Template Apply', () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
  });

  test.fixme('should display template categories', async ({ page }) => {
    await expect(page.getByText(/Highway|高速道路/i)).toBeVisible();
  });

  test.fixme('should expand category and show template cards', async ({ page }) => {
    await expect(page.getByText(/Cut.?In/i)).toBeVisible();
  });

  test.fixme('should open parameter dialog when clicking a template', async ({ page }) => {
    await page.getByText(/Cut.?In/i).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test.fixme('should apply template with default parameters', async ({ page }) => {
    await page.getByText(/Cut.?In/i).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /Apply|適用/ }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    const statusBar = page.getByTestId('status-bar');
    await expect(statusBar).not.toContainText(/Entities.*0|エンティティ.*0/);
  });
});
