import { test, expect } from '@playwright/test';

test.describe('Entity CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ensure Entities tab is active
    await page.getByRole('tab', { name: /Entities|エンティティ/ }).click();
  });

  test('should open Add Entity dialog when clicking + button', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new entity' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Entity');
  });

  test('should add a new vehicle entity', async ({ page }) => {
    // Open dialog
    await page.getByRole('button', { name: 'Add new entity' }).click();

    // Fill form
    await page.getByLabel(/Name|名前/).fill('TestCar');
    // Type defaults to "Vehicle", so just submit

    // Click Add button
    await page.getByRole('dialog').getByRole('button', { name: /Add|追加/ }).click();

    // Verify entity appears in list
    await expect(page.getByText('TestCar')).toBeVisible();
  });

  test('should add a pedestrian entity', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new entity' }).click();
    await page.getByLabel(/Name|名前/).fill('Walker1');

    // Change type to Pedestrian
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Pedestrian' }).click();

    await page.getByRole('dialog').getByRole('button', { name: /Add|追加/ }).click();

    await expect(page.getByText('Walker1')).toBeVisible();
  });

  test('should not allow adding entity with empty name', async ({ page }) => {
    await page.getByRole('button', { name: 'Add new entity' }).click();

    // Add button should be disabled when name is empty
    const addButton = page.getByRole('dialog').getByRole('button', { name: /Add|追加/ });
    await expect(addButton).toBeDisabled();
  });

  test('should select entity and show properties', async ({ page }) => {
    // First add an entity
    await page.getByRole('button', { name: 'Add new entity' }).click();
    await page.getByLabel(/Name|名前/).fill('EgoCar');
    await page.getByRole('dialog').getByRole('button', { name: /Add|追加/ }).click();

    // Click on the entity to select it
    await page.getByText('EgoCar').click();

    // Switch to Properties tab
    await page.getByRole('tab', { name: /Properties|プロパティ/ }).click();

    // PropertyPanel should show the selected entity info
    await expect(page.getByText('EgoCar')).toBeVisible();
  });

  test('should delete an entity', async ({ page }) => {
    // Add an entity
    await page.getByRole('button', { name: 'Add new entity' }).click();
    await page.getByLabel(/Name|名前/).fill('ToDelete');
    await page.getByRole('dialog').getByRole('button', { name: /Add|追加/ }).click();

    await expect(page.getByText('ToDelete')).toBeVisible();

    // Delete via context menu or delete button on the entity item
    // EntityListItem should have a delete button
    const entityItem = page.getByText('ToDelete').locator('..');
    await entityItem.hover();
    await entityItem.getByRole('button', { name: /Delete|削除/ }).click();

    await expect(page.getByText('ToDelete')).not.toBeVisible();
  });

  test('should show entity count in status bar', async ({ page }) => {
    const statusBar = page.getByTestId('status-bar');

    // Initially 0 entities
    await expect(statusBar).toContainText(/Entities:\s*0(?!\d)|エンティティ:\s*0(?!\d)/);

    // Add an entity
    await page.getByRole('button', { name: 'Add new entity' }).click();
    await page.getByLabel(/Name|名前/).fill('Car1');
    await page.getByRole('dialog').getByRole('button', { name: /Add|追加/ }).click();

    // Count should update
    await expect(statusBar).toContainText(/Entities:\s*1(?!\d)|エンティティ:\s*1(?!\d)/);
  });
});
