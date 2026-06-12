import { test, expect } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gotoEditor, addEntity, entityList } from './helpers';

const CUTIN_XOSC = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../Thirdparty/openscenario-v1.2.0/Examples/CutIn.xosc',
);

test.describe('File Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Force the legacy <input type=file> / anchor-download fallbacks so the
    // file dialogs are drivable by Playwright. In Chromium the app otherwise
    // prefers the File System Access API (showOpenFilePicker / showSaveFilePicker),
    // which Playwright cannot interact with.
    await page.addInitScript(() => {
      // @ts-expect-error — intentionally remove FS Access API for the fallback path
      delete window.showOpenFilePicker;
      // @ts-expect-error
      delete window.showSaveFilePicker;
    });
    await gotoEditor(page);
  });

  test('should open File menu', async ({ page }) => {
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'New' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Open \.xosc/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Save \.xosc/ })).toBeVisible();
  });

  test('should create new scenario via File > New', async ({ page }) => {
    // First add an entity so there's something to clear.
    await page.getByRole('tab', { name: /Entities|エンティティ/ }).click();
    await addEntity(page, 'TempEntity');
    await expect(entityList(page).getByText('TempEntity')).toBeVisible();

    // File > New
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: 'New' }).click();

    // Entity should be gone (fresh scenario).
    await expect(entityList(page).getByText('TempEntity')).not.toBeVisible();
  });

  test('should import .xosc file via File > Open', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: /Open \.xosc/ }).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(CUTIN_XOSC);

    // After import, entities from CutIn.xosc (Ego, HAF) should appear.
    const statusBar = page.getByTestId('status-bar');
    await expect(statusBar).not.toContainText(/Entities:\s*0(?!\d)|エンティティ:\s*0(?!\d)/, {
      timeout: 5000,
    });
    await expect(entityList(page).getByText('Ego', { exact: true })).toBeVisible();
  });

  test('should support Undo/Redo with keyboard shortcuts', async ({ page }) => {
    await page.getByRole('tab', { name: /Entities|エンティティ/ }).click();
    await addEntity(page, 'UndoTest');
    await expect(entityList(page).getByText('UndoTest')).toBeVisible();

    // Undo (Ctrl+Z)
    await page.keyboard.press('Control+z');
    await expect(entityList(page).getByText('UndoTest')).not.toBeVisible();

    // Redo (Ctrl+Y)
    await page.keyboard.press('Control+y');
    await expect(entityList(page).getByText('UndoTest')).toBeVisible();
  });

  test('should open Save As dialog via File > Save in project mode', async ({ page }) => {
    // In project mode without an active file path, File > Save routes to the
    // "Save As" dialog (pick a destination inside the project) rather than an
    // immediate download.
    await page.getByRole('tab', { name: /Entities|エンティティ/ }).click();
    await addEntity(page, 'ExportTest');

    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: /Save \.xosc/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/Save Scenario|シナリオを保存/);
  });
});
