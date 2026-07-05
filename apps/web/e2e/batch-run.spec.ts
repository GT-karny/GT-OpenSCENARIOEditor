import { test, expect, type Page } from '@playwright/test';
import { gotoEditor, entityList, dismissDiscardDialog } from './helpers';

/**
 * Acceptance test for the in-browser batch execution matrix (roadmap item C4).
 *
 * Builds on the C3 parameter-distribution feature: attach a deterministic Range
 * distribution to an existing declared parameter of a WASM-runnable scenario,
 * open the Batch run dialog, and run every variant through the esmini WASM
 * worker pool. Proves the pipeline end-to-end:
 *
 *   open scenario → attach Range (3 variants) → Batch run → pool runs each
 *   variant → matrix shows one terminal-status row per variant.
 *
 * cut-in_simple.xosc is used because wasm-simulation.spec.ts already proves it
 * loads and runs in the bundled Chromium. It declares HeadwayTime_LaneChange
 * (double), which we vary over a Range producing exactly 3 variants.
 *
 * The WASM module compiles + runs on first use, and here it runs 3 times across
 * a small pool, so timeouts are generous.
 */

/** Open a seeded scenario from the project file tree (mirrors wasm-simulation.spec.ts). */
async function openScenario(page: Page, fileName: string): Promise<void> {
  await page.getByRole('button', { name: 'Show file explorer' }).click();
  await page.getByRole('button', { name: 'xosc', exact: true }).click();
  await page.getByRole('button', { name: fileName }).click();
  // Project-tree opens route through the unsaved-changes guard; the seeded
  // default document is dirty, so discard it to proceed to the scenario load.
  await dismissDiscardDialog(page, 'discard');
}

test.describe('Batch execution matrix', () => {
  // Run sequentially: each variant compiles + executes the ~5MB WASM module,
  // and parallel copies thrash the CPU. One worker keeps timings predictable.
  test.describe.configure({ mode: 'default' });
  // Compile + 3 variant runs inside Chromium can take a while.
  test.setTimeout(240_000);

  test('runs 3 Range variants and shows a terminal status per row', async ({ page }) => {
    await gotoEditor(page);
    await openScenario(page, 'cut-in_simple.xosc');

    // Confirm the scenario loaded (Ego is present in every seeded sample).
    await expect(entityList(page).getByText('Ego', { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    // Switch to the Variables tab where parameters + distributions live.
    await page.getByRole('tab', { name: /Variables|変数/ }).click();

    // The scenario declares HeadwayTime_LaneChange — attach a distribution to it.
    const paramRow = page
      .locator('.glass-item')
      .filter({ hasText: 'HeadwayTime_LaneChange' })
      .first();
    await expect(paramRow).toBeVisible({ timeout: 10_000 });
    await paramRow.hover();
    await paramRow.getByRole('button', { name: 'Attach distribution' }).click();

    // The attach dialog defaults to a deterministic Range distribution. Set the
    // range to 0..2 step 1 → exactly 3 variants (0, 1, 2).
    const attachDialog = page.getByRole('dialog');
    await expect(attachDialog).toBeVisible();
    const numberInputs = attachDialog.locator('input[type="number"]');
    // RangeStepRow renders exactly three inputs in order: Lower, Upper, Step.
    await numberInputs.nth(0).fill('0');
    await numberInputs.nth(1).fill('2');
    await numberInputs.nth(2).fill('1');
    await attachDialog.getByRole('button', { name: /^Attach$|^設定$/ }).click();
    await expect(attachDialog).not.toBeVisible();

    // The Distributions accordion is collapsed by default — expand it so the
    // Batch run action becomes visible.
    await page.getByRole('button', { name: /Distributions \(\d+\)|分布 \(\d+\)/ }).click();

    // Open the Batch run dialog.
    await page.getByRole('button', { name: /Batch run|一括実行/ }).click();
    const batchDialog = page.getByTestId('batch-run-dialog');
    await expect(batchDialog).toBeVisible();

    // The matrix should pre-render one row per variant (3) before running.
    const rows = batchDialog.getByTestId('batch-row');
    await expect(rows).toHaveCount(3);

    // Start the run.
    await batchDialog.getByRole('button', { name: /Run all|すべて実行/ }).click();

    // Every row must reach a terminal status (data-status becomes non-empty).
    // Poll until all three carry a terminal status attribute.
    await expect
      .poll(
        async () => {
          const statuses = await rows.evaluateAll((els) =>
            els.map((el) => el.getAttribute('data-status') ?? ''),
          );
          return statuses.filter((s) => s !== '').length;
        },
        { timeout: 200_000, intervals: [2_000] },
      )
      .toBe(3);

    // Confirm each terminal status is one of the expected judgements.
    const finalStatuses = await rows.evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-status') ?? ''),
    );
    for (const status of finalStatuses) {
      expect(['passed', 'collision', 'error', 'incomplete']).toContain(status);
    }
  });
});
