import { test, expect, type Page } from '@playwright/test';
import { gotoEditor, entityList } from './helpers';

/**
 * E2E coverage for the read-only 3D preview overlays (route / trajectory /
 * lane-change). We cannot assert Three.js draw calls from the DOM, so
 * EditorLayout mirrors the live preview counts into a hidden
 * `data-testid="preview-mirror"` span. Selecting different scenario elements
 * recomputes the previews; we assert the mirrored counts react accordingly.
 *
 * Trajectory-shape math (polyline / clothoid / clothoidSpline / nurbs) and the
 * lane-change path math are covered exhaustively by unit tests
 * (src/__tests__/lib/*). This spec verifies the end-to-end wiring: selection →
 * hook → EditorLayout → mirror.
 */

const mirror = (page: Page) => page.getByTestId('preview-mirror');

function laneChangeCount(page: Page): Promise<number> {
  return mirror(page)
    .getAttribute('data-lane-change-count')
    .then((v) => Number(v ?? '0'));
}

function routeCount(page: Page): Promise<number> {
  return mirror(page)
    .getAttribute('data-route-count')
    .then((v) => Number(v ?? '0'));
}

/** Open a scenario file from the seeded project's file tree. */
async function openScenario(page: Page, fileName: string): Promise<void> {
  await page.getByRole('button', { name: 'Show file explorer' }).click();
  await page.getByRole('button', { name: 'xosc', exact: true }).click();
  await page.getByRole('button', { name: fileName }).click();
}

test.describe('3D preview observability', () => {
  test('cut-in.xosc: selecting the lane-changing entity shows a lane-change preview', async ({
    page,
  }) => {
    await gotoEditor(page);
    await openScenario(page, 'cut-in.xosc');

    // Entities loaded.
    await expect(entityList(page).getByText('OverTaker', { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    // The mirror is always present once the editor viewer mounts.
    await expect(mirror(page)).toBeAttached();

    // OverTaker performs the CutInAction (a relative LaneChangeAction targeting
    // Ego), so selecting it must yield at least one lane-change preview.
    await entityList(page).getByText('OverTaker', { exact: true }).click();
    await expect
      .poll(() => laneChangeCount(page), { timeout: 10_000 })
      .toBeGreaterThan(0);

    // Ego has no lane-change action → selecting it zeroes the lane-change count.
    // This also proves the preview live-reacts to selection changes.
    await entityList(page).getByText('Ego', { exact: true }).click();
    await expect.poll(() => laneChangeCount(page), { timeout: 10_000 }).toBe(0);
  });

  test('traffic_lights.xosc: selecting Ego reflects its route in the mirror', async ({ page }) => {
    await gotoEditor(page);
    await openScenario(page, 'traffic_lights.xosc');

    await expect(entityList(page).getByText('Ego', { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await expect(mirror(page)).toBeAttached();

    await entityList(page).getByText('Ego', { exact: true }).click();

    // traffic_lights.xosc assigns Ego a Route via an Init-block
    // AssignRouteAction; the route-preview hook scans Init as well as the
    // storyboard tree, so selecting Ego must surface at least one route.
    await expect.poll(() => routeCount(page), { timeout: 10_000 }).toBeGreaterThan(0);
  });
});
