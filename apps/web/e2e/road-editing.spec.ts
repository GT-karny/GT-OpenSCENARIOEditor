import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { gotoEditor, dismissDiscardDialog } from './helpers';

/**
 * E2E coverage for OpenDRIVE 1.9 Phase 4 (opendrive-1.9-support proposal, D5):
 * the editing-flow UI wired in P4 waves X1-X4 (elevation drag, controller
 * CRUD, lane direction/flags, version auto-bump-on-save, signal semantics).
 * Each test independently loads its own fixture (fresh page per Playwright
 * test — there is no continuous browser session to share across tests), but
 * several reuse the same fixture FILE where a single document conveniently
 * covers more than one behaviour (Ex_Objects.xodr: one elevation control
 * point + a driving lane, header revMinor=8 so it also exercises the
 * auto-bump-on-save path).
 */

const FIXTURE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures/opendrive');

/** ASAM 1.9 official example, header revMinor=8: single road (id=1, name=""),
 * one elevation control point (s=0,a=0), several lane sections incl. a
 * driving lane (id=-1) in the active (s=0) section. Reused for the
 * elevation-drag, lane-direction, and version-auto-bump tests. */
const OBJECTS_XODR = resolve(FIXTURE_DIR, 'Ex_Objects.xodr');
/** Hand-written 1.9 fixture (GT, P4-4): one signal with a rich <semantics>
 * block, one with an empty <semantics/>. */
const SEMANTICS_XODR = resolve(FIXTURE_DIR, 'GT_min_signal_semantics.xodr');

/** Stable ID of the server-seeded sample project (project-service.ts). */
const SAMPLE_PROJECT_ID = 'esmini-samples';

/** Test-owned files for the version-auto-bump save test. */
const VERSION_BUMP_XODR_REL = 'xodr/e2e-version-bump.xodr';
const VERSION_BUMP_XOSC_NAME = 'e2e-version-bump.xosc';
const VERSION_BUMP_XOSC_REL = `xosc/${VERSION_BUMP_XOSC_NAME}`;

/** Minimal single-entity scenario referencing the seeded road (mirrors
 * opendrive-1.9.spec.ts's INCLUDE_XOSC template). */
const VERSION_BUMP_XOSC = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="3" date="2026-07-08T00:00:00" description="e2e version-bump" author="e2e"/>
  <ParameterDeclarations/>
  <CatalogLocations/>
  <RoadNetwork>
    <LogicFile filepath="../xodr/e2e-version-bump.xodr"/>
  </RoadNetwork>
  <Entities>
    <ScenarioObject name="Ego">
      <Vehicle name="Ego" vehicleCategory="car">
        <BoundingBox>
          <Center x="1.4" y="0" z="0.9"/>
          <Dimensions width="2.0" length="4.5" height="1.8"/>
        </BoundingBox>
        <Performance maxSpeed="69.444" maxAcceleration="200" maxDeceleration="10"/>
        <Axles>
          <FrontAxle maxSteering="0.5" wheelDiameter="0.6" trackWidth="1.8" positionX="3.1" positionZ="0.3"/>
          <RearAxle maxSteering="0" wheelDiameter="0.6" trackWidth="1.8" positionX="0" positionZ="0.3"/>
        </Axles>
        <Properties/>
      </Vehicle>
    </ScenarioObject>
  </Entities>
  <Storyboard>
    <Init>
      <Actions>
        <Private entityRef="Ego">
          <PrivateAction>
            <TeleportAction>
              <Position><WorldPosition x="0" y="0" z="0" h="0"/></Position>
            </TeleportAction>
          </PrivateAction>
        </Private>
      </Actions>
    </Init>
    <StopTrigger>
      <ConditionGroup>
        <Condition name="stop" delay="0" conditionEdge="none">
          <ByValueCondition>
            <SimulationTimeCondition value="3" rule="greaterThan"/>
          </ByValueCondition>
        </Condition>
      </ConditionGroup>
    </StopTrigger>
  </Storyboard>
</OpenSCENARIO>`;

/** PUT a file into the sample project via the server file API. */
async function writeProjectFile(
  request: APIRequestContext,
  relativePath: string,
  content: string,
): Promise<void> {
  const encoded = relativePath.split('/').map(encodeURIComponent).join('/');
  const res = await request.put(`/api/projects/${SAMPLE_PROJECT_ID}/files/${encoded}`, {
    data: { content },
  });
  expect(res.ok(), `write ${relativePath}`).toBeTruthy();
}

/** GET a file's raw text content from the sample project via the server file API. */
async function readProjectFile(request: APIRequestContext, relativePath: string): Promise<string> {
  const encoded = relativePath.split('/').map(encodeURIComponent).join('/');
  const res = await request.get(`/api/projects/${SAMPLE_PROJECT_ID}/files/${encoded}`);
  expect(res.ok(), `read ${relativePath}`).toBeTruthy();
  const body = (await res.json()) as { content: string };
  return body.content;
}

/** Switch the editor into Road Network mode (scoped to the header toggle). */
async function enterRoadNetworkMode(page: Page): Promise<void> {
  await page.getByRole('banner').getByRole('button', { name: 'Road Network', exact: true }).click();
}

/** Open a scenario from the project file tree (mirrors smoke.spec.ts / opendrive-1.9.spec.ts). */
async function openScenarioFromTree(page: Page, fileName: string): Promise<void> {
  await page.getByRole('button', { name: 'Show file explorer' }).click();
  await page.getByRole('button', { name: 'xosc', exact: true }).click();
  await page.getByRole('button', { name: fileName }).click();
  await dismissDiscardDialog(page, 'discard');
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

/**
 * The `<input>` immediately following a given exact-text `<label>` (same
 * pattern as opendrive-1.9.spec.ts's labeledInput — a `div.grid` parent +
 * `has:` filter is ambiguous when fields sit side-by-side in a 2-column row,
 * so the label-sibling XPath is used instead).
 */
function labeledInput(page: Page, labelText: string) {
  return page.locator(
    `xpath=.//label[normalize-space(text())="${labelText}"]/following-sibling::input[1]`,
  );
}

/** The EnumSelect trigger `<button role="combobox">` immediately following a
 * given exact-text `<label>` (same label-sibling approach as labeledInput,
 * for the non-`<input>` EnumSelect controls). */
function labeledCombobox(page: Page, labelText: string) {
  return page.locator(
    `xpath=.//label[normalize-space(text())="${labelText}"]/following-sibling::button[1]`,
  );
}

/** The single elevation control-point `<circle>` (has a nested `<title>`;
 * the s-position indicator circle does not, so this is unambiguous even
 * with only one elevation record in the fixture). */
function elevationControlPoint(page: Page) {
  return page.locator('circle:has(title)').first();
}

/** The cross-section lane `<rect>` for a given lane id + type (its `<title>`
 * reads "Lane {id} ({type})"; only the active lane section's lanes render at
 * a time, so this stays unambiguous even across multi-section roads). */
function crossSectionLane(page: Page, laneId: number, laneType: string) {
  return page.locator('rect').filter({ hasText: `Lane ${laneId} (${laneType})` });
}

/**
 * Click a cross-section lane via raw `page.mouse` at a point near its
 * top-center. `locator.click()` (even `force: true`, which only skips
 * actionability checks but still dispatches at the element's own
 * center/corner) keeps landing on an overlapping sibling — the vertically
 * centered lane-type `<text>` at the rect's true center, or (for lanes with
 * a width-drag handle) the ~8px-wide transparent boundary-handle `<rect>`
 * layered at the lane's edges. A point near the top edge, horizontally
 * centered, clears both.
 */
async function clickCrossSectionLane(
  page: Page,
  laneId: number,
  laneType: string,
): Promise<void> {
  const lane = crossSectionLane(page, laneId, laneType);
  const box = await lane.boundingBox();
  if (!box) throw new Error(`cross-section lane ${laneId} (${laneType}) not found`);
  await page.mouse.click(box.x + box.width / 2, box.y + 4);
}

test.describe('OpenDRIVE 1.9 Phase 4 — editing flows', () => {
  // WASM compile + load inside Chromium can exceed the default 30s.
  test.setTimeout(120_000);

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

  test('elevation control-point drag persists and Ctrl+Z undoes it (Ex_Objects)', async ({
    page,
  }) => {
    await loadRoadNetwork(page, OBJECTS_XODR);

    await page.getByText('Road 1', { exact: true }).click();
    await page.getByRole('tab', { name: 'Elevation' }).click();

    const point = elevationControlPoint(page);
    await expect(point).toBeVisible();
    const titleBefore = await point.locator('title').textContent();
    expect(titleBefore).toContain('a=0.000');

    const box = await point.boundingBox();
    if (!box) throw new Error('elevation control point not found');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    // Drag upward (smaller clientY) — the graph is Z-up, so this raises the
    // control point's elevation away from 0.
    await page.mouse.move(cx, cy - 40, { steps: 5 });
    await page.mouse.up();

    const titleAfter = await point.locator('title').textContent();
    const match = titleAfter?.match(/a=(-?[\d.]+)/);
    expect(match, `title text: ${titleAfter}`).toBeTruthy();
    expect(Math.abs(Number(match![1]))).toBeGreaterThan(0.01);

    // Road-focused Ctrl+Z (focusedBase === 'roadNetwork') reverts the single
    // commit fired on mouse-up (drag preview itself is not undoable — only
    // the mouse-up commit is, per the design's "one undo step per drag").
    await page.keyboard.press('Control+z');
    const titleReverted = await point.locator('title').textContent();
    expect(titleReverted).toContain('a=0.000');
  });

  test('controller add, rename, undo chain, and delete (Ex_Objects)', async ({ page }) => {
    await loadRoadNetwork(page, OBJECTS_XODR);

    await page.getByRole('tab', { name: 'Controllers' }).click();
    // "{n} controller" singular / "{n} controllers" plural (ControllerListPanel).
    const countText = (n: number) => `${n} controller${n !== 1 ? 's' : ''}`;
    const countLabel = page.getByText(/^\d+ controllers?$/);
    const before = await countLabel.textContent();
    const beforeCount = Number(before?.match(/\d+/)?.[0] ?? '0');

    // Add — property panel switches to the new controller with a default name.
    await page.getByRole('button', { name: 'Add controller' }).click();
    await expect(page.getByText('Controller Properties')).toBeVisible();
    const nameInput = labeledInput(page, 'Name');
    const defaultName = await nameInput.inputValue();
    expect(defaultName).toMatch(/^Controller \d+$/);
    await expect(countLabel).toHaveText(countText(beforeCount + 1));

    // Rename — the sidebar list item reflects the new name.
    await nameInput.fill('RampMeterA');
    await expect(page.getByText('RampMeterA', { exact: true })).toBeVisible();

    // Undo chain: first undo reverts the rename, second reverts the add.
    await page.keyboard.press('Control+z');
    await expect(nameInput).toHaveValue(defaultName);
    await page.keyboard.press('Control+z');
    await expect(countLabel).toHaveText(countText(beforeCount));

    // Redo both steps back, then delete explicitly via the list item's
    // delete button (exercising the D of CRUD, not just undo).
    await page.keyboard.press('Control+y');
    await page.keyboard.press('Control+y');
    await expect(page.getByText('RampMeterA', { exact: true })).toBeVisible();
    await expect(countLabel).toHaveText(countText(beforeCount + 1));

    const listItem = page.locator('.glass-item', { hasText: 'RampMeterA' });
    await listItem.hover();
    await listItem.getByRole('button', { name: 'Delete controller' }).click();
    await expect(countLabel).toHaveText(countText(beforeCount));
    await expect(page.getByText('RampMeterA', { exact: true })).toHaveCount(0);
  });

  test('lane direction edit persists and Ctrl+Z undoes it (Ex_Objects, lane -1)', async ({
    page,
  }) => {
    await loadRoadNetwork(page, OBJECTS_XODR);

    await page.getByText('Road 1', { exact: true }).click();
    await page.getByRole('tab', { name: 'Cross Section' }).click();
    await clickCrossSectionLane(page, -1, 'driving');
    await expect(page.getByText('Lane Properties')).toBeVisible();
    await expect(page.getByText('Lane Flags')).toBeVisible();

    const directionTrigger = labeledCombobox(page, 'Direction');
    await expect(directionTrigger).toHaveText('(none)');
    await directionTrigger.click();
    await page.getByRole('option', { name: 'reversed', exact: true }).click();
    await expect(directionTrigger).toHaveText('reversed');

    await page.keyboard.press('Control+z');
    await expect(directionTrigger).toHaveText('(none)');
  });

  test('signal semantics: add entry, edit value, undo (GT_min_signal_semantics)', async ({
    page,
  }) => {
    await loadRoadNetwork(page, SEMANTICS_XODR);

    await page.getByRole('tab', { name: 'Signals' }).click();
    await page.getByText('EmptySemantics', { exact: true }).click();

    const semanticsSection = page
      .getByRole('heading', { name: 'Semantics', exact: true })
      .locator('xpath=ancestor::div[contains(@class,"pb-3")][1]');
    await expect(semanticsSection.getByText('No semantics defined')).toBeVisible();

    await semanticsSection.getByRole('button', { name: 'Add entry' }).click();
    await expect(semanticsSection.getByText('No semantics defined')).toHaveCount(0);

    const valueInput = semanticsSection.locator(
      'xpath=.//label[normalize-space(text())="Value"]/following-sibling::input[1]',
    );
    await valueInput.fill('80');
    await expect(valueInput).toHaveValue('80');

    // First undo reverts the value edit; second removes the added entry.
    await page.keyboard.press('Control+z');
    await expect(valueInput).toHaveValue('');
    await page.keyboard.press('Control+z');
    await expect(semanticsSection.getByText('No semantics defined')).toBeVisible();
  });

  test('editing a pre-1.9 document to add a 1.9 construct and saving auto-bumps revMinor to 9', async ({
    page,
    request,
  }) => {
    await writeProjectFile(request, VERSION_BUMP_XODR_REL, readFileSync(OBJECTS_XODR, 'utf-8'));
    await writeProjectFile(request, VERSION_BUMP_XOSC_REL, VERSION_BUMP_XOSC);

    await gotoEditor(page);
    await openScenarioFromTree(page, VERSION_BUMP_XOSC_NAME);
    await expect(page.getByTestId('status-bar')).not.toContainText(/Entities:\s*0(?!\d)/, {
      timeout: 10_000,
    });

    await enterRoadNetworkMode(page);
    await expect(page.getByText(/\d+ roads?/).first()).toBeVisible({ timeout: 30_000 });

    // Add a genuine 1.9 construct via the UI: lane @direction (detectOdr19Constructs
    // — packages/opendrive/src/version/detect-odr19.ts — flags any lane with
    // `direction !== undefined`). The source header declares revMinor=8.
    await page.getByText('Road 1', { exact: true }).click();
    await page.getByRole('tab', { name: 'Cross Section' }).click();
    await clickCrossSectionLane(page, -1, 'driving');
    const directionTrigger = labeledCombobox(page, 'Direction');
    await directionTrigger.click();
    await page.getByRole('option', { name: 'reversed', exact: true }).click();
    await expect(directionTrigger).toHaveText('reversed');

    // Save via the app's File > Save path (project mode + known xodr path,
    // set by autoLoadXodr — writes straight to the project file via the API,
    // no Save-As dialog). The regex intentionally has no leading anchor but
    // still can't match "Save As .xodr" (no "Save " immediately followed by
    // ".xodr" substring in that longer label).
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: /Save \.xodr/ }).click();

    await expect(page.getByText(/Saved as OpenDRIVE 1\.9/)).toBeVisible({ timeout: 10_000 });

    const saved = await readProjectFile(request, VERSION_BUMP_XODR_REL);
    expect(saved).toMatch(/revMinor="9"/);
  });
});
