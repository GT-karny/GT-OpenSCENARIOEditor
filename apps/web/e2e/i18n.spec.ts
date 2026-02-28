import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should start in English by default', async ({ page }) => {
    const langToggle = page.getByTestId('language-toggle');
    await expect(langToggle).toContainText('EN');

    // English labels should be visible
    await expect(page.getByRole('tab', { name: 'Entities' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Properties' })).toBeVisible();
  });

  test('should switch to Japanese when clicking language toggle', async ({ page }) => {
    const langToggle = page.getByTestId('language-toggle');
    await langToggle.click();

    // Toggle should now show JA
    await expect(langToggle).toContainText('JA');

    // Japanese labels should appear
    await expect(page.getByRole('tab', { name: 'エンティティ' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'プロパティ' })).toBeVisible();
  });

  test('should switch back to English when clicking toggle again', async ({ page }) => {
    const langToggle = page.getByTestId('language-toggle');

    // Switch to Japanese
    await langToggle.click();
    await expect(langToggle).toContainText('JA');

    // Switch back to English
    await langToggle.click();
    await expect(langToggle).toContainText('EN');

    // English labels should be back
    await expect(page.getByRole('tab', { name: 'Entities' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Properties' })).toBeVisible();
  });

  test('should translate tab labels on right sidebar', async ({ page }) => {
    const langToggle = page.getByTestId('language-toggle');
    await langToggle.click();

    await expect(page.getByRole('tab', { name: 'テンプレート' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'バリデーション' })).toBeVisible();
  });

  test('should translate status bar labels', async ({ page }) => {
    const statusBar = page.getByTestId('status-bar');

    // English
    await expect(statusBar).toContainText('Entities');

    // Switch to Japanese
    await page.getByTestId('language-toggle').click();
    await expect(statusBar).toContainText('エンティティ');
  });
});
