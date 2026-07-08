import { test, expect } from '@playwright/test';
import { gotoEditor, addEntity, entityList } from './helpers';

test.describe('Entity CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
    // Entities is the default-active left-sidebar tab; click to be explicit.
    await page.getByRole('tab', { name: /Entities|エンティティ/ }).click();
  });

  test('should open Add Entity dialog when clicking + button', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new entity' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Entity');
  });

  test('should add a new vehicle entity', async ({ page }) => {
    await addEntity(page, 'TestCar');
    await expect(entityList(page).getByText('TestCar')).toBeVisible();
  });

  test('should add a pedestrian entity', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new entity' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Name|名前/).fill('Walker1');

    // Change type to Pedestrian (Radix Select trigger has role combobox).
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Pedestrian' }).click();

    await dialog.getByRole('button', { name: /^Add$|^追加$/ }).click();

    await expect(entityList(page).getByText('Walker1')).toBeVisible();
  });

  test('should not allow adding entity with empty name', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new entity' }).click();

    // Add button should be disabled when name is empty.
    const addButton = page.getByRole('dialog').getByRole('button', { name: /^Add$|^追加$/ });
    await expect(addButton).toBeDisabled();
  });

  test('should select entity and show properties', async ({ page }) => {
    await addEntity(page, 'EgoCar');

    // Click on the entity in the list to select it.
    await entityList(page).getByText('EgoCar').click();

    // Switch to Properties tab.
    await page.getByRole('tab', { name: /Properties|プロパティ/ }).click();

    // PropertyPanel should show the selected entity info.
    await expect(page.getByRole('tabpanel', { name: 'Properties' }).getByText('EgoCar')).toBeVisible();
  });

  test('should delete an entity', async ({ page }) => {
    await addEntity(page, 'ToDelete');
    const item = entityList(page).getByText('ToDelete');
    await expect(item).toBeVisible();

    // The delete button (aria-label="Delete") on the list item is revealed on hover.
    const entityItem = item.locator('xpath=ancestor::div[contains(@class,"glass-item")]');
    await entityItem.hover();
    await entityItem.getByRole('button', { name: 'Delete' }).click();

    await expect(entityList(page).getByText('ToDelete')).not.toBeVisible();
  });

  test('should show entity count in status bar', async ({ page }) => {
    const statusBar = page.getByTestId('status-bar');

    // Initially 0 entities.
    await expect(statusBar).toContainText(/Entities:\s*0(?!\d)|エンティティ:\s*0(?!\d)/);

    await addEntity(page, 'Car1');

    // Count should update.
    await expect(statusBar).toContainText(/Entities:\s*1(?!\d)|エンティティ:\s*1(?!\d)/);
  });
});
