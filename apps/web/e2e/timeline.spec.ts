import { test, expect, type Page } from '@playwright/test';
import { gotoEditor, entityList, dismissDiscardDialog } from './helpers';

/**
 * Acceptance test for timeline interactions (roadmap B4): scrub, zoom, and
 * dragging event blocks to write trigger times back as undoable edits.
 *
 * These interactions only exist once a scenario has been simulated (the event
 * blocks are derived from the storyBoardEvents produced by a WASM run), so this
 * spec reuses the wasm-simulation pattern: open a seeded scenario, Run it, wait
 * for the playback controls, then exercise the timeline. WASM compile + run is
 * slow, so timeouts are generous and the suite runs in a single worker.
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

/** Run the open scenario and wait until playback controls are ready + paused. */
async function runAndPause(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Run|実行/ }).click();
  await expect(page.getByTestId('playback-controls')).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId('status-bar')).not.toContainText(/Error|エラー/);

  // Stop auto-play so seeking / dragging is deterministic.
  const pauseBtn = page.getByRole('button', { name: /Pause simulation/ });
  if (await pauseBtn.isVisible()) {
    await pauseBtn.click();
  }
}

test.describe('Timeline interactions', () => {
  // One worker: each test compiles + runs the WASM module (see wasm-simulation.spec.ts).
  test.describe.configure({ mode: 'default' });
  test.setTimeout(150_000);

  test('scrub, event-block drag with undo, and zoom', async ({ page }) => {
    await gotoEditor(page);
    await openScenario(page, 'cut-in.xosc');
    await expect(entityList(page).getByText('Ego', { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    await runAndPause(page);

    const track = page.getByTestId('timeline-viewport');
    await expect(track).toBeVisible();
    const box = await track.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    // --- (a) Scrub: pointer-drag across the track changes the frame index. ---
    const posMirror = page.getByTestId('sim-lead-position');
    await page.getByRole('button', { name: /Skip to start/ }).click();
    await expect.poll(async () => Number(await posMirror.getAttribute('data-frame-index'))).toBe(0);

    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8, y, { steps: 8 });
    await page.mouse.up();
    await expect
      .poll(async () => Number(await posMirror.getAttribute('data-frame-index')))
      .toBeGreaterThan(0);

    // --- (b) Event-block drag writes the trigger time; Ctrl+Z reverts it. ---
    const block = page.locator('[data-testid^="event-block-"]').first();
    await expect(block).toBeVisible();
    const before = Number(await block.getAttribute('data-time'));

    const blockBox = await block.boundingBox();
    expect(blockBox).not.toBeNull();
    if (!blockBox) return;
    const startX = blockBox.x + blockBox.width / 2;
    const startY = blockBox.y + blockBox.height / 2;

    // Drag the block to the right (~40% of the track width later in time).
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.6, startY, { steps: 10 });
    await page.mouse.up();

    await expect
      .poll(async () => Number(await block.getAttribute('data-time')))
      .toBeGreaterThan(before);
    const after = Number(await block.getAttribute('data-time'));

    // One drag = one undo entry. Ctrl+Z restores the original trigger time.
    await page.keyboard.press('Control+z');
    await expect
      .poll(async () => Number(await block.getAttribute('data-time')))
      .toBeCloseTo(before, 1);
    expect(after).not.toBeCloseTo(before, 1);

    // --- (c) Zoom: Ctrl+wheel narrows the visible time window. ---
    const startAttrBefore = Number(await track.getAttribute('data-zoom-start'));
    const endAttrBefore = Number(await track.getAttribute('data-zoom-end'));
    const spanBefore = endAttrBefore - startAttrBefore;

    // Playwright's mouse.wheel does not carry the ctrlKey flag our handler
    // requires, so dispatch a real ctrl+wheel event at the track's center.
    await track.dispatchEvent('wheel', {
      deltaY: -600,
      ctrlKey: true,
      clientX: box.x + box.width * 0.5,
      clientY: y,
    });

    await expect
      .poll(async () => {
        const s = Number(await track.getAttribute('data-zoom-start'));
        const e = Number(await track.getAttribute('data-zoom-end'));
        return e - s;
      })
      .toBeLessThan(spanBefore);

    // Reset-zoom button restores the full window.
    await page.getByRole('button', { name: /Reset zoom|ズームをリセット/ }).click();
    await expect
      .poll(async () => {
        const s = Number(await track.getAttribute('data-zoom-start'));
        const e = Number(await track.getAttribute('data-zoom-end'));
        return e - s;
      })
      .toBeCloseTo(spanBefore, 1);
  });
});
