import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../..');

// 1. Start the Fastify backend server
const serverProc = spawn('pnpm', ['--filter', '@osce/server', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: rootDir,
});

// 2. Start the Vite dev server for the frontend
const viteProc = spawn('pnpm', ['--filter', '@osce/web', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: rootDir,
});

// 3. Build the preload script
const desktopDir = path.resolve(__dirname, '..');
spawn('node', ['scripts/build-preload.mjs'], {
  stdio: 'inherit',
  cwd: desktopDir,
});

// 4. Compile the main process TypeScript
spawn('npx', ['tsc', '--project', 'tsconfig.main.json'], {
  stdio: 'inherit',
  shell: true,
  cwd: desktopDir,
});

// 5. Wait for servers to start, then launch Electron
console.log('Waiting for dev servers to start...');
setTimeout(() => {
  const electronProc = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true,
    cwd: desktopDir,
    env: {
      ...process.env,
      ELECTRON_DEV: 'true',
    },
  });

  electronProc.on('close', () => {
    serverProc.kill();
    viteProc.kill();
    process.exit();
  });
}, 5000);

// Handle SIGINT/SIGTERM
function cleanup() {
  serverProc.kill();
  viteProc.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
