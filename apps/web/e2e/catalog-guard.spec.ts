import { test, expect, type Page, type Locator } from '@playwright/test';
import { gotoEditor, addEntity, entityList } from './helpers';

/**
 * E2E coverage for the S3 completion condition "カタログ編集後の無警告クローズが不能"
 * (a catalog edit must not be silently discardable): editing a loaded catalog
 * through the Catalog Editor modal arms the same unsaved-changes guard as the
 * scenario/road-network documents, and the modal correctly routes Ctrl+Z to the
 * catalog's own command history while it is open.
 *
 * ── Catalog auto-load (no seeding needed) ──
 * The seeded `esmini-samples` sample project already ships real catalog files
 * under `catalogs/{Vehicles,Controllers,Pedestrians,Routes,Maneuvers}/*.xosc`
 * (see project-service.ts SAMPLE_CATALOGS). `EditorLayout`'s
 * `autoLoadProjectCatalogs` effect loads every `.xosc` under any project
 * `catalogs/` folder as soon as `currentProject` is set — i.e. as soon as
 * `gotoEditor` opens the project, regardless of which (if any) scenario file is
 * subsequently opened (see use-project-file-operations.ts loadProjectCatalogs /
 * isCatalogPath). So these specs need no file-API seeding: they open the
 * project, open the Catalog Editor, and the seeded VehicleCatalog (entry
 * `car_white`) is already there. Loading is purely additive and in-memory (see
 * catalog-store.ts loadCatalog) — these tests never click "Save Catalog", so
 * they never touch the shared project's files on disk.
 *
 * ── Dirty / undo plumbing (already implemented, Waves D-F) ──
 * - `dirty-indicator-catalog` (StatusBar.tsx) reflects the registry's kind-level
 *   `catalog` revision (document-registry.ts), which mirrors ONE shared
 *   CommandHistory across all loaded catalogs (catalog-store.ts). Editing any
 *   entry in any catalog bumps it.
 * - `hasUnsavedChanges()` (use-discard-guard.ts) is `anyDirty()` across all four
 *   document kinds, so a catalog-only edit already arms File > New's guard —
 *   exactly like the scenario/road-network cases unsaved-guard.spec.ts pins.
 * - While `CatalogEditorModal` is open it sets `focusedOverride = 'catalog'`
 *   (document-registry.ts), so Ctrl+Z routes to `useCatalogStore.undoCatalog()`
 *   instead of the (irrelevant, backgrounded) scenario history
 *   (use-keyboard-shortcuts.ts getFocusedDocumentKind).
 *
 * Test 3 from the wave brief ("File > New with a clean catalog does not
 * prompt") is intentionally NOT duplicated here: `gotoEditor` already
 * auto-loads the same catalogs for EVERY editor spec in the suite (see above),
 * so unsaved-guard.spec.ts's existing "File > New on a clean freshly-opened
 * document does not prompt" test already exercises the guard with catalogs
 * loaded-but-clean via the shared `anyDirty()` gate — a dedicated duplicate
 * would pin nothing new.
 */

const VEHICLE_CATALOG_NAME = 'VehicleCatalog';
const VEHICLE_ENTRY_NAME = 'car_white';

/** Open the Catalog Editor modal via the toolbar CatalogButton (header banner). */
async function openCatalogEditor(page: Page): Promise<Locator> {
  await page.getByRole('banner').getByRole('button', { name: /Catalogs/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Catalog Editor' });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Close the Catalog Editor modal via its header close button. */
async function closeCatalogEditor(dialog: Locator): Promise<void> {
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).not.toBeVisible();
}

/**
 * Select the seeded VehicleCatalog and its first entry (car_white). Waits
 * generously for the catalog row: it only appears once the project-open
 * auto-load (a background file-read) has resolved.
 */
async function selectSeededVehicleEntry(dialog: Locator): Promise<void> {
  const catalogRow = dialog.getByText(VEHICLE_CATALOG_NAME, { exact: true });
  await expect(catalogRow).toBeVisible({ timeout: 10_000 });
  await catalogRow.click();

  const entryRow = dialog.getByText(VEHICLE_ENTRY_NAME, { exact: true });
  await expect(entryRow).toBeVisible();
  await entryRow.click();
}

/**
 * The entry-name text input in the (already-selected) CatalogEntryEditor form.
 * Located via the "Name" label's following-sibling input (CatalogEntryEditor.tsx
 * renders them as adjacent children of the same `div.grid`) rather than
 * Playwright's `has:` filter: `has:` re-anchors an inner locator built from a
 * nested `dialog` locator at the FULL dialog-scoped selector chain, which then
 * can never match as a descendant of a `div.grid` candidate (confirmed via a
 * throwaway debug spec — `dialog.locator('div.grid', { has: dialog.getByText(...) })`
 * resolved to 0 elements even though both the label and 10 `div.grid`
 * candidates independently existed). Rooting the `has` locator at `page`
 * instead of `dialog` would also fix it, but the sibling-XPath below is
 * unambiguous either way, since "Name" is the only exact-text label here.
 */
function entryNameInput(dialog: Locator): Locator {
  return dialog.locator(
    'xpath=.//label[normalize-space(text())="Name"]/following-sibling::input[1]',
  );
}

test.describe('Catalog edit unsaved-changes guard (S3 completion)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
    await page.getByRole('tab', { name: /Entities|エンティティ/ }).click();
  });

  test('editing a catalog entry arms the guard, and Cancel keeps the edit', async ({ page }) => {
    const dialog = await openCatalogEditor(page);
    await selectSeededVehicleEntry(dialog);

    const nameInput = entryNameInput(dialog);
    await expect(nameInput).toHaveValue(VEHICLE_ENTRY_NAME);
    await nameInput.fill('car_white_edited');
    await expect(nameInput).toHaveValue('car_white_edited');

    await closeCatalogEditor(dialog);

    // Dirty is registry-level, not modal-scoped: it survives the modal closing.
    await expect(page.getByTestId('dirty-indicator-catalog')).toBeVisible();

    // File > New is a document-replacing action; a dirty catalog alone must arm
    // the same guard as a dirty scenario/road network (anyDirty()).
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: 'New' }).click();
    const unsavedDialog = page.getByRole('dialog', { name: 'Unsaved changes' });
    await expect(unsavedDialog).toBeVisible();

    // Cancel aborts the New action: the catalog edit is untouched.
    await unsavedDialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(unsavedDialog).not.toBeVisible();
    await expect(page.getByTestId('dirty-indicator-catalog')).toBeVisible();

    // Selection persists across modal close/reopen (catalog store is untouched
    // by closeEditor), so the edited value is visible without re-selecting.
    const reopened = await openCatalogEditor(page);
    await expect(entryNameInput(reopened)).toHaveValue('car_white_edited');
  });

  test('Ctrl+Z while the catalog modal is open undoes to the clean baseline', async ({ page }) => {
    const dialog = await openCatalogEditor(page);
    await selectSeededVehicleEntry(dialog);

    const nameInput = entryNameInput(dialog);
    await nameInput.fill('car_white_undo_me');
    await expect(nameInput).toHaveValue('car_white_undo_me');
    // Asserted with the modal still open: proves the indicator is a registry-
    // level derived value, not something the modal hides while editing.
    await expect(page.getByTestId('dirty-indicator-catalog')).toBeVisible();

    // The modal being open sets focusedOverride='catalog', so Ctrl+Z must
    // rewind the catalog's history, not the (backgrounded) scenario document.
    await page.keyboard.press('Control+z');

    await expect(nameInput).toHaveValue(VEHICLE_ENTRY_NAME);
    await expect(page.getByTestId('dirty-indicator-catalog')).not.toBeVisible();
  });

  test('status bar surfaces scenario and catalog dirty indicators simultaneously', async ({
    page,
  }) => {
    await addEntity(page, 'ScreenshotDirtyEntity');
    await expect(entityList(page).getByText('ScreenshotDirtyEntity')).toBeVisible();
    await expect(page.getByTestId('dirty-indicator-scenario')).toBeVisible();

    const dialog = await openCatalogEditor(page);
    await selectSeededVehicleEntry(dialog);
    await entryNameInput(dialog).fill('car_white_screenshot');
    await closeCatalogEditor(dialog);

    const statusBar = page.getByTestId('status-bar');
    await expect(page.getByTestId('dirty-indicator-scenario')).toBeVisible();
    await expect(page.getByTestId('dirty-indicator-catalog')).toBeVisible();

    // CLAUDE.md: UI changes need visual verification. Capture both a tight shot
    // of the status bar and full-window context showing both indicators live.
    await statusBar.screenshot({ path: 'test-results/s3-statusbar-dirty.png' });
    await page.screenshot({ path: 'test-results/s3-statusbar-context.png' });
  });
});
