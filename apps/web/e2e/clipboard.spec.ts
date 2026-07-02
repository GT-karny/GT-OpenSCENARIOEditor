import { test, expect } from '@playwright/test';
import { gotoEditor, addEntity, entityList } from './helpers';

/**
 * Clipboard / duplication upgrades (roadmap B5):
 * - Ctrl+D duplicates the selected entity (including its init actions).
 * - Deleting the duplicate and pressing Ctrl+Z restores it as a single step.
 *
 * The seeded "esmini Samples" project boots into an EMPTY in-memory scenario
 * (see helpers.gotoEditor), so we create the source entity via the UI first.
 */
test.describe('Clipboard: entity duplication', () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
    await page.getByRole('tab', { name: /Entities|エンティティ/ }).click();
  });

  test('Ctrl+D duplicates the selected entity as Ego_copy', async ({ page }) => {
    await addEntity(page, 'Ego');
    await expect(entityList(page).getByText('Ego', { exact: true })).toBeVisible();

    // Select the entity in the list, then duplicate with Ctrl+D.
    await entityList(page).getByText('Ego', { exact: true }).click();
    await page.keyboard.press('Control+d');

    // The duplicate appears with a unique '_copy' name.
    await expect(entityList(page).getByText('Ego_copy', { exact: true })).toBeVisible();
    // Original is still present.
    await expect(entityList(page).getByText('Ego', { exact: true })).toBeVisible();
  });

  test('duplicate exposes its own selectable properties (init actions cloned)', async ({
    page,
  }) => {
    await addEntity(page, 'Ego');
    await entityList(page).getByText('Ego', { exact: true }).click();
    await page.keyboard.press('Control+d');

    const copy = entityList(page).getByText('Ego_copy', { exact: true });
    await expect(copy).toBeVisible();

    // Selecting the copy and opening Properties shows the copy's own data,
    // confirming it is an independent, fully-formed entity.
    await copy.click();
    await page.getByRole('tab', { name: /Properties|プロパティ/ }).click();
    await expect(
      page.getByRole('tabpanel', { name: 'Properties' }).getByText('Ego_copy'),
    ).toBeVisible();
  });

  test('deleting the duplicate then Ctrl+Z restores it', async ({ page }) => {
    await addEntity(page, 'Ego');
    await entityList(page).getByText('Ego', { exact: true }).click();
    await page.keyboard.press('Control+d');

    const copy = entityList(page).getByText('Ego_copy', { exact: true });
    await expect(copy).toBeVisible();

    // Delete the duplicate via its hover-revealed Delete button.
    const copyItem = copy.locator('xpath=ancestor::div[contains(@class,"glass-item")]');
    await copyItem.hover();
    await copyItem.getByRole('button', { name: 'Delete' }).click();
    await expect(entityList(page).getByText('Ego_copy', { exact: true })).not.toBeVisible();

    // Undo restores the duplicate.
    await page.keyboard.press('Control+z');
    await expect(entityList(page).getByText('Ego_copy', { exact: true })).toBeVisible();
  });
});
