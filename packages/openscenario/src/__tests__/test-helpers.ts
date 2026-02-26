import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Find the main repository root by walking up from the current directory
 * looking for the Thirdparty/ directory. Works both in the main repo
 * and in git worktrees.
 */
function findRepoRoot(): string {
  let dir = resolve(import.meta.dirname);
  for (let i = 0; i < 20; i++) {
    if (existsSync(resolve(dir, 'Thirdparty'))) return dir;
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: assume standard monorepo layout (4 levels up from __tests__/)
  return resolve(import.meta.dirname, '../../../..');
}

export const REPO_ROOT = findRepoRoot();
