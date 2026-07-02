import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { gotoEditor } from './helpers';

/**
 * E2E for the driving-direction arrow overlay (W2-B, LHT wave).
 *
 * The overlay is a Three.js mesh, so its geometry is not assertable from the
 * DOM. This spec therefore keeps assertions at the DOM level (toggle state via
 * aria-pressed, road-rule value via the property editor) and captures two
 * screenshots — one RHT, one LHT — into test-results/lht-arrows/ for human
 * visual verification that the arrows flip direction.
 *
 * Road loading follows preview.spec.ts conventions: opening a scenario whose
 * RoadNetwork/LogicFile resolves in the seeded project auto-loads the .xodr, so
 * the Road Network editor is populated with real roads.
 */

const SHOT_DIR = 'test-results/lht-arrows';

/** Open a scenario file from the seeded project's file tree. */
async function openScenario(page: Page, fileName: string): Promise<void> {
  await page.getByRole('button', { name: 'Show file explorer' }).click();
  await page.getByRole('button', { name: 'xosc', exact: true }).click();
  await page.getByRole('button', { name: fileName }).click();
}

test.describe('driving-direction arrow overlay (RHT/LHT)', () => {
  test.beforeAll(() => {
    mkdirSync(SHOT_DIR, { recursive: true });
  });

  test('toggle arrows, flip a road to LHT, capture RHT + LHT screenshots', async ({ page }) => {
    await gotoEditor(page);

    // traffic_lights.xosc references a road network that resolves in the seeded
    // project, so opening it loads roads into the Road Network editor.
    await openScenario(page, 'traffic_lights.xosc');
    await expect(page.getByTestId('status-bar')).toBeVisible();

    // Switch to the Road Network editor tab (scope to the header — a
    // Properties-panel accordion section shares the same accessible name).
    await page
      .getByRole('banner')
      .getByRole('button', { name: 'Road Network', exact: true })
      .click();

    // Roads should be listed in the sidebar (Roads tab is default-active).
    const roadCountLabel = page.getByText(/\d+ roads?/);
    await expect(roadCountLabel.first()).toBeVisible({ timeout: 15_000 });

    // Enable the driving-direction overlay from the viewer toolbar.
    const dirToggle = page.getByTestId('toggle-driving-direction');
    await expect(dirToggle).toBeVisible();
    await expect(dirToggle).toHaveAttribute('aria-pressed', 'false');
    await dirToggle.click();
    await expect(dirToggle).toHaveAttribute('aria-pressed', 'true');

    // Give the canvas a moment to render the overlay, then capture RHT.
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOT_DIR}/rht.png` });

    // Select the first road so the property editor (with the Rule EnumSelect)
    // is shown. Road list items render a Route icon + name; click the first.
    const firstRoad = page.locator('.glass-item').first();
    await expect(firstRoad).toBeVisible();
    await firstRoad.click();

    // The road property editor exposes a "Rule" field. Locate the Rule row and
    // its EnumSelect trigger (Radix combobox) by proximity to the label.
    const ruleRow = page.locator('div.grid', { has: page.getByText('Rule', { exact: true }) });
    const ruleTrigger = ruleRow.getByRole('combobox');
    await expect(ruleTrigger).toBeVisible({ timeout: 10_000 });
    await expect(ruleTrigger).toContainText('RHT');

    // Set the road rule to LHT.
    await ruleTrigger.click();
    await page.getByRole('option', { name: 'LHT', exact: true }).click();

    // The property editor should reflect the new rule value.
    await expect(ruleTrigger).toContainText('LHT');

    // Overlay should still be enabled and the road now LHT — capture LHT.
    await expect(dirToggle).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOT_DIR}/lht.png` });

    // No crash: the editor chrome is still alive.
    await expect(page.getByTestId('status-bar')).toBeVisible();
  });
});
