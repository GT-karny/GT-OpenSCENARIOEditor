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
 *   frame index increments during play) → the lead entity actually MOVES
 *   (its simulated x,y at the last frame differs from the first frame).
 *
 * The motion assertion guards against the per-step dirty-bits regression
 * (GT_Sim 672fb061): without SwapAndClearDirtyBits() each frame, entities
 * whose only action is an init SpeedAction stay frozen at their start
 * position even though simulation time advances. A seeded-scenario sweep
 * runs the same check across the sample library.
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

/**
 * Run the currently open scenario and assert the lead entity's simulated
 * position changes between the first and last frame (entities are not frozen).
 * Returns the start/end position strings for any extra assertions.
 */
async function runAndAssertMotion(page: Page): Promise<{ start: string; end: string }> {
  await page.getByRole('button', { name: /Run|実行/ }).click();

  await expect(page.getByTestId('playback-controls')).toBeVisible({ timeout: 90_000 });
  const statusBar = page.getByTestId('status-bar');
  await expect(statusBar).not.toContainText(/Error|エラー/);

  const posMirror = page.getByTestId('sim-lead-position');
  await expect(posMirror).toBeVisible();

  // Stop auto-play so seeking is deterministic.
  const pauseBtn = page.getByRole('button', { name: /Pause simulation/ });
  if (await pauseBtn.isVisible()) {
    await pauseBtn.click();
  }

  await page.getByRole('button', { name: /Skip to start/ }).click();
  await expect
    .poll(async () => Number(await posMirror.getAttribute('data-frame-index')))
    .toBe(0);
  const start = (await posMirror.textContent()) ?? '';
  expect(start).not.toBe('');

  await page.getByRole('button', { name: /Skip to end/ }).click();
  await expect
    .poll(async () => Number(await posMirror.getAttribute('data-frame-index')))
    .toBeGreaterThan(0);
  const end = (await posMirror.textContent()) ?? '';
  expect(end).not.toBe('');

  // The dirty-bits regression freezes entities at their init position while
  // simulation time still advances — catch it by requiring actual motion.
  expect(end).not.toBe(start);

  return { start, end };
}

test.describe('WASM simulation', () => {
  // Run sequentially in one worker: each test compiles + executes the ~5MB WASM
  // module, and N parallel copies thrash the CPU enough to blow the 90s
  // playback-ready timeout (observed with 6 workers).
  test.describe.configure({ mode: 'default' });
  // WASM compile + batch run inside Chromium can take well over the default 30s.
  test.setTimeout(150_000);

  test('runs cut-in.xosc and streams frames to the viewer', async ({ page }) => {
    await gotoEditor(page);
    await openScenario(page, 'cut-in.xosc');

    // Scenario entities should populate the entity list before we simulate.
    await expect(entityList(page).getByText('Ego', { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    // Run → playback ready → status sane → lead entity actually moved.
    const { start, end } = await runAndAssertMotion(page);
    expect(start).toMatch(/^-?\d+\.\d{3},-?\d+\.\d{3}$/);
    expect(end).toMatch(/^-?\d+\.\d{3},-?\d+\.\d{3}$/);

    await expect(page.getByTestId('time-display')).toBeVisible();
    await expect(page.getByTestId('status-bar')).toContainText(
      /Completed|完了|Simulating|シミュレーション中/
    );

    // Live playback advances frames too (proves the rAF timer drives currentFrame).
    const posMirror = page.getByTestId('sim-lead-position');
    await page.getByRole('button', { name: /Skip to start/ }).click();
    await page.getByRole('button', { name: /Play simulation/ }).click();
    await expect
      .poll(async () => Number(await posMirror.getAttribute('data-frame-index')), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);
  });

  // Sweep the remaining seeded sample scenarios. Each covers a different
  // action mix (init-SpeedAction-only entities, routing, pedestrians,
  // traffic-signal control) — all must produce actual entity motion.
  for (const fileName of [
    'cut-in_simple.xosc',
    'lane_change.xosc',
    'highway_merge.xosc',
    'pedestrian.xosc',
    'traffic_lights.xosc',
  ]) {
    test(`runs ${fileName} with entity motion`, async ({ page }) => {
      await gotoEditor(page);
      await openScenario(page, fileName);

      // The lead entity (Ego in every seeded sample) confirms the load finished.
      await expect(entityList(page).getByText('Ego', { exact: true })).toBeVisible({
        timeout: 10_000,
      });

      await runAndAssertMotion(page);
    });
  }
});
