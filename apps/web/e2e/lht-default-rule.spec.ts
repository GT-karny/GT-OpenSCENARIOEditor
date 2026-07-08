import { test, expect, type Page } from '@playwright/test';
import { gotoEditor, dismissDiscardDialog } from './helpers';

/**
 * Default traffic rule workflow convenience (LHT/RHT) in the Road Network editor.
 *
 * OpenDRIVE has no document-level traffic rule (only a per-<road> `rule`
 * attribute, missing = RHT). The editor exposes a per-session default that new
 * roads inherit, plus a bulk "Apply to all roads" action for retrofitting an
 * existing network (e.g. converting a map to Japan-style left-hand traffic).
 *
 * Road loading follows preview.spec.ts conventions: opening a scenario whose
 * RoadNetwork/LogicFile resolves in the seeded project auto-loads the .xodr,
 * so the Road Network editor is populated with real roads.
 */

/** Open a scenario file from the seeded project's file tree. */
async function openScenario(page: Page, fileName: string): Promise<void> {
  await page.getByRole('button', { name: 'Show file explorer' }).click();
  await page.getByRole('button', { name: 'xosc', exact: true }).click();
  await page.getByRole('button', { name: fileName }).click();
  // Project-tree opens route through the unsaved-changes guard; the seeded
  // default document is dirty, so discard it to proceed to the scenario load.
  await dismissDiscardDialog(page, 'discard');
}

test.describe('Road Network: default traffic rule', () => {
  test('applies the LHT default to all roads in a loaded network', async ({ page }) => {
    await gotoEditor(page);

    // Load a scenario whose road network resolves in the seeded project.
    await openScenario(page, 'traffic_lights.xosc');
    await expect(page.getByTestId('status-bar')).toBeVisible();

    // Switch to Road Network mode (scope to the header — a Properties-panel
    // accordion section shares the same accessible name).
    await page.getByRole('banner').getByRole('button', { name: 'Road Network' }).click();

    // Road list should be populated once the network is loaded.
    await expect(page.getByText(/\d+ roads?/).first()).toBeVisible({ timeout: 15_000 });

    // Activate the Road-creation tool to reveal the Road Style panel, which
    // hosts the default-traffic-rule toggle and the bulk-apply action.
    await page.getByRole('button', { name: 'Road', exact: true }).click();
    await expect(page.getByText('Traffic rule')).toBeVisible();

    // Default is RHT.
    const rhtOption = page.getByRole('button', { name: 'RHT', exact: true });
    const lhtOption = page.getByRole('button', { name: 'LHT', exact: true });
    await expect(rhtOption).toHaveClass(/selected/);

    // Switch the default to LHT and apply it to every existing road.
    await lhtOption.click();
    await expect(lhtOption).toHaveClass(/selected/);
    await page.getByRole('button', { name: 'Apply to all roads' }).click();

    // Switch back to the Select tool and open a road's property editor.
    await page.getByRole('button', { name: 'Select', exact: true }).click();
    const firstRoad = page.locator('.glass-item').first();
    await expect(firstRoad).toBeVisible();
    await firstRoad.click();

    // The Rule field should now read LHT.
    const ruleRow = page.locator('div.grid', { has: page.getByText('Rule', { exact: true }) });
    const ruleTrigger = ruleRow.getByRole('combobox');
    await expect(ruleTrigger).toBeVisible({ timeout: 10_000 });
    await expect(ruleTrigger).toContainText('LHT');
  });
});
