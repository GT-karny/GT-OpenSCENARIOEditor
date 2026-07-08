/**
 * Cross-platform clean script: removes all dist/ directories in workspace packages
 * and root-level *.tsbuildinfo files.
 * Works on Windows (no rm -rf dependency).
 */

import { readdirSync, rmSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');

/** Workspace top-level directories that contain package sub-directories */
const workspaceDirs = ['apps', 'packages'];

let removed = 0;

// Remove dist/ in each workspace package
for (const wsDir of workspaceDirs) {
  const wsDirPath = join(root, wsDir);
  if (!existsSync(wsDirPath)) continue;

  for (const pkg of readdirSync(wsDirPath)) {
    const distPath = join(wsDirPath, pkg, 'dist');
    if (existsSync(distPath) && statSync(distPath).isDirectory()) {
      rmSync(distPath, { recursive: true, force: true });
      console.log(`  removed ${wsDir}/${pkg}/dist`);
      removed++;
    }
  }
}

// Remove root-level *.tsbuildinfo files
for (const entry of readdirSync(root)) {
  if (entry.endsWith('.tsbuildinfo')) {
    const filePath = join(root, entry);
    rmSync(filePath, { force: true });
    console.log(`  removed ${entry}`);
    removed++;
  }
}

console.log(`\nClean complete. ${removed} item(s) removed.`);
