/**
 * GT_Sim backend CONTRACT tests (WP1).
 *
 * These hit a real, already-running GT_Sim FastAPI backend and verify the wire
 * contract frozen in `gt-sim-api-types.ts` / `gt-sim-status.ts`. They are
 * skipped automatically unless the backend URL is provided:
 *
 *   GTSIM_CONTRACT_URL=http://127.0.0.1:8000 pnpm --filter @osce/esmini test
 *
 * Only read-only (GET) endpoints are exercised — the suite never creates,
 * mutates, or cancels anything, so it is safe against a developer's live
 * backend. Intended as the mandatory gate when bumping the Thirdparty/GT_Sim
 * submodule pin (migration plan R6/WP7).
 */

import { describe, it, expect } from 'vitest';
import { GtSimApiClient } from '../client/gt-sim-api-client.js';
import { narrowGtSimStatus, adaptJobStatus } from '../client/gt-sim-adapters.js';

const CONTRACT_URL = process.env.GTSIM_CONTRACT_URL ?? '';

describe.runIf(CONTRACT_URL !== '')('GT_Sim backend contract (live)', () => {
  // Note: the describe body runs during collection even when skipped, so the
  // client must construct with a syntactically valid placeholder base URL.
  const client = new GtSimApiClient({
    baseUrl: CONTRACT_URL || 'http://gtsim-contract-disabled.invalid',
    timeout: 10_000,
  });

  it('GET /api/config/system responds with an object', async () => {
    const info = await client.getSystemInfo();
    expect(typeof info).toBe('object');
    expect(info).not.toBeNull();
  });

  it('GET /api/projects returns the frozen project list shape', async () => {
    const projects = await client.getProjects();
    expect(Array.isArray(projects)).toBe(true);
    for (const p of projects) {
      expect(typeof p.project_id).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(typeof p.is_builtin).toBe('boolean');
      expect(typeof p.scenario_count).toBe('number');
    }
  });

  it('GET /api/config/execution-defaults matches the frozen ExecutionDefaults shape', async () => {
    const defaults = await client.getExecutionDefaults();
    expect(typeof defaults.hz).toBe('number');
    expect(typeof defaults.headless).toBe('boolean');
    expect(typeof defaults.record).toBe('boolean');
    expect(typeof defaults.timeout).toBe('number');
    expect(typeof defaults.osi).toBe('object');
    expect(typeof defaults.osi.enabled).toBe('boolean');
    expect(typeof defaults.osi.ip).toBe('string');
    expect(typeof defaults.window).toBe('object');
    expect(typeof defaults.window.w).toBe('number');
  });

  it('GET /api/config/projects-root matches the frozen shape', async () => {
    const root = await client.getProjectsRoot();
    expect(typeof root.effective_dir).toBe('string');
    expect(root.projects_root === null || typeof root.projects_root === 'string').toBe(true);
  });

  it('GET /api/manual-drive/config matches the frozen ManualDriveConfig core keys', async () => {
    const config = await client.getManualDriveConfig();
    expect(typeof config.input_type).toBe('string');
    expect(typeof config.physics_type).toBe('string');
    expect(typeof config.domain).toBe('object');
    expect(typeof config.sdl2).toBe('object');
    expect(typeof config.sdl2.button_mapping).toBe('object');
    expect(typeof config.keyboard).toBe('object');
  });

  it('GET /api/auto-light/defaults matches the frozen AutoLightConfig keys', async () => {
    const defaults = await client.getAutoLightDefaults();
    expect(typeof defaults.headlight_enabled).toBe('boolean');
    expect(typeof defaults.highbeam_enabled).toBe('boolean');
    expect(typeof defaults.highbeam_range_m).toBe('number');
  });

  it('GET /api/simulations returns jobs whose statuses fit the frozen closed set', async () => {
    const list = await client.getSimulations({ limit: 50 });
    expect(Array.isArray(list.jobs)).toBe(true);
    expect(typeof list.total).toBe('number');
    for (const job of list.jobs) {
      // The frozen GtSimJobStatus union must cover every live status value —
      // narrowGtSimStatus only changes unknown values (to 'failed').
      expect(narrowGtSimStatus(job.status)).toBe(job.status);
      expect(job.progress_pct).toBeGreaterThanOrEqual(0);
      expect(job.progress_pct).toBeLessThanOrEqual(100);
      // Adapter must produce a sane editor view for every live job.
      const adapted = adaptJobStatus(job);
      expect(['idle', 'running', 'completed', 'error']).toContain(adapted.editorStatus);
      expect(adapted.progress).toBeGreaterThanOrEqual(0);
      expect(adapted.progress).toBeLessThanOrEqual(1);
    }
  });

  it('GET /api/verification/runs matches the frozen run-list shape', async () => {
    const { runs } = await client.getVerificationRuns();
    expect(Array.isArray(runs)).toBe(true);
    for (const run of runs) {
      expect(typeof run.id).toBe('string');
      expect(typeof run.has_compare).toBe('boolean');
      expect(typeof run.has_verdict).toBe('boolean');
    }
  });
});

// Always-on guard so the suite is never silently empty and CI logs show why.
describe('GT_Sim backend contract (gate)', () => {
  it(`is ${CONTRACT_URL ? 'ENABLED against ' + CONTRACT_URL : 'skipped (set GTSIM_CONTRACT_URL to enable)'}`, () => {
    expect(true).toBe(true);
  });
});
