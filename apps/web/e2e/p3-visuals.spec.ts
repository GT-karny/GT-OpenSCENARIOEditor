import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gotoEditor, dismissDiscardDialog } from './helpers';

/**
 * Visual-capture spec for OpenDRIVE 1.9 Phase 3 (opendrive-1.9-support
 * proposal, D6). Mirrors lht-direction-arrows.spec.ts: CI-skipped (software
 * WebGL starves the Three.js render loop under the CI runner — see that
 * spec's comment for the specific run that demonstrated it), largest-canvas
 * screenshot, output under test-results/ for human visual review. None of
 * these assertions inspect pixel content — the payoff is the PNG itself.
 *
 * Fixtures (test-fixtures/opendrive-v1.9/ + Thirdparty/GT_Sim/resources/xodr/,
 * mirrored verbatim into fixtures/opendrive/ alongside the existing 1.9
 * fixtures):
 *  - velodrome.xodr — a single-road cycling-track loop with a genuine 60°
 *    banked superelevation (`a=-1.0471975511965976` rad = -π/3) on its two
 *    curved sections. The 1.9-P3 design notes' premise 9 named
 *    `esmini/multi_intersections.xodr` as "the only" fixture exercising the
 *    superelevation code path, but that file's two `<superelevation>` records
 *    have ALL-ZERO polynomial coefficients (verified by grep) — it loads the
 *    code path without ever tilting the road, so it cannot visually
 *    demonstrate banking no matter the camera angle. velodrome.xodr (not
 *    itself a 1.9-labeled file — header revMinor=5 — but exercising the same
 *    pre-existing `<superelevation>` element P3-V1 now applies to the mesh)
 *    was found via a broader fixture search and gives an unambiguous, large
 *    tilt to capture instead.
 *  - Ex_CrossSectionSurface_CrossFall_LeftTurn_1.xodr — ASAM 1.9 official
 *    example; authored crossSectionSurface tilt (mutually exclusive with
 *    superelevation).
 *  - Ex_Lane_MultiLaneLayer.xodr — 1.9 dual-<lanes> (permanent + temporary
 *    roadworks layer).
 *  - Ex_Objects.xodr — ASAM 1.9 official example, 12 authored <object>
 *    entries (building/hydrant/patch/bush/pole/roadMark/gantry/island/
 *    parkingSpace x2/barrier+repeat/tree).
 *  - Ex_Slip_Lane.xodr — ASAM example with entry/exit/median/border/driving/
 *    shoulder lane types + 16 objects (arrows/traffic-light poles). It does
 *    NOT contain the literal 1.9 `slipLane` lane-type enum value (no fixture
 *    in this repo does), so this capture demonstrates the general 1.9 lane
 *    color set (entry/exit/median, already-existing colors) plus the new
 *    object visualization together, not the `slipLane` swatch specifically.
 */

const SHOT_DIR = 'test-results/p3-visuals';
const FIXTURE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures/opendrive');

const BANKING_XODR = resolve(FIXTURE_DIR, 'velodrome.xodr');
const CROSSFALL_XODR = resolve(FIXTURE_DIR, 'Ex_CrossSectionSurface_CrossFall_LeftTurn_1.xodr');
const MULTILAYER_XODR = resolve(FIXTURE_DIR, 'Ex_Lane_MultiLaneLayer.xodr');
const OBJECTS_XODR = resolve(FIXTURE_DIR, 'Ex_Objects.xodr');
const SLIP_LANE_XODR = resolve(FIXTURE_DIR, 'Ex_Slip_Lane.xodr');

/** Switch the editor into Road Network mode (scoped to the header toggle). */
async function enterRoadNetworkMode(page: Page): Promise<void> {
  await page.getByRole('banner').getByRole('button', { name: 'Road Network', exact: true }).click();
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

/** Load `filePath` into a fresh Road Network editor and wait for the road list. */
async function loadRoadNetwork(page: Page, filePath: string, timeout = 30_000): Promise<void> {
  await gotoEditor(page);
  await enterRoadNetworkMode(page);
  await openXodr(page, filePath);
  await expect(page.getByText(/\d+ roads?/).first()).toBeVisible({ timeout });
}

/** The largest-area <canvas> on the page (main viewer, not the minimap). */
async function largestCanvas(page: Page) {
  const canvases = page.locator('canvas');
  const count = await canvases.count();
  let canvas = canvases.first();
  let best = 0;
  for (let i = 0; i < count; i++) {
    const box = await canvases.nth(i).boundingBox();
    const area = box ? box.width * box.height : 0;
    if (area > best) {
      best = area;
      canvas = canvases.nth(i);
    }
  }
  return canvas;
}

/**
 * Click the minimap (the smallest-area <canvas> — the main viewport is
 * always larger) at a given fraction of its width/height (default: center).
 * Minimap.tsx auto-fits its bounds to the loaded road network and, on click,
 * teleport-focuses the MAIN camera to that world position
 * (onClickPosition → viewer-store.setFocusWorldPosition → CameraController's
 * smooth focus animation). This reliably brings a road into the main
 * viewport's frame regardless of its heading/offset — more robust than
 * blindly zooming/rotating the main camera when the default framing misses
 * the road, and (via xFrac/yFrac) lets a specific part of a multi-segment
 * road (e.g. one curve of a loop) be targeted instead of just its centroid.
 */
async function focusViaMinimap(page: Page, xFrac = 0.5, yFrac = 0.5): Promise<void> {
  const canvases = page.locator('canvas');
  const count = await canvases.count();
  let minimap = canvases.first();
  let smallest = Infinity;
  for (let i = 0; i < count; i++) {
    const box = await canvases.nth(i).boundingBox();
    const area = box ? box.width * box.height : Infinity;
    if (area < smallest) {
      smallest = area;
      minimap = canvases.nth(i);
    }
  }
  const box = await minimap.boundingBox();
  if (!box) throw new Error('minimap canvas not found');
  await minimap.click({ position: { x: box.width * xFrac, y: box.height * yFrac } });
  // FOCUS_DURATION (CameraController.tsx) is 0.3s; give it headroom to settle.
  await page.waitForTimeout(600);
}

/** Fixed canvas-render settle time before a capture (kept deliberately). */
async function settle(page: Page): Promise<void> {
  await page.waitForTimeout(500);
}

/**
 * Zoom out from the canvas center `ticks` times. The default camera frames
 * some single-road fixtures fine, but roads authored with `hdg≈π` (heading
 * toward -X from their start point, vs. hdg≈0 for the fixtures that DID
 * frame correctly by default) can render fully out of the default view — an
 * empty canvas, road only visible in the minimap. Ex_Slip_Lane.xodr (hdg≈π)
 * needs only a modest zoom-out to frame correctly; Ex_CrossSectionSurface_
 * CrossFall_LeftTurn_1.xodr (also hdg≈π, but at a larger world offset) did
 * not resolve even at 32 ticks and uses focusViaMinimap instead (see that
 * test).
 */
async function zoomOutFromCenter(
  page: Page,
  canvas: Awaited<ReturnType<typeof largestCanvas>>,
  ticks: number,
): Promise<void> {
  const box = await canvas.boundingBox();
  if (!box) throw new Error('viewer canvas not found');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < ticks; i++) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(120);
  }
}

test.describe('OpenDRIVE 1.9 Phase 3 — visual capture', () => {
  test.beforeAll(() => {
    mkdirSync(SHOT_DIR, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    // Force the legacy <input type=file> fallback so the picker is drivable by
    // Playwright (same trick as opendrive-1.9.spec.ts / file-operations.spec.ts).
    await page.addInitScript(() => {
      // @ts-expect-error — intentionally remove FS Access API for the fallback path
      delete window.showOpenFilePicker;
      // @ts-expect-error — same as above for the save dialog
      delete window.showSaveFilePicker;
    });
  });

  test('captures superelevation banking on a tilted road (velodrome)', async ({ page }) => {
    test.skip(!!process.env.CI, 'visual-capture spec; software-WebGL starvation on CI runners');
    test.setTimeout(90_000);

    await loadRoadNetwork(page, BANKING_XODR);

    // Deliberately NOT switching to the "Top" camera mode — banking (roll
    // about the reference line) is invisible from directly overhead. The
    // default OrbitControls perspective is kept so the tilt reads visually.
    // The default camera frames the road's start (s=0, a flat straight
    // section); the track's two banked curves are at its rounded ends
    // (s~607-893 and s~1607-1893 of the 2000m loop). Focus via the minimap
    // near its right edge to land on one curve directly, rather than the
    // flat straight the un-aimed default view shows.
    await focusViaMinimap(page, 0.85, 0.5);

    const canvas = await largestCanvas(page);
    // The focus animation's fixed camera offset leaves the curve near the
    // top edge of frame, distant and shallow — zoom in to bring it closer
    // and let the bank read more clearly.
    const box = await canvas.boundingBox();
    if (!box) throw new Error('viewer canvas not found');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, -400);
      await page.waitForTimeout(120);
    }

    await settle(page);
    await canvas.screenshot({ path: `${SHOT_DIR}/banking.png` });
    await expect(page.getByTestId('status-bar')).toBeVisible();
  });

  test('captures authored crossSectionSurface tilt (CrossFall_LeftTurn)', async ({ page }) => {
    test.skip(!!process.env.CI, 'visual-capture spec; software-WebGL starvation on CI runners');
    test.setTimeout(90_000);

    await loadRoadNetwork(page, CROSSFALL_XODR);

    // This fixture's road starts at (152.5, 172.5) with hdg≈π — offset far
    // enough from the default camera's view axis that no amount of zooming
    // out (tried up to 32 ticks) brought more than a sliver into frame.
    // Click-to-focus via the minimap is reliable regardless of the road's
    // position/heading (see focusViaMinimap doc comment).
    await focusViaMinimap(page);

    const canvas = await largestCanvas(page);
    await settle(page);
    await canvas.screenshot({ path: `${SHOT_DIR}/crossfall.png` });
    await expect(page.getByTestId('status-bar')).toBeVisible();
  });

  test('captures the temporary lane-layer overlay toggling on/off (MultiLaneLayer)', async ({
    page,
  }) => {
    test.skip(!!process.env.CI, 'visual-capture spec; software-WebGL starvation on CI runners');
    test.setTimeout(90_000);

    await loadRoadNetwork(page, MULTILAYER_XODR);

    const tempToggle = page.getByTestId('toggle-temporary-lanes');
    await expect(tempToggle).toHaveAttribute('aria-pressed', 'true'); // default ON

    const canvas = await largestCanvas(page);
    await settle(page);
    await canvas.screenshot({ path: `${SHOT_DIR}/temporary-on.png` });

    // Keyboard activation, not a mouse click — see the "KNOWN BUG" comment on
    // the toggle test in opendrive-1.9.spec.ts: at this viewport the
    // toolbar's tail end (Temp, Objects) sits under the always-on-top Speed
    // fly-control slider, so neither a real mouse click nor `click({force:
    // true})` reaches this button (the browser's own hit-testing routes the
    // event to whatever is topmost). Focus + Enter is unaffected by screen
    // coordinates and still exercises the real toggle handler.
    await tempToggle.focus();
    await tempToggle.press('Enter');
    await expect(tempToggle).toHaveAttribute('aria-pressed', 'false');
    await settle(page);
    await canvas.screenshot({ path: `${SHOT_DIR}/temporary-off.png` });
  });

  test('captures road-object visualization toggling on/off (Ex_Objects)', async ({ page }) => {
    test.skip(!!process.env.CI, 'visual-capture spec; software-WebGL starvation on CI runners');
    test.setTimeout(90_000);

    await loadRoadNetwork(page, OBJECTS_XODR);

    const objectsToggle = page.getByTestId('toggle-objects');
    await expect(objectsToggle).toHaveAttribute('aria-pressed', 'true'); // default ON

    const canvas = await largestCanvas(page);
    await settle(page);
    await canvas.screenshot({ path: `${SHOT_DIR}/objects-on.png` });

    // Keyboard activation, not a mouse click — see the "KNOWN BUG" comment in
    // opendrive-1.9.spec.ts: the Speed fly-control slider overlaps this
    // button at this viewport, so neither a real mouse click nor
    // `click({force: true})` reaches it (real browser hit-testing routes the
    // event to whatever is topmost, regardless of which locator issued it).
    await objectsToggle.focus();
    await objectsToggle.press('Enter');
    await expect(objectsToggle).toHaveAttribute('aria-pressed', 'false');
    await settle(page);
    await canvas.screenshot({ path: `${SHOT_DIR}/objects-off.png` });
  });

  test('captures the new 1.9 lane/object colors (Ex_Slip_Lane)', async ({ page }) => {
    test.skip(!!process.env.CI, 'visual-capture spec; software-WebGL starvation on CI runners');
    test.setTimeout(90_000);

    await loadRoadNetwork(page, SLIP_LANE_XODR);

    // Same off-screen-by-default issue as CrossFall above (hdg≈π road).
    const canvas = await largestCanvas(page);
    await zoomOutFromCenter(page, canvas, 8);

    await settle(page);
    await canvas.screenshot({ path: `${SHOT_DIR}/slip-lane-colors.png` });
    await expect(page.getByTestId('status-bar')).toBeVisible();
  });
});
