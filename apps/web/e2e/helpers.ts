import { expect, type Page } from '@playwright/test';

/**
 * The app boots into the HomeScreen (project picker), not directly into the
 * editor. Every editor-level spec therefore needs to first pass through the
 * home screen and open a project.
 *
 * Strategy: open the server-seeded "esmini Samples" project. It is created
 * idempotently on server startup (see ProjectService.seedSampleProject), so it
 * always exists and opening it does NOT accumulate state in
 * apps/server/data/projects (unlike "New Project", which writes a new
 * dated folder each run).
 *
 * Opening a project enters the editor with a fresh, empty in-memory scenario
 * document (createDefaultDocument: entities=[], stories=[]) — no scenario file
 * is auto-loaded — so editor specs start from a clean slate (Entities: 0).
 */
export async function gotoEditor(page: Page): Promise<void> {
  await page.goto('/');

  // HomeScreen: wait for the seeded project card, then open it.
  const sampleCard = page.getByRole('button', { name: /esmini Samples/i });
  await expect(sampleCard).toBeVisible({ timeout: 15_000 });
  await sampleCard.click();

  // Editor is mounted once the header banner is present.
  await expect(page.getByRole('banner')).toBeVisible({ timeout: 15_000 });
  // Status bar confirms the editor chrome finished rendering.
  await expect(page.getByTestId('status-bar')).toBeVisible();
}

/**
 * The left-sidebar entity list, scoped to its tabpanel (aria-label "Entities").
 * Entity names also render as node labels in the Composer/Graph canvas, so
 * unscoped getByText('<name>') triggers strict-mode violations — always scope
 * entity-list assertions through this locator.
 */
export function entityList(page: Page) {
  return page.getByLabel('Entities', { exact: true });
}

/**
 * Open the Add Entity dialog and create an inline vehicle entity with the given
 * name. Assumes the editor is already loaded and the Entities tab is the
 * default-active left-sidebar tab.
 */
export async function addEntity(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Add new entity' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/Name|名前/).fill(name);
  await dialog.getByRole('button', { name: /^Add$|^追加$/ }).click();
  await expect(dialog).not.toBeVisible();
}
