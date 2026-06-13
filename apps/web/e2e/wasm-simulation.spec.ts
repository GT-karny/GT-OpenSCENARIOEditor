import { test, expect, type Page } from '@playwright/test';
import { gotoEditor, entityList } from './helpers';

/**
 * Acceptance test for the in-browser WASM esmini simulation (roadmap item A1).
 *
 * WASM is the sole simulation engine, so this spec runs the engine inside
 * Playwright's bundled Chromium — no server simulation involved. It proves the
 * store → viewer pipeline end-to-end:
 *
 *   open scenario → Run → batch completes → playback controls appear →
 *   status bar shows a non-error state → frames flow to the viewer (the
 *   playback timer advances currentFrame, so the lead-entity DOM mirror's
 *   frame index increments during play).
 *
 * NOTE on entity motion: the bundled esmini WASM binding does not clear
 * per-step dirty bits, so the default controller never advances entities along
 * the road — positions stay frozen even though `speed` is set correctly. That
 * is an engine-binding limitation (documented in docs/development/wasm-build.md)
 * and is independent of the store→viewer wiring this spec verifies, so we assert
 * frame-index advancement rather than position change.
 *
 * The WASM module compiles + runs on first use, so timeouts are generous.
 */

/** Open a seeded scenario from the project file tree (mirrors smoke.spec.ts). */
async function openScenario(page: Page, fileName: string): Promise<void> {
  // The file-tree sidebar starts collapsed — expand it.
  await page.getByRole('button', { name: 'Show file explorer' }).click();
  // Expand the "xosc" folder, then open the scenario.
  await page.getByRole('button', { name: 'xosc', exact: true }).click();
  await page.getByRole('button', { name: fileName }).click();
}

test.describe('WASM simulation', () => {
  // WASM compile + batch run inside Chromium can take well over the default 30s.
  test.setTimeout(150_000);

  test('runs cut-in.xosc and streams frames to the viewer', async ({ page }) => {
    await gotoEditor(page);
    await openScenario(page, 'cut-in.xosc');

    // Scenario entities should populate the entity list before we simulate.
    await expect(entityList(page).getByText('Ego', { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    // Run the simulation (WASM path).
    await page.getByRole('button', { name: /Run|実行/ }).click();

    // Batch completes → playback controls appear. WASM compile + run is slow on
    // first invocation inside Chromium, so allow a generous window.
    await expect(page.getByTestId('playback-controls')).toBeVisible({
      timeout: 90_000,
    });
    await expect(page.getByTestId('time-display')).toBeVisible();

    // Status bar must NOT be in the error state, and must reflect a real run.
    const statusBar = page.getByTestId('status-bar');
    await expect(statusBar).not.toContainText(/Error|エラー/);
    await expect(statusBar).toContainText(/Completed|完了|Simulating|シミュレーション中/);

    // A non-trivial number of frames must exist (the lead-entity DOM mirror is
    // only rendered when frames are present).
    const posMirror = page.getByTestId('sim-lead-position');
    await expect(posMirror).toBeVisible();

    // Stop the auto-play so seeking is deterministic. The transport shows a
    // Pause button only while playing; click it if present.
    const pauseBtn = page.getByRole('button', { name: /Pause simulation/ });
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
    }

    // Seek to the start and confirm the index is reset.
    await page.getByRole('button', { name: /Skip to start/ }).click();
    await expect
      .poll(async () => Number(await posMirror.getAttribute('data-frame-index')))
      .toBe(0);

    // Frames flow to the viewer: seeking to the end advances the frame index,
    // proving currentFrame is driven by the store and reaches the viewer bridge.
    await page.getByRole('button', { name: /Skip to end/ }).click();
    await expect
      .poll(async () => Number(await posMirror.getAttribute('data-frame-index')))
      .toBeGreaterThan(0);

    // Live playback advances frames too (proves the rAF timer drives currentFrame).
    await page.getByRole('button', { name: /Skip to start/ }).click();
    await page.getByRole('button', { name: /Play simulation/ }).click();
    await expect
      .poll(async () => Number(await posMirror.getAttribute('data-frame-index')), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);
  });
});
