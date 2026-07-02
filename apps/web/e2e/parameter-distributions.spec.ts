import { test, expect } from '@playwright/test';
import { gotoEditor } from './helpers';

/**
 * C3 UI: attach a deterministic Range distribution to a declared parameter and
 * preview the concrete variants it expands to.
 *
 * The distribution store is a separate side-document; it is seeded here purely
 * through the UI (Add parameter -> Attach distribution -> Preview variants).
 */
test.describe('Parameter distributions', () => {
  test.beforeEach(async ({ page }) => {
    await gotoEditor(page);
    await page.getByRole('tab', { name: /Variables|変数/ }).click();
  });

  test('attach a Range distribution and preview 3 variants (0/5/10)', async ({ page }) => {
    // 1. Create a parameter via the Variables panel Add dialog.
    await page.getByRole('button', { name: 'Add parameter' }).click();
    const addDialog = page.getByRole('dialog');
    await expect(addDialog).toBeVisible();
    await addDialog.getByLabel(/Name|名前/).fill('EgoSpeed');
    await addDialog.getByRole('button', { name: /^Add$|^追加$/ }).click();
    await expect(addDialog).not.toBeVisible();

    // 2. Open the attach-distribution dialog from the parameter row.
    await page.getByRole('button', { name: 'Attach distribution' }).click();
    const attachDialog = page.getByRole('dialog');
    await expect(attachDialog).toBeVisible();

    // Default type is Range. Fill lower=0, upper=10, step=5.
    const numberInputs = attachDialog.locator('input[type="number"]');
    await numberInputs.nth(0).fill('0'); // lower
    await numberInputs.nth(1).fill('10'); // upper
    await numberInputs.nth(2).fill('5'); // step

    await attachDialog.getByRole('button', { name: /^Attach$|^設定$/ }).click();
    await expect(attachDialog).not.toBeVisible();

    // 3. Open the Distributions accordion and preview variants.
    await page.getByRole('button', { name: /Distributions|分布/ }).click();
    await page.getByRole('button', { name: /Preview variants|バリアントをプレビュー/ }).click();

    const previewDialog = page.getByRole('dialog');
    await expect(previewDialog).toBeVisible();

    // 4. The Range 0..10 step 5 expands to exactly 3 variants: 0, 5, 10.
    const bodyRows = previewDialog.locator('tbody tr');
    await expect(bodyRows).toHaveCount(3);

    const cells = previewDialog.locator('tbody tr td.font-mono');
    await expect(cells.nth(0)).toHaveText('0');
    await expect(cells.nth(1)).toHaveText('5');
    await expect(cells.nth(2)).toHaveText('10');
  });
});
