import { test, expect } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'fs/promises';

/**
 * E2E coverage for the S3 completion condition: project.json schemaVersion
 * migration (project-service.ts migrateProjectMeta / PROJECT_META_SCHEMA_VERSION).
 * A `project.json` record written before the `schemaVersion` field existed (or
 * any record simply missing it) must be read as v1 and transparently migrated
 * to the current schema version on GET — no explicit migration step, no error.
 *
 * ── Why direct filesystem access, not the files API ──
 * There is no "temp projects root" per test run: `pnpm --filter @osce/server dev`
 * (playwright.config.ts webServer) always persists to `apps/server/data/projects`
 * — the exact same directory every sibling spec's file-API seeding
 * (writeProjectFile in opendrive-1.9.spec.ts / road-references.spec.ts) already
 * writes into. `project.json` itself is deliberately NOT reachable through the
 * project files API (ProjectService.collectFiles explicitly excludes it — it's
 * metadata, not a project file), so proving the migration requires writing the
 * raw file directly from Node (this spec file runs under Playwright's Node
 * test runner, so `fs/promises` is available, same as `readFileSync` usage
 * elsewhere in this suite for fixture loading).
 *
 * ── Shared-fixture safety ──
 * `esmini-samples`'s project.json is a shared fixture across the whole
 * fullyParallel suite. This spec minimizes blast radius by only ever touching
 * the `schemaVersion` field (backup → mutate → assert → restore in a
 * `finally`), which no other spec reads or asserts on. A concurrent spec's
 * unrelated file write (touchUpdatedAt) reading our mid-flight v1 shape would
 * just migrate-and-persist it early, which does not break this test — GET
 * would still observe schemaVersion 2, only for a slightly different reason.
 */

const SAMPLE_PROJECT_ID = 'esmini-samples';
const PROJECT_JSON_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../apps/server/data/projects/esmini-samples/project.json',
);

/** PROJECT_META_SCHEMA_VERSION (packages/shared/src/types/project.ts). */
const CURRENT_SCHEMA_VERSION = 2;

test.describe('project.json schemaVersion migration', () => {
  test('a v1 record (no schemaVersion) opens fine and is migrated on GET', async ({ request }) => {
    const backup = await readFile(PROJECT_JSON_PATH, 'utf-8').catch(() => null);
    test.skip(
      backup === null,
      `Sample project.json not found at ${PROJECT_JSON_PATH} — seeding did not run in this environment`,
    );
    if (backup === null) return; // unreachable after skip; narrows `backup` for TS below

    try {
      const v1 = JSON.parse(backup) as Record<string, unknown>;
      delete v1.schemaVersion;
      await writeFile(PROJECT_JSON_PATH, JSON.stringify(v1, null, 2), 'utf-8');

      const res = await request.get(`/api/projects/${SAMPLE_PROJECT_ID}`);
      expect(res.ok(), 'GET a v1 project.json must succeed, not error').toBeTruthy();

      const body = (await res.json()) as { meta: { schemaVersion?: number; id?: string } };
      expect(body.meta.id).toBe(SAMPLE_PROJECT_ID);
      expect(body.meta.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    } finally {
      // Best-effort restore regardless of outcome — leaves the shared fixture
      // exactly as found for every other spec in the suite.
      await writeFile(PROJECT_JSON_PATH, backup, 'utf-8');
    }
  });
});
