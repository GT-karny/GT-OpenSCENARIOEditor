import { test, expect } from '@playwright/test';
import { gotoEditor, entityList } from './helpers';

/**
 * End-to-end smoke test of the primary happy path:
 *   HomeScreen → open seeded "esmini Samples" project → open a scenario from
 *   the project file tree → editor shows the scenario's entities + storyboard.
 *
 * gotoEditor() already exercises HomeScreen → project open. Here we additionally
 * load a real scenario file (xosc/cut-in.xosc) through the file-tree sidebar and
 * assert its content is rendered.
 */
test.describe('Smoke: open seeded project and scenario', () => {
  test('opens cut-in.xosc from the file tree and shows its entities', async ({ page }) => {
    await gotoEditor(page);

    // The file-tree sidebar starts collapsed — expand it.
    await page.getByRole('button', { name: 'Show file explorer' }).click();

    // Expand the "xosc" folder, then open the seeded cut-in scenario.
    await page.getByRole('button', { name: 'xosc', exact: true }).click();
    await page.getByRole('button', { name: 'cut-in.xosc' }).click();

    // The scenario's entities (Ego, OverTaker) should populate the entity list.
    await expect(entityList(page).getByText('Ego', { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await expect(entityList(page).getByText('OverTaker', { exact: true })).toBeVisible();

    // Status bar should reflect a non-empty scenario.
    await expect(page.getByTestId('status-bar')).not.toContainText(
      /Entities:\s*0(?!\d)/,
    );
  });
});
