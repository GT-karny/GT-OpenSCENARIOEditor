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

// GT_Sim backend (WP2) is spawned by the Electron main process itself
// (src/main/python-server.ts), gated on env vars — not launched here to avoid a
// double lifecycle. We only surface the selected mode and forward the vars.
//
//   GTSIM_BACKEND=1                  → main spawns the fork FastAPI backend
//                                      (needs Thirdparty/GT_Sim/.../start_server.py;
//                                      uses DriverScript/.venv python if present,
//                                      else `python`/GTSIM_PYTHON).
//   GTSIM_PORT=8000                  → connect mode: main only health-checks a
//                                      manually-started backend (no spawn).
//   GTSIM_BACKEND_ROOT=<esmini-root> → override backend location if autodetect
//                                      fails.
if (process.env.GTSIM_PORT) {
  console.log(`[dev] GT_Sim: connect mode (health-check existing backend on port ${process.env.GTSIM_PORT}).`);
} else if (/^(1|true|on)$/i.test(process.env.GTSIM_BACKEND ?? '')) {
  console.log('[dev] GT_Sim: spawn mode (main process will start the FastAPI backend).');
} else {
  console.log('[dev] GT_Sim backend disabled (set GTSIM_BACKEND=1 or GTSIM_PORT to enable).');
}

// 5. Wait for servers to start, then launch Electron
console.log('Waiting for dev servers to start...');
setTimeout(() => {
  const electronProc = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true,
    cwd: desktopDir,
    env: process.env,
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
