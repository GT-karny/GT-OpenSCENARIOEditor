import { execFile } from 'child_process';
import { resolve } from 'path';

const GT_SIM_EXE = resolve(
  __dirname,
  '../../../Thirdparty/GT_Sim_v0.6.0-rc/server/gt_sim_web.exe',
);
const GT_SIM_CWD = resolve(
  __dirname,
  '../../../Thirdparty/GT_Sim_v0.6.0-rc',
);
const HEALTH_URL = 'http://127.0.0.1:8000/api/health';
const MAX_WAIT_MS = 15_000;
const POLL_INTERVAL_MS = 500;

async function waitForHealth(url: string, timeout: number): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server not ready yet
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`GT_Sim health check timed out after ${timeout}ms`);
}

export default async function globalSetup() {
  if (!process.env.USE_GT_SIM) return;

  const proc = execFile(GT_SIM_EXE, ['--host', '127.0.0.1', '--port', '8000'], {
    cwd: GT_SIM_CWD,
  });

  proc.on('error', (err) => {
    console.error('Failed to start GT_Sim:', err.message);
  });

  await waitForHealth(HEALTH_URL, MAX_WAIT_MS);

  // Playwright pattern: return teardown function from globalSetup
  return async () => {
    proc.kill();
  };
}
