import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(__dirname, '..');
const exePath = path.join(desktopDir, 'release', 'win-unpacked', 'OpenSCENARIO Editor.exe');

// electron-builder on Windows may fail with a symlink error when extracting
// the winCodeSign cache (macOS dylib symlinks). The Windows build itself
// completes successfully before that error — so we check for the output exe.

try {
  execSync('npx electron-builder --config electron-builder.yml', {
    cwd: desktopDir,
    stdio: 'inherit',
    env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' },
  });
  console.log('\nBuild completed successfully.');
} catch {
  if (process.platform === 'win32' && existsSync(exePath)) {
    console.log('\nelectron-builder exited with an error (likely winCodeSign symlink issue).');
    console.log('The build output exists and should be functional:');
    console.log(`  ${exePath}`);
  } else {
    console.error('\nBuild failed — no output exe found.');
    process.exit(1);
  }
}
