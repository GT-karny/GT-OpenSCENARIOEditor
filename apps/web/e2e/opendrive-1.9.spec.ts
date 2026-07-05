import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { gotoEditor, dismissDiscardDialog } from './helpers';

/**
 * E2E coverage for OpenDRIVE 1.9 gap補填 (opendrive-1.9-support proposal,
 * Phase 0-A item 4). Two behaviours are pinned:
 *
 *  1. <include> hard-error path — the freshly-rebuilt GT_Sim WASM treats any
 *     `.xodr` containing `<include>` as a permanent load failure
 *     (RoadManagerJS.loadOpenDrive / SE_Init returns false). The UI must
 *     surface the SPECIFIC, actionable include-unsupported message
 *     (INCLUDE_UNSUPPORTED_MESSAGE / kind `includeUnsupported`), not the generic
 *     "failed to load road" toast.
 *
 *  2. 1.9 structural smoke — new 1.9 fixtures (multi lane-layer roads, virtual
 *     junctions) must load into the Road Network editor without crashing or
 *     raising a load-error toast. This guards against the parser/editor choking
 *     on 1.9-era OpenDRIVE structures.
 *
 * ── Loading mechanisms ──
 *  - Smoke tests use File > Open .xodr, driven through Playwright's filechooser
 *    (File System Access API removed so the legacy <input type=file> fallback is
 *    used — same trick as file-operations.spec.ts). That menu item only exists
 *    in Road Network editor mode, so those tests switch modes first via the
 *    header toggle (same control lht-default-rule.spec.ts uses).
 *  - The include test needs the include-bearing xodr in `roadNetworkXml` so the
 *    Run button feeds it to the simulator. The Run button reads roadNetworkXml
 *    verbatim (no serialize fallback), and loading a .xodr through the Road
 *    Network *editor* clears roadNetworkXml (the odrStore→editorStore sync calls
 *    setRoadNetwork(doc) with no rawXml). The path that populates it cleanly is
 *    the project scenario-open auto-loader (openXoscFromProject → autoLoadXodr),
 *    exactly as the seeded scenarios do. So this test seeds a scenario + its
 *    include-bearing road into the sample project via the file API, then opens
 *    the scenario from the file tree — mirroring real project usage.
 *
 * The include message is asserted against the exact user-facing string from
 * apps/web/src/lib/wasm/sim-error.ts (INCLUDE_UNSUPPORTED_MESSAGE), via a stable
 * substring. It is only ever rendered in the sonner toast (the status bar shows
 * a generic "Error" label), so the assertion targets the toast text.
 */

const FIXTURE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures/opendrive');

/** An `.xodr` whose single road carries a `<include file="...">` element. */
const INCLUDE_XODR = resolve(FIXTURE_DIR, 'include_error.xodr');
/** OpenDRIVE 1.9 multi lane-layer example (Ex_Lane_MultiLaneLayer). */
const MULTILAYER_XODR = resolve(FIXTURE_DIR, 'Ex_Lane_MultiLaneLayer.xodr');
/** Virtual-junction fixture (GT_23_virtual_junction_17, 3 roads). */
const VIRTUAL_JUNCTION_XODR = resolve(FIXTURE_DIR, 'GT_23_virtual_junction_17.xodr');

/** Stable ID of the server-seeded sample project (project-service.ts). */
const SAMPLE_PROJECT_ID = 'esmini-samples';

/** Test-owned filenames seeded into the sample project (idempotent overwrite). */
const INCLUDE_XODR_REL = 'xodr/e2e-include-error.xodr';
const INCLUDE_XOSC_NAME = 'e2e-include-error.xosc';
const INCLUDE_XOSC_REL = `xosc/${INCLUDE_XOSC_NAME}`;

/** Test-owned files for the rawXml-passthrough regression (1.9-P1 3-D). */
const PASSTHROUGH_XODR_REL = 'xodr/e2e-vj-passthrough.xodr';
const PASSTHROUGH_XOSC_NAME = 'e2e-vj-passthrough.xosc';
const PASSTHROUGH_XOSC_REL = `xosc/${PASSTHROUGH_XOSC_NAME}`;

/**
 * Stable substring of the degraded-road warning
 * (packages/i18n .../common.ts `simulation.degradedRoad`). It is toasted
 * synchronously at Run when the raw xodr text was lost and the sim payload had
 * to be re-serialized. With the rawXml passthrough, an unedited road never
 * degrades, so this must NOT appear.
 */
const DEGRADED_ROAD_SUBSTRING = 'Regenerating the edited road data for simulation';

/**
 * Stable substring of INCLUDE_UNSUPPORTED_MESSAGE
 * (apps/web/src/lib/wasm/sim-error.ts). Kept as a substring so incidental
 * wording tweaks around it don't break the assertion, while still proving the
 * SPECIFIC include-unsupported branch fired (not the generic road-load error).
 */
const INCLUDE_MESSAGE_SUBSTRING =
  'uses <include> references, which the simulator cannot load';

/**
 * Minimal single-entity scenario whose RoadNetwork/LogicFile points at the
 * seeded include-bearing road. Ego + an init TeleportAction is enough for esmini
 * to attempt the road load (which then hard-fails on <include>).
 */
const INCLUDE_XOSC = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="3" date="2026-07-05T00:00:00" description="e2e include-error" author="e2e"/>
  <ParameterDeclarations/>
  <CatalogLocations/>
  <RoadNetwork>
    <LogicFile filepath="../xodr/e2e-include-error.xodr"/>
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
  const res = await request.put(
    `/api/projects/${SAMPLE_PROJECT_ID}/files/${encoded}`,
    { data: { content } },
  );
  expect(res.ok(), `write ${relativePath}`).toBeTruthy();
}

/** Scenario referencing the seeded virtual-junction road (rawXml passthrough test). */
const PASSTHROUGH_XOSC = INCLUDE_XOSC.replace(
  '../xodr/e2e-include-error.xodr',
  '../xodr/e2e-vj-passthrough.xodr',
);

/** Switch the editor into Road Network mode (scoped to the header toggle). */
async function enterRoadNetworkMode(page: Page): Promise<void> {
  await page.getByRole('banner').getByRole('button', { name: 'Road Network' }).click();
}

/** Switch the editor back into Scenario mode (scoped to the header toggle). */
async function enterScenarioMode(page: Page): Promise<void> {
  await page.getByRole('banner').getByRole('button', { name: 'Scenario', exact: true }).click();
}

/** Open a scenario from the project file tree (mirrors smoke.spec.ts). */
async function openScenarioFromTree(page: Page, fileName: string): Promise<void> {
  await page.getByRole('button', { name: 'Show file explorer' }).click();
  await page.getByRole('button', { name: 'xosc', exact: true }).click();
  await page.getByRole('button', { name: fileName }).click();
  // Project-tree opens now route through the unsaved-changes guard; the seeded
  // default document is dirty, so discard it to proceed to the scenario load.
  await dismissDiscardDialog(page, 'discard');
}

/** Drive File > Open .xodr → pick `filePath` (Road Network mode must be active). */
async function openXodr(page: Page, filePath: string): Promise<void> {
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: /Open \.xodr/ }).click();
  // The seeded default document marks the editor dirty, so the open guard
  // prompts before the picker; discard to continue to the file chooser.
  await dismissDiscardDialog(page, 'discard');
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);
}

test.describe('OpenDRIVE 1.9 support', () => {
  // WASM compile + load inside Chromium can exceed the default 30s.
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    // Force the legacy <input type=file> fallback so the picker is drivable by
    // Playwright (Chromium otherwise prefers the non-drivable FS Access API).
    await page.addInitScript(() => {
      // @ts-expect-error — intentionally remove FS Access API for the fallback path
      delete window.showOpenFilePicker;
      // @ts-expect-error — same as above for the save dialog
      delete window.showSaveFilePicker;
    });
  });

  test('surfaces the include-unsupported message when simulating an <include> map', async ({
    page,
    request,
  }) => {
    // Seed the include-bearing road + a scenario that references it into the
    // sample project (idempotent — overwrites any prior run's files).
    await writeProjectFile(request, INCLUDE_XODR_REL, readFileSync(INCLUDE_XODR, 'utf-8'));
    await writeProjectFile(request, INCLUDE_XOSC_REL, INCLUDE_XOSC);

    await gotoEditor(page);

    // Opening the scenario auto-loads its LogicFile road into roadNetworkXml
    // (openXoscFromProject → autoLoadXodr), so the Run button can feed the
    // include-bearing road to the simulator.
    await openScenarioFromTree(page, INCLUDE_XOSC_NAME);
    await expect(page.getByTestId('status-bar')).not.toContainText(
      /Entities:\s*0(?!\d)/,
      { timeout: 10_000 },
    );

    // Run → the worker writes the include-bearing xodr, rewrites the scenario's
    // LogicFile to it, SE_Init hard-fails on <include>, and the classifier routes
    // the failure to the specific includeUnsupported toast.
    await page.getByRole('button', { name: /Run|実行/ }).click();

    // The SPECIFIC include-unsupported message (toasted verbatim), not the
    // generic missing-road error.
    await expect(page.getByText(INCLUDE_MESSAGE_SUBSTRING)).toBeVisible({
      timeout: 90_000,
    });
  });

  // 1.9 structural smoke: each fixture must load into the Road Network editor
  // (road list populates) without a load-error toast.
  for (const { title, filePath } of [
    { title: 'multi lane-layer (Ex_Lane_MultiLaneLayer)', filePath: MULTILAYER_XODR },
    { title: 'virtual junction (GT_23_virtual_junction_17)', filePath: VIRTUAL_JUNCTION_XODR },
  ]) {
    test(`loads a 1.9 ${title} map without a load error`, async ({ page }) => {
      await gotoEditor(page);
      await enterRoadNetworkMode(page);
      await openXodr(page, filePath);

      // Road list populates → the parser accepted the 1.9 structure and the
      // editor rendered the network. Allow a generous timeout: heavier 1.9 maps
      // (multi lane-layer) parse+render slower under full-suite resource load.
      await expect(page.getByText(/\d+ roads?/).first()).toBeVisible({ timeout: 30_000 });

      // No open-xodr failure toast. The failure toast is templated as
      // "Failed to open road network: ..." (fileErrors.openXodrFailed) — its
      // stable prefix must never appear for a valid 1.9 map.
      await expect(page.getByText(/Failed to open road network/i)).toHaveCount(0);

      // The editor chrome is intact (no crash / white screen).
      await expect(page.getByTestId('status-bar')).toBeVisible();
      await expect(page.getByRole('banner')).toBeVisible();
    });
  }

  // 1.9-P1 Stage 3-D: opening a road, visiting the Road Network editor, and
  // running WITHOUT editing must keep the verbatim xodr flowing to the simulator
  // — i.e. the "degraded / re-serialized road" warning must NOT fire. Before the
  // rawXml passthrough, entering road mode nulled roadNetworkXml and every run
  // degraded silently.
  test('keeps raw xodr passthrough after visiting road mode unedited (no degraded warning)', async ({
    page,
    request,
  }) => {
    await writeProjectFile(request, PASSTHROUGH_XODR_REL, readFileSync(VIRTUAL_JUNCTION_XODR, 'utf-8'));
    await writeProjectFile(request, PASSTHROUGH_XOSC_REL, PASSTHROUGH_XOSC);

    await gotoEditor(page);

    // Scenario open auto-loads the referenced road into roadNetworkXml.
    await openScenarioFromTree(page, PASSTHROUGH_XOSC_NAME);
    await expect(page.getByTestId('status-bar')).not.toContainText(/Entities:\s*0(?!\d)/, {
      timeout: 10_000,
    });

    // Round-trip through the Road Network editor without editing, then back.
    await enterRoadNetworkMode(page);
    await expect(page.getByText(/\d+ roads?/).first()).toBeVisible({ timeout: 30_000 });
    await enterScenarioMode(page);

    // Run: the degraded-road warning fires synchronously at click if the raw
    // text was lost. It must not appear — the unedited road passes through.
    await page.getByRole('button', { name: /Run|実行/ }).click();
    await page.waitForTimeout(3_000);
    await expect(page.getByText(DEGRADED_ROAD_SUBSTRING)).toHaveCount(0);
  });
});
