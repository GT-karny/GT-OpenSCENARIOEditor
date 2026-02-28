import { test, expect } from '@playwright/test';
import { resolve } from 'path';

const CUTIN_XOSC = resolve(
  __dirname,
  '../../../Thirdparty/openscenario-v1.2.0/Examples/CutIn.xosc',
);

test.describe('File Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open File menu', async ({ page }) => {
    await page.getByRole('button', { name: 'File' }).click();
    await expect(page.getByRole('menuitem', { name: 'New' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Open/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Save/ })).toBeVisible();
  });

  test('should create new scenario via File > New', async ({ page }) => {
    // First add an entity so there's something to clear
    await page.getByRole('tab', { name: /Entities|エンティティ/ }).click();
    await page.getByRole('button', { name: 'Add new entity' }).click();
    await page.getByLabel(/Name|名前/).fill('TempEntity');
    await page.getByRole('dialog').getByRole('button', { name: /Add|追加/ }).click();
    await expect(page.getByText('TempEntity')).toBeVisible();

    // File > New
    await page.getByRole('button', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: 'New' }).click();

    // Entity should be gone (fresh scenario)
    await expect(page.getByText('TempEntity')).not.toBeVisible();
  });

  test('should import .xosc file via File > Open', async ({ page }) => {
    // Set up filechooser listener
    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.getByRole('button', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: /Open/ }).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(CUTIN_XOSC);

    // After import, entities from CutIn.xosc should appear
    // CutIn.xosc typically has entities like "Ego" and "OverTaker"
    await page.waitForTimeout(1000); // Wait for parsing
    const statusBar = page.getByTestId('status-bar');
    await expect(statusBar).not.toContainText(/Entities.*0|エンティティ.*0/);
  });

  test('should support Undo/Redo with keyboard shortcuts', async ({ page }) => {
    // Add an entity
    await page.getByRole('tab', { name: /Entities|エンティティ/ }).click();
    await page.getByRole('button', { name: 'Add new entity' }).click();
    await page.getByLabel(/Name|名前/).fill('UndoTest');
    await page.getByRole('dialog').getByRole('button', { name: /Add|追加/ }).click();
    await expect(page.getByText('UndoTest')).toBeVisible();

    // Undo (Ctrl+Z)
    await page.keyboard.press('Control+z');
    await expect(page.getByText('UndoTest')).not.toBeVisible();

    // Redo (Ctrl+Y)
    await page.keyboard.press('Control+y');
    await expect(page.getByText('UndoTest')).toBeVisible();
  });

  test('should export .xosc via File > Save', async ({ page }) => {
    // Add some content first
    await page.getByRole('tab', { name: /Entities|エンティティ/ }).click();
    await page.getByRole('button', { name: 'Add new entity' }).click();
    await page.getByLabel(/Name|名前/).fill('ExportTest');
    await page.getByRole('dialog').getByRole('button', { name: /Add|追加/ }).click();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    await page.getByRole('button', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: /Save/ }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xosc$/);
  });
});
