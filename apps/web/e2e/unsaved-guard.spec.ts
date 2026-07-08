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
 * 2. The StatusBar dirty state is DERIVED from each document's command-history
 *    revision (S1 DocumentRegistry): editing makes it dirty, undoing back to the
 *    load/save baseline makes it clean again, and per-document indicators surface
 *    a dirty document even when it is not the focused editor mode. This replaces
 *    the S0 mode-linked single-dot baseline.
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

  test('File > New on a clean freshly-opened document does not prompt', async ({ page }) => {
    // Regression guard for the S0 false-dirty finding: opening a project used to
    // mark the document dirty (blanket "any mutation -> setDirty(true)"), so
    // File > New wrongly prompted. With derived dirty, a freshly opened document
    // is clean and File > New proceeds without a guard dialog.
    const statusBar = page.getByTestId('status-bar');
    await expect(statusBar).toBeVisible();
    // No per-document dirty indicators on a clean open.
    await expect(page.getByTestId('dirty-indicators')).not.toBeVisible();

    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: 'New' }).click();

    // Clean document → no confirmation dialog; the new scenario is created.
    await expect(page.getByRole('dialog', { name: 'Unsaved changes' })).not.toBeVisible();
    await expect(statusBar).toContainText(/Entities:\s*0(?!\d)|エンティティ:\s*0(?!\d)/);
  });
});

test.describe('Derived dirty display (S1 DocumentRegistry)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
    await page.getByRole('tab', { name: /Entities|エンティティ/ }).click();
  });

  test('undo back to the load baseline restores clean display', async ({ page }) => {
    const scenarioDirty = page.getByTestId('dirty-indicator-scenario');

    // Edit the scenario → derived dirty → the per-document indicator appears.
    await addEntity(page, 'UndoCleanEntity');
    await expect(entityList(page).getByText('UndoCleanEntity')).toBeVisible();
    await expect(scenarioDirty).toBeVisible();

    // Undo back to the load baseline → revision === savedRevision → clean again.
    await page.keyboard.press('Control+z');
    await expect(entityList(page).getByText('UndoCleanEntity')).not.toBeVisible();
    await expect(scenarioDirty).not.toBeVisible();
  });

  test('a dirty scenario stays flagged after switching to Road Network mode', async ({
    page,
  }) => {
    const scenarioDirty = page.getByTestId('dirty-indicator-scenario');

    await addEntity(page, 'CrossModeDirtyEntity');
    await expect(entityList(page).getByText('CrossModeDirtyEntity')).toBeVisible();
    await expect(scenarioDirty).toBeVisible();

    // Switch to Road Network mode: the scenario is now the NON-focused document,
    // but its unsaved state remains visible via the per-document indicator
    // (unlike the S0 mode-linked display, which hid it).
    await page.getByRole('banner').getByRole('button', { name: 'Road Network' }).click();
    await expect(scenarioDirty).toBeVisible();

    await page.getByRole('banner').getByRole('button', { name: 'Scenario', exact: true }).click();
    await expect(scenarioDirty).toBeVisible();
  });
});
