import { test, expect } from '@playwright/test';
import { gotoEditor, addEntity, entityList } from './helpers';

/**
 * Unsaved-changes guard + mode-dependent dirty display (S0 completion criteria).
 *
 * These specs lock in TWO behaviors:
 *
 * 1. In-app document-replacing actions (File > New here) surface a discard
 *    confirmation dialog when the active document is dirty
 *    (`isDirty || isRoadNetworkDirty`). Cancel aborts (document untouched);
 *    Discard-and-continue proceeds (document reset to a fresh/empty one).
 *
 * 2. The StatusBar dirty indicator is currently MODE-LINKED: it reflects the
 *    active editor mode's document only (`displayDirty = isRoadNetwork
 *    ? isXodrDirty : isXoscDirty`). Editing the scenario shows the dirty dot in
 *    Scenario mode; switching to Road Network mode (whose .xodr is untouched)
 *    hides it. This baseline is intentional — S1 is expected to deliberately
 *    replace it with a multi-document display, at which point this spec updates.
 *
 * Dialog / trigger conventions (verified against the running UI):
 * - Dialog: role="dialog", accessible title "Unsaved changes" (i18n
 *   common.unsavedGuard.title, English default locale). Buttons:
 *   "Save and continue" / "Discard and continue" / "Cancel". It is self-mounted
 *   into a `[data-discard-guard-root]` container under document.body, but we
 *   locate it by role/name rather than the data attribute.
 * - File > New: header "File" menu button → "New" menuitem (see
 *   file-operations.spec.ts). In Scenario mode this invokes `newScenario`,
 *   which runs the guard.
 * - Road Network mode switch: header banner button "Road Network" (see
 *   lht-default-rule.spec.ts — scoped to the banner because a Properties-panel
 *   accordion shares the accessible name).
 *
 * The dirty indicator is the trailing " ●" glyph appended to the filename span
 * in the status bar's right cluster (StatusBar.tsx). There is NO dedicated
 * dirty test-id — `data-testid="status-dot"` is the *simulation* status dot,
 * which is unrelated. We assert on the "Untitled ●" text instead.
 */

const DIRTY_MARK = '●';

test.describe('Unsaved-changes guard', () => {
  test.beforeEach(async ({ page }) => {
    // Match file-operations.spec.ts: force the legacy file-dialog fallbacks so
    // any save path the guard might reach is drivable (not strictly needed here
    // since we never take the Save branch, but keeps parity with sibling specs).
    await page.addInitScript(() => {
      // @ts-expect-error — intentionally remove FS Access API for the fallback path
      delete window.showOpenFilePicker;
      // @ts-expect-error — same as above for the save dialog
      delete window.showSaveFilePicker;
    });
    await gotoEditor(page);
    // Ensure we start on the Entities tab (default-active, but be explicit).
    await page.getByRole('tab', { name: /Entities|エンティティ/ }).click();
  });

  /**
   * Make the scenario document dirty by adding an entity, then open File > New
   * to trigger the guard. Returns once the confirm dialog is visible.
   */
  async function makeDirtyAndTriggerNew(
    page: import('@playwright/test').Page,
    entityName: string,
  ) {
    await addEntity(page, entityName);
    await expect(entityList(page).getByText(entityName)).toBeVisible();

    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: 'New' }).click();

    const dialog = page.getByRole('dialog', { name: 'Unsaved changes' });
    await expect(dialog).toBeVisible();
    return dialog;
  }

  test('Cancel keeps the current document unchanged', async ({ page }) => {
    const dialog = await makeDirtyAndTriggerNew(page, 'CancelEntity');

    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).not.toBeVisible();

    // Cancel aborts the New action: the entity (and the dirty state) survive.
    await expect(entityList(page).getByText('CancelEntity')).toBeVisible();
  });

  test('Discard and continue replaces the document with a fresh one', async ({ page }) => {
    const dialog = await makeDirtyAndTriggerNew(page, 'DiscardEntity');

    await dialog.getByRole('button', { name: 'Discard and continue', exact: true }).click();
    await expect(dialog).not.toBeVisible();

    // New scenario is created: the previous entity is gone.
    await expect(entityList(page).getByText('DiscardEntity')).not.toBeVisible();
    // And the fresh document is clean (Entities: 0 in the status bar).
    const statusBar = page.getByTestId('status-bar');
    await expect(statusBar).toContainText(/Entities:\s*0(?!\d)|エンティティ:\s*0(?!\d)/);
  });

  // NOTE: We intentionally do NOT assert the "clean document => no dialog" path
  // here. In this mock-backend flow, opening the seeded project mounts an
  // in-memory document that the app already reports as dirty (the status bar
  // shows the "●" mark on first render), so there is no reliable way to reach a
  // genuinely-clean in-app document to exercise the guard's clean-skip branch.
  // That branch (`confirmDiscardIfDirty` resolving 'discard' when clean) is
  // covered by the hook unit test (use-discard-guard.test.ts).
});

test.describe('Mode-dependent dirty display (S0 baseline)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
    await page.getByRole('tab', { name: /Entities|エンティティ/ }).click();
  });

  test('scenario dirty dot shows in Scenario mode and hides in Road Network mode', async ({
    page,
  }) => {
    const statusBar = page.getByTestId('status-bar');

    // Edit the scenario so the OpenSCENARIO document is unambiguously dirty.
    // (In this flow the freshly-opened document already reports dirty, so we
    // don't assert a clean baseline first — we assert the mode-linked behavior
    // around a known-dirty scenario document.)
    await addEntity(page, 'DirtyDisplayEntity');
    await expect(entityList(page).getByText('DirtyDisplayEntity')).toBeVisible();

    // In Scenario mode the status bar shows the dirty indicator ("… ●").
    await expect(statusBar).toContainText(DIRTY_MARK);

    // Switch to Road Network mode. The .xodr document is untouched, and the
    // CURRENT dirty display is mode-linked, so the indicator disappears even
    // though the scenario still has unsaved edits.
    await page.getByRole('banner').getByRole('button', { name: 'Road Network' }).click();
    await expect(statusBar).not.toContainText(DIRTY_MARK);

    // Switching back to Scenario mode brings the indicator back (still dirty).
    await page.getByRole('banner').getByRole('button', { name: 'Scenario', exact: true }).click();
    await expect(statusBar).toContainText(DIRTY_MARK);
  });
});
