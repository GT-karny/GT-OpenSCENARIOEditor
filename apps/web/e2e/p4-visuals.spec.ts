import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gotoEditor, dismissDiscardDialog } from './helpers';

/**
 * Visual-capture spec for OpenDRIVE 1.9 Phase 4 (opendrive-1.9-support
 * proposal, D5). Mirrors p3-visuals.spec.ts's CI-skip / tmp-output pattern,
 * but — unlike P3's 3D-viewer captures — every shot here is of the
 * Properties panel UI wired in P4 (semantics editor, controllers,
 * lane flags/access, junction structural rows), so there is no canvas
 * framing/zoom concern: each test just selects an element and screenshots
 * the "Properties" tabpanel.
 *
 * Fixtures (mirrored verbatim into fixtures/opendrive/ alongside the
 * existing 1.9 fixtures):
 *  - GT_min_signal_semantics.xodr — hand-written 1.9 fixture (P4-4): signal
 *    id=100 "SpeedLimit50" carries a rich <semantics> block (speed/lane/
 *    priority/prohibited/supplementary* entries).
 *  - fabriksgatan.xodr — esmini demo map (already used elsewhere in this
 *    repo's fixture set), header revMinor=4. Road 0 has a left lane id=3
 *    type="sidewalk" — one of the six 1.9-deprecated lane types
 *    (sidewalk→walking) — chosen so this capture also shows the
 *    "Deprecated" badge, not just the Lane Flags/Access sections.
 *  - GT_21_common_junction_crosspath_19.xodr — hand-written 1.9 fixture
 *    (P2/P4): junction id=900 "commonCrossPath" (default/common type) with
 *    one authored <crossPath>.
 */

const SHOT_DIR = 'tmp/p4-visuals';
const FIXTURE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures/opendrive');

const SEMANTICS_XODR = resolve(FIXTURE_DIR, 'GT_min_signal_semantics.xodr');
const FABRIKSGATAN_XODR = resolve(FIXTURE_DIR, 'fabriksgatan.xodr');
const GT21_XODR = resolve(FIXTURE_DIR, 'GT_21_common_junction_crosspath_19.xodr');

/** Switch the editor into Road Network mode (scoped to the header toggle). */
async function enterRoadNetworkMode(page: Page): Promise<void> {
  await page.getByRole('banner').getByRole('button', { name: 'Road Network', exact: true }).click();
}

/** Drive File > Open .xodr → pick `filePath` (Road Network mode must be active). */
async function openXodr(page: Page, filePath: string): Promise<void> {
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: /Open \.xodr/ }).click();
  await dismissDiscardDialog(page, 'discard');
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);
}

/** Load `filePath` into a fresh Road Network editor and wait for the road list. */
async function loadRoadNetwork(page: Page, filePath: string, timeout = 30_000): Promise<void> {
  await gotoEditor(page);
  await enterRoadNetworkMode(page);
  await openXodr(page, filePath);
  await expect(page.getByText(/\d+ roads?/).first()).toBeVisible({ timeout });
}

/** The right-hand "Properties" tabpanel (OdrPropertyEditor's mount point). */
function propertiesPanel(page: Page) {
  return page.getByRole('tabpanel', { name: 'Properties' });
}

/** Fixed settle time before a capture (layout/animation settle). */
async function settle(page: Page): Promise<void> {
  await page.waitForTimeout(300);
}

test.describe('OpenDRIVE 1.9 Phase 4 — visual capture', () => {
  test.beforeAll(() => {
    mkdirSync(SHOT_DIR, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    // Force the legacy <input type=file> fallback so the picker is drivable
    // by Playwright (same trick as opendrive-1.9.spec.ts / p3-visuals.spec.ts).
    await page.addInitScript(() => {
      // @ts-expect-error — intentionally remove FS Access API for the fallback path
      delete window.showOpenFilePicker;
      // @ts-expect-error — same as above for the save dialog
      delete window.showSaveFilePicker;
    });
  });

  test('captures the signal semantics editor (GT_min_signal_semantics)', async ({ page }) => {
    test.skip(!!process.env.CI, 'visual-capture spec; not asserting behavior, just a screenshot');
    test.setTimeout(90_000);

    await loadRoadNetwork(page, SEMANTICS_XODR);

    await page.getByRole('tab', { name: 'Signals' }).click();
    await page.getByText('SpeedLimit50', { exact: true }).click();
    const semanticsHeading = page.getByRole('heading', { name: 'Semantics', exact: true });
    await expect(semanticsHeading).toBeVisible();
    // The panel scrolls internally (overflow-y: auto) and Semantics is the
    // last section — scroll it into view so the capture shows the entries,
    // not just whatever fits above the fold at scrollTop=0.
    await semanticsHeading.scrollIntoViewIfNeeded();

    await settle(page);
    await propertiesPanel(page).screenshot({ path: `${SHOT_DIR}/semantics-editor.png` });
  });

  test('captures the Controllers tab + property editor (Ex_Objects)', async ({ page }) => {
    test.skip(!!process.env.CI, 'visual-capture spec; not asserting behavior, just a screenshot');
    test.setTimeout(90_000);

    await loadRoadNetwork(page, resolve(FIXTURE_DIR, 'Ex_Objects.xodr'));

    await page.getByRole('tab', { name: 'Controllers' }).click();
    await page.getByRole('button', { name: 'Add controller' }).click();
    await expect(page.getByText('Controller Properties')).toBeVisible();

    await settle(page);
    await page.screenshot({ path: `${SHOT_DIR}/controllers-tab.png` });
  });

  test('captures Lane Flags + Access with a deprecated-type badge (fabriksgatan, sidewalk lane)', async ({
    page,
  }) => {
    test.skip(!!process.env.CI, 'visual-capture spec; not asserting behavior, just a screenshot');
    test.setTimeout(90_000);

    await loadRoadNetwork(page, FABRIKSGATAN_XODR, 60_000);

    await page.getByText('Road 0', { exact: true }).click();
    await page.getByRole('tab', { name: 'Cross Section' }).click();
    const lane = page.locator('rect').filter({ hasText: 'Lane 3 (sidewalk)' });
    const box = await lane.boundingBox();
    if (!box) throw new Error('sidewalk lane (id=3) not found');
    await page.mouse.click(box.x + box.width / 2, box.y + 4);

    await expect(page.getByText('Lane Properties')).toBeVisible();
    await expect(page.getByText('Deprecated', { exact: true })).toBeVisible();
    await expect(page.getByText('Lane Flags')).toBeVisible();
    await expect(page.getByText('Access', { exact: false }).first()).toBeVisible();

    await settle(page);
    await propertiesPanel(page).screenshot({ path: `${SHOT_DIR}/lane-flags-access.png` });
  });

  test('captures junction structural editing (crossPaths, GT_21)', async ({ page }) => {
    test.skip(!!process.env.CI, 'visual-capture spec; not asserting behavior, just a screenshot');
    test.setTimeout(90_000);

    await loadRoadNetwork(page, GT21_XODR);

    await page.getByRole('tab', { name: 'Junctions' }).click();
    await page.getByText('commonCrossPath', { exact: true }).click();
    await expect(page.getByText('Cross Paths', { exact: true })).toBeVisible();

    await settle(page);
    await propertiesPanel(page).screenshot({ path: `${SHOT_DIR}/junction-structural.png` });
  });
});
