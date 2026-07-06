import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { gotoEditor, dismissDiscardDialog } from './helpers';

/**
 * E2E coverage for Phase S2 scenario/road reference behaviors (already
 * implemented and committed). Two behaviors are pinned:
 *
 *  1. Road Save-As syncs the scenario's logicFile (project mode) — saving the
 *     open road under a new project path re-points the open scenario's
 *     `roadNetwork.logicFile.filepath` at the new location through the
 *     UNDOABLE UpdateRoadNetwork command (document-references.ts
 *     syncLogicFileAfterRoadSaveAs), toasts an info message (i18n
 *     `labels.logicFileSynced`), and correctly marks the scenario dirty (the
 *     reference change is real unsaved document content) while the
 *     just-saved road stays clean. Undoing in Scenario mode reverts the
 *     reference and the scenario reads clean again.
 *
 *  2. rawXml revision-tagged cache (simulation-xodr.ts) — the verbatim
 *     editor xodr text is valid only for the OpenDRIVE command-history
 *     revision it was captured at. Editing the road through the UI (bumping
 *     that revision) invalidates the cache, so Run re-serializes the parsed
 *     road model and warns (`simulation.degradedRoad`) instead of silently
 *     using stale/incorrect text. The edited road must still reach the
 *     simulator via the re-serialized fallback — it is degraded, not lost.
 *     (The unedited-road, non-degraded case is already covered by
 *     opendrive-1.9.spec.ts's rawXml-passthrough test.)
 *
 * Loading/mode-switch mechanics mirror opendrive-1.9.spec.ts and
 * lht-default-rule.spec.ts: scenarios are seeded into the server-backed
 * sample project via the file API and opened from the project file tree
 * (auto-loading their LogicFile road), and Road Network / Scenario modes are
 * reached via the header banner toggle.
 */

const FIXTURE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures/opendrive');

/** Virtual-junction fixture (GT_23_virtual_junction_17, 3 roads) — small, loads fast. */
const VIRTUAL_JUNCTION_XODR = resolve(FIXTURE_DIR, 'GT_23_virtual_junction_17.xodr');

/** Stable ID of the server-seeded sample project (project-service.ts). */
const SAMPLE_PROJECT_ID = 'esmini-samples';

/** Test-owned files for the road Save-As / logicFile-sync test. */
const REFSYNC_XODR_REL = 'xodr/e2e-refsync.xodr';
const REFSYNC_XOSC_NAME = 'e2e-refsync.xosc';
const REFSYNC_XOSC_REL = `xosc/${REFSYNC_XOSC_NAME}`;
const REFSYNC_RENAMED_BASENAME = 'e2e-refsync-renamed';
const REFSYNC_RENAMED_XODR_REL = `xodr/${REFSYNC_RENAMED_BASENAME}.xodr`;

/** Test-owned files for the degraded-road-simulates test. */
const DEGRADED_XODR_REL = 'xodr/e2e-degraded.xodr';
const DEGRADED_XOSC_NAME = 'e2e-degraded.xosc';
const DEGRADED_XOSC_REL = `xosc/${DEGRADED_XOSC_NAME}`;

/**
 * Stable substring of `labels.logicFileSynced`
 * (packages/i18n .../common.ts): "Scenario road reference updated to
 * {{path}} (unsaved)." Kept as a substring (no {{path}} interpolation) so it
 * matches regardless of the exact saved path.
 */
const LOGIC_FILE_SYNCED_SUBSTRING = 'Scenario road reference updated';

/**
 * Stable substring of `warnings.logicFileCorrected`
 * (packages/i18n .../common.ts): "Scenario road reference was inconsistent
 * and corrected to {{path}} on save." This must NOT appear for a reference
 * that was synced via the road Save-As path: reconcileLogicFileForSave
 * (document-references.ts) treats the internal project-root-relative form
 * written by the sync as consistent with the session road, so the save-time
 * conversion to the xosc-relative form is silent, not a correction warning.
 */
const LOGIC_FILE_CORRECTED_SUBSTRING = 'Scenario road reference was inconsistent';

/**
 * Stable substring of `simulation.degradedRoad`
 * (packages/i18n .../common.ts). Toasted synchronously at Run
 * (SimulationButtons.tsx handleRun) when the raw xodr text was invalid for
 * the current OpenDRIVE revision and the payload had to be re-serialized
 * from the parsed road model.
 */
const DEGRADED_ROAD_SUBSTRING = 'Regenerating the edited road data for simulation';

/**
 * Minimal single-entity scenario whose RoadNetwork/LogicFile points at the
 * given (xosc-relative) road path. Ego + an init TeleportAction is enough to
 * populate the entity list and to let Run reach the simulator.
 */
function makeXosc(xodrRelFromXosc: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="3" date="2026-07-06T00:00:00" description="e2e road-references" author="e2e"/>
  <ParameterDeclarations/>
  <CatalogLocations/>
  <RoadNetwork>
    <LogicFile filepath="${xodrRelFromXosc}"/>
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
}

const REFSYNC_XOSC = makeXosc('../xodr/e2e-refsync.xodr');
const DEGRADED_XOSC = makeXosc('../xodr/e2e-degraded.xodr');

/** PUT a file into the sample project via the server file API. */
async function writeProjectFile(
  request: APIRequestContext,
  relativePath: string,
  content: string,
): Promise<void> {
  const encoded = relativePath.split('/').map(encodeURIComponent).join('/');
  const res = await request.put(
    `/api/projects/${SAMPLE_PROJECT_ID}/files/${encoded}`,
    { data: { content } },
  );
  expect(res.ok(), `write ${relativePath}`).toBeTruthy();
}

/**
 * GET a file's content back from the sample project via the server file API
 * (mirrors writeProjectFile's URL encoding), so a test can pin the actual
 * serialized-to-disk value rather than only in-app toasts/state.
 */
async function readProjectFile(
  request: APIRequestContext,
  relativePath: string,
): Promise<string> {
  const encoded = relativePath.split('/').map(encodeURIComponent).join('/');
  const res = await request.get(`/api/projects/${SAMPLE_PROJECT_ID}/files/${encoded}`);
  expect(res.ok(), `read ${relativePath}`).toBeTruthy();
  const body = (await res.json()) as { content: string };
  return body.content;
}

/** Switch the editor into Road Network mode (scoped to the header toggle). */
async function enterRoadNetworkMode(page: Page): Promise<void> {
  await page.getByRole('banner').getByRole('button', { name: 'Road Network' }).click();
}

/** Switch the editor back into Scenario mode (scoped to the header toggle). */
async function enterScenarioMode(page: Page): Promise<void> {
  await page.getByRole('banner').getByRole('button', { name: 'Scenario', exact: true }).click();
}

/** Open a scenario from the project file tree (mirrors opendrive-1.9.spec.ts). */
async function openScenarioFromTree(page: Page, fileName: string): Promise<void> {
  await page.getByRole('button', { name: 'Show file explorer' }).click();
  await page.getByRole('button', { name: 'xosc', exact: true }).click();
  await page.getByRole('button', { name: fileName }).click();
  // Project-tree opens now route through the unsaved-changes guard; the seeded
  // default document is dirty, so discard it to proceed to the scenario load.
  await dismissDiscardDialog(page, 'discard');
}

/** Wait until the scenario's entities have loaded (status bar leaves "Entities: 0"). */
async function waitForEntitiesLoaded(page: Page): Promise<void> {
  await expect(page.getByTestId('status-bar')).not.toContainText(/Entities:\s*0(?!\d)/, {
    timeout: 10_000,
  });
}

/** Wait until the Road Network editor's road list has populated. */
async function waitForRoadsLoaded(page: Page): Promise<void> {
  await expect(page.getByText(/\d+ roads?/).first()).toBeVisible({ timeout: 30_000 });
}

test.describe('Scenario/road reference sync', () => {
  // WASM compile + load inside Chromium can exceed the default 30s (Test 2 runs it).
  test.setTimeout(120_000);

  test('road Save-As re-points the scenario logicFile, undoably', async ({ page, request }) => {
    await writeProjectFile(request, REFSYNC_XODR_REL, readFileSync(VIRTUAL_JUNCTION_XODR, 'utf-8'));
    await writeProjectFile(request, REFSYNC_XOSC_REL, REFSYNC_XOSC);

    await gotoEditor(page);
    await openScenarioFromTree(page, REFSYNC_XOSC_NAME);
    await waitForEntitiesLoaded(page);

    // Freshly loaded: both documents are clean.
    await expect(page.getByTestId('dirty-indicator-scenario')).not.toBeVisible();
    await expect(page.getByTestId('dirty-indicator-roadNetwork')).not.toBeVisible();

    await enterRoadNetworkMode(page);
    await waitForRoadsLoaded(page);

    // File > Save As .xodr → project-mode SaveAsDialog (no native picker involved).
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: /Save As \.xodr/ }).click();

    const saveAsDialog = page.getByRole('dialog', { name: 'Save Scenario' });
    await expect(saveAsDialog).toBeVisible();
    await saveAsDialog.getByRole('button', { name: 'xodr', exact: true }).click();
    await saveAsDialog.getByLabel('File name').fill(REFSYNC_RENAMED_BASENAME);
    await saveAsDialog.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(saveAsDialog).not.toBeVisible();

    // The undoable logicFile sync fired (document-references.ts
    // syncLogicFileAfterRoadSaveAs → updateRoadNetwork).
    await expect(page.getByText(LOGIC_FILE_SYNCED_SUBSTRING)).toBeVisible();

    // The reference update is real unsaved scenario content: scenario dirty.
    await expect(page.getByTestId('dirty-indicator-scenario')).toBeVisible();
    // The road itself was just saved: clean.
    await expect(page.getByTestId('dirty-indicator-roadNetwork')).not.toBeVisible();

    // Undo in Scenario mode targets the scenario's command history (see
    // use-keyboard-shortcuts.ts: Ctrl+Z routes by focusedBase) and reverts the
    // sync, bringing the revision back to the load baseline.
    await enterScenarioMode(page);
    await page.keyboard.press('Control+z');
    await expect(page.getByTestId('dirty-indicator-scenario')).not.toBeVisible();

    // Redo brings the synced reference (and the dirty flag) back.
    await page.keyboard.press('Control+y');
    await expect(page.getByTestId('dirty-indicator-scenario')).toBeVisible();

    // Persist and pin the actual on-disk result. The toast/dirty-indicator
    // checks above would pass even if the reconcile/sync path wrote the wrong
    // path to disk — only reading the saved file back closes that gap.
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: /Save \.xosc/ }).click();

    // .last(): the earlier road Save-As also toasted "File saved" and may still
    // be visible (sonner toasts stack until their own timer expires), so two
    // may match here — .last() always resolves to the most recently created
    // one (this scenario save) regardless of whether the older one lingers.
    await expect(page.getByText('File saved').last()).toBeVisible();
    await expect(page.getByTestId('dirty-indicator-scenario')).not.toBeVisible();

    // The synced reference is the internal project-root-relative form; save-time
    // reconciliation must recognize it as consistent with the session road
    // (silent canonical conversion), not warn that the reference was inconsistent.
    await expect(page.getByText(LOGIC_FILE_CORRECTED_SUBSTRING)).toHaveCount(0);

    // The saved xosc must carry the canonical xosc-relative LogicFile for the
    // renamed road, proving the reconcile/sync path wrote the correct path.
    const savedXml = await readProjectFile(request, REFSYNC_XOSC_REL);
    expect(savedXml).toContain(`<LogicFile filepath="../${REFSYNC_RENAMED_XODR_REL}"`);
  });

  test('an edited road still simulates via the degraded re-serialize path', async ({
    page,
    request,
  }) => {
    await writeProjectFile(request, DEGRADED_XODR_REL, readFileSync(VIRTUAL_JUNCTION_XODR, 'utf-8'));
    await writeProjectFile(request, DEGRADED_XOSC_REL, DEGRADED_XOSC);

    await gotoEditor(page);
    await openScenarioFromTree(page, DEGRADED_XOSC_NAME);
    await waitForEntitiesLoaded(page);

    await enterRoadNetworkMode(page);
    await waitForRoadsLoaded(page);

    // Edit a road through the property panel (Name field) — a keyboard-driven
    // form edit that runs through the OpenDRIVE command history
    // (UpdateRoadCommand), unlike a canvas drag which would be flakier to
    // drive reliably in Playwright. This is the same command executed by the
    // sidebar's inline rename, just entered via the always-visible property
    // panel instead of the road-list context menu.
    const firstRoad = page.locator('.glass-item').first();
    await expect(firstRoad).toBeVisible();
    await firstRoad.click();

    const nameRow = page.locator('div.grid', { has: page.getByText('Name', { exact: true }) });
    const nameInput = nameRow.getByRole('textbox');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('E2E Edited Road');

    // Derived dirty proves the command history moved — exactly what
    // invalidates the rawXml cache (getValidRoadXml compares
    // cache.validForRevision against the live command-history revision).
    await expect(page.getByTestId('dirty-indicator-roadNetwork')).toBeVisible();

    await enterScenarioMode(page);
    await page.getByRole('button', { name: /Run|実行/ }).click();

    // Fires synchronously at the top of handleRun (SimulationButtons.tsx),
    // well before any WASM work — no need for a long timeout.
    await expect(page.getByText(DEGRADED_ROAD_SUBSTRING)).toBeVisible({ timeout: 5_000 });

    // The edited road is degraded (re-serialized), not lost: simulation still
    // reaches a running/completed state, mirroring wasm-simulation.spec.ts's
    // playback-ready signal.
    await expect(page.getByTestId('playback-controls')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('status-bar')).not.toContainText(/Error|エラー/);
  });
});
