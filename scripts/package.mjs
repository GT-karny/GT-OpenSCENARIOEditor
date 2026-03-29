#!/usr/bin/env node
/**
 * Full packaging pipeline: typecheck → build all → electron-builder
 *
 * Usage:
 *   node scripts/package.mjs            # default (runs all steps)
 *   node scripts/package.mjs --skip-typecheck   # skip typecheck step
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const desktopDir = path.join(rootDir, 'apps', 'desktop');
const exePath = path.join(desktopDir, 'release', 'win-unpacked', 'OpenSCENARIO Editor.exe');

const skipTypecheck = process.argv.includes('--skip-typecheck');

function run(cmd, cwd = rootDir) {
  execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
}

function step(label, fn) {
  const start = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${label}`);
  console.log('='.repeat(60));
  fn();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`  ✓ ${label} (${elapsed}s)\n`);
}

try {
  // Step 1: Typecheck
  if (!skipTypecheck) {
    step('Step 1/3 — typecheck', () => {
      run('pnpm typecheck');
    });
  } else {
    console.log('\n  (typecheck skipped)\n');
  }

  // Step 2: Build all packages
  step(`Step 2/3 — build all packages`, () => {
    run('pnpm build');
  });

  // Step 3: Electron packaging
  step('Step 3/3 — electron-builder', () => {
    try {
      run('npx electron-builder --config electron-builder.yml', desktopDir);
    } catch {
      // winCodeSign symlink error on Windows — check if exe was produced
      if (process.platform === 'win32' && existsSync(exePath)) {
        console.log('  (winCodeSign symlink error ignored — exe exists)');
      } else {
        throw new Error('electron-builder failed and no exe was produced');
      }
    }
  });

  // Summary
  console.log('='.repeat(60));
  console.log('  Package complete!');
  console.log('='.repeat(60));
  if (existsSync(exePath)) {
    const { statSync } = await import('node:fs');
    const sizeMB = (statSync(exePath).size / 1024 / 1024).toFixed(0);
    console.log(`  EXE : ${exePath} (${sizeMB} MB)`);
  }
  console.log(`  Dir : ${path.join(desktopDir, 'release', 'win-unpacked')}`);
  console.log('');
} catch (err) {
  console.error(`\n✗ Package failed: ${err.message}`);
  process.exit(1);
}
