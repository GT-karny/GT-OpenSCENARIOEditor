import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Find the main repository root by walking up from the current directory
 * looking for the test-fixtures/ directory. Works both in the main repo
 * and in git worktrees.
 */
function findRepoRoot(): string {
  let dir = resolve(import.meta.dirname);
  for (let i = 0; i < 20; i++) {
    if (existsSync(resolve(dir, 'test-fixtures'))) return dir;
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: assume standard monorepo layout (4 levels up from __tests__/)
  return resolve(import.meta.dirname, '../../../..');
}

export const REPO_ROOT = findRepoRoot();

/** esmini demo xosc fixtures */
export const XOSC_DIR = resolve(REPO_ROOT, 'test-fixtures/esmini/xosc');

/** OpenSCENARIO v1.2.0 official examples */
export const EXAMPLES_DIR = resolve(REPO_ROOT, 'test-fixtures/openscenario-v1.2.0/Examples');

/** Whether committed test fixtures are available */
export const FIXTURES_AVAILABLE = existsSync(XOSC_DIR);

/** Thirdparty dir (may not exist on CI) */
export const THIRDPARTY_DIR = resolve(REPO_ROOT, 'Thirdparty');

/** Whether Thirdparty/GT_Sim is available (local only) */
export const GT_SIM_AVAILABLE = existsSync(resolve(THIRDPARTY_DIR, 'GT_Sim_v0.6.0-rc'));
