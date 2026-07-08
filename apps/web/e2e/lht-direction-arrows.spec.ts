import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { gotoEditor, dismissDiscardDialog } from './helpers';

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
  // Project-tree opens route through the unsaved-changes guard; the seeded
  // default document is dirty, so discard it to proceed to the scenario load.
  await dismissDiscardDialog(page, 'discard');
}

test.describe('driving-direction arrow overlay (RHT/LHT)', () => {
  test.beforeAll(() => {
    mkdirSync(SHOT_DIR, { recursive: true });
  });

  test('toggle arrows, flip all roads to LHT, capture RHT + LHT screenshots', async ({ page }) => {
    // CI: skipped. This is a visual-capture spec (its output is the screenshot
    // pair for human review); under the CI runner's software WebGL the Three.js
    // render loop starves the main thread and even trivial toolbar clicks never
    // complete within 90s (observed on run 28781306023, incl. both retries).
    // Functional LHT coverage in CI lives in lht-default-rule.spec.ts.
    test.skip(!!process.env.CI, 'visual-capture spec; software-WebGL starvation on CI runners');
    // Solo run takes ~26s; under parallel WASM load (full-suite workers) this
    // creeps close to the default 30s test timeout. 90s gives real headroom.
    test.setTimeout(90_000);
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

    // Top-down view so chevron directions read unambiguously in screenshots.
    await page.getByRole('button', { name: 'Top', exact: true }).click();

    // Enable the driving-direction overlay from the viewer toolbar.
    const dirToggle = page.getByTestId('toggle-driving-direction');
    await expect(dirToggle).toBeVisible();
    await expect(dirToggle).toHaveAttribute('aria-pressed', 'false');
    await dirToggle.click();
    await expect(dirToggle).toHaveAttribute('aria-pressed', 'true');

    // Zoom into the junction so individual chevrons are readable. Multiple
    // canvases exist (main viewer + minimap) — pick the largest one.
    const canvases = page.locator('canvas');
    const count = await canvases.count();
    let canvas = canvases.first();
    let best = 0;
    for (let i = 0; i < count; i++) {
      const b = await canvases.nth(i).boundingBox();
      const area = b ? b.width * b.height : 0;
      if (area > best) {
        best = area;
        canvas = canvases.nth(i);
      }
    }
    const box = await canvas.boundingBox();
    if (!box) throw new Error('viewer canvas not found');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, -400);
      // Fixed settle time per wheel tick for the canvas render pipeline (kept
      // deliberately; the extra headroom lives in the test timeout, not here).
      await page.waitForTimeout(120);
    }

    // Capture the all-RHT baseline.
    // Fixed canvas-render settle time before capture (kept deliberately; the
    // extra headroom lives in the test timeout, not here).
    await page.waitForTimeout(500);
    await canvas.screenshot({ path: `${SHOT_DIR}/rht.png` });

    // Bulk-apply LHT to every road via the road-creation panel so EVERY arrow
    // must visibly rotate 180° between the two screenshots (a single-road flip
    // is too subtle to verify by eye). Panel clicks do not move the camera.
    await page.getByRole('button', { name: 'Road', exact: true }).click();
    await expect(page.getByText('Traffic rule')).toBeVisible();
    await page.getByRole('button', { name: 'LHT', exact: true }).click();
    await page.getByRole('button', { name: 'Apply to all roads' }).click();
    await page.getByRole('button', { name: 'Select', exact: true }).click();

    // DOM-level confirmation: a road's Rule field now reads LHT.
    const firstRoad = page.locator('.glass-item').first();
    await expect(firstRoad).toBeVisible();
    await firstRoad.click();
    const ruleRow = page.locator('div.grid', { has: page.getByText('Rule', { exact: true }) });
    const ruleTrigger = ruleRow.getByRole('combobox');
    await expect(ruleTrigger).toBeVisible({ timeout: 15_000 });
    await expect(ruleTrigger).toContainText('LHT');

    // Overlay still enabled and every road now LHT — capture for comparison.
    await expect(dirToggle).toHaveAttribute('aria-pressed', 'true');
    // Fixed canvas-render settle time before capture (kept deliberately; the
    // extra headroom lives in the test timeout, not here).
    await page.waitForTimeout(500);
    await canvas.screenshot({ path: `${SHOT_DIR}/lht.png` });

    // No crash: the editor chrome is still alive.
    await expect(page.getByTestId('status-bar')).toBeVisible();
  });
});
