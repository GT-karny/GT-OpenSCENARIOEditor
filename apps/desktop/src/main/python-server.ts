/**
 * GT_Sim FastAPI backend lifecycle manager (WP2 of the unified-UI migration).
 *
 * Ported from the GT_Sim fork's `web/electron/src/main/server.ts`, but with the
 * path-resolution rewritten for the editor's `apps/desktop` layout and hardened
 * with the behaviours called out in the migration plan (§WP2 / risk R4):
 *   - free-port scan from 8000 (HTTP) / 50051 (gRPC)
 *   - `/api/health` readiness wait
 *   - up to 3 start attempts
 *   - Windows child-process-tree teardown via `taskkill /PID <pid> /T /F`
 *   - lifecycle status emission (`starting` / `ready` / `failed` / `crashed`)
 *
 * This module intentionally imports **no** Electron API so its port-scan /
 * health-wait helpers stay unit-testable in a plain Node context. The Electron
 * glue (isPackaged, resourcesPath, mainDir, webContents.send) is injected by
 * `index.ts`.
 *
 * IPC contract (frozen): `packages/shared/src/types/gt-sim-ipc.ts`.
 */

import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import Store from 'electron-store';
import type { GtSimBackendStatus, GtSimConnectConfig, GtSimEndpoints } from '@osce/shared';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_HOST = '127.0.0.1';
const BASE_HTTP_PORT = 8000;
const BASE_GRPC_PORT = 50051;
const PORT_SCAN_SPAN = 50; // scan [base, base + span)
const HEALTH_ENDPOINT = '/api/health';
const HEALTH_POLL_INTERVAL_MS = 300;
const HEALTH_TIMEOUT_MS = 30_000;
const MAX_START_ATTEMPTS = 3;
const STATUS_EVENT = 'status';

// ---------------------------------------------------------------------------
// Options injected from the Electron main process
// ---------------------------------------------------------------------------

export interface GtSimBackendOptions {
  /** `app.isPackaged`. */
  isPackaged: boolean;
  /** `process.resourcesPath` (packaged resource root). */
  resourcesPath: string;
  /** Directory of the running main module (`import.meta.dirname`), used to
   *  locate the fork backend in dev by walking up to the monorepo root. */
  mainDir: string;
}

interface ResolvedCommand {
  command: string;
  args: string[];
  cwd: string;
  /** Extra environment for the child (port overrides, package root). */
  env: NodeJS.ProcessEnv;
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

const emitter = new EventEmitter();
let serverProcess: ChildProcess | null = null;
let currentStatus: GtSimBackendStatus | null = null;
let stopping = false;
let starting = false;
/**
 * Monotonic counter identifying the most recent `connectToBackend` call. A
 * connect attempt only applies its outcome (`setStatus`) if it is still the
 * newest one when it settles — an older attempt superseded by a fresh
 * `gtsim:connect` (different host/port, or a plain retry) must not clobber
 * the newer attempt's status with its own late success/failure.
 */
let connectGeneration = 0;

// ---------------------------------------------------------------------------
// Persisted connect-mode settings (electron-store)
// ---------------------------------------------------------------------------

interface ConnectStoreSchema {
  connectConfig: GtSimConnectConfig | null;
}

// Lazily constructed: `Store` touches Electron's `app.getPath` on first use,
// and this module is otherwise plain-Node/unit-testable (see header comment)
// — importing it must not require an Electron runtime.
let connectStore: Store<ConnectStoreSchema> | null = null;
function getConnectStore(): Store<ConnectStoreSchema> {
  connectStore ??= new Store<ConnectStoreSchema>({ defaults: { connectConfig: null } });
  return connectStore;
}

/** Persisted connect-mode target from a previous `gtsim:connect`, or `null`. */
export function getPersistedConnectConfig(): GtSimConnectConfig | null {
  return getConnectStore().get('connectConfig');
}

function setPersistedConnectConfig(config: GtSimConnectConfig): void {
  getConnectStore().set('connectConfig', config);
}

/** Fill in defaults (host) so downstream code always has a concrete target. */
function normalizeConnectConfig(config: GtSimConnectConfig): Required<GtSimConnectConfig> {
  const host = config.host?.trim();
  return { host: host && host.length > 0 ? host : DEFAULT_HOST, port: config.port };
}

// ---------------------------------------------------------------------------
// Enablement gate / startup plan
// ---------------------------------------------------------------------------

/**
 * `GTSIM_PORT` as a connect-mode target, or `null` if unset/invalid.
 * Env vars always take priority over persisted settings (dev override).
 */
function resolveEnvConnectConfig(): GtSimConnectConfig | null {
  const raw = process.env.GTSIM_PORT;
  if (!raw) return null;
  const port = Number.parseInt(raw, 10);
  return Number.isFinite(port) && port > 0 ? { host: DEFAULT_HOST, port } : null;
}

/** `GTSIM_BACKEND=1|true|on` — spawn the backend. */
function isEnvSpawnRequested(): boolean {
  const flag = process.env.GTSIM_BACKEND?.toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'on';
}

/** What `initGtSimBackend` (index.ts) should do at app startup. */
export type GtSimStartupPlan =
  | { mode: 'spawn' }
  | { mode: 'connect'; config: GtSimConnectConfig }
  | { mode: 'disabled' };

/**
 * Resolve the startup plan: env vars (`GTSIM_BACKEND` / `GTSIM_PORT`) always
 * override, exactly as before; falling back to the persisted connect-mode
 * setting (from a previous `gtsim:connect`, e.g. via the settings panel) when
 * no env var is set; otherwise the backend is left disabled, as before.
 */
export function resolveStartupPlan(): GtSimStartupPlan {
  const envConnect = resolveEnvConnectConfig();
  if (envConnect) return { mode: 'connect', config: envConnect };
  if (isEnvSpawnRequested()) return { mode: 'spawn' };

  const persisted = getPersistedConnectConfig();
  if (persisted) return { mode: 'connect', config: persisted };

  return { mode: 'disabled' };
}

// ---------------------------------------------------------------------------
// Status plumbing (consumed by index.ts → webContents.send)
// ---------------------------------------------------------------------------

/** Subscribe to backend status changes. Returns an unsubscribe function. */
export function onBackendStatus(
  listener: (status: GtSimBackendStatus) => void,
): () => void {
  emitter.on(STATUS_EVENT, listener);
  return () => emitter.off(STATUS_EVENT, listener);
}

/** Latest status, or `null` before the first transition. */
export function getCurrentStatus(): GtSimBackendStatus | null {
  return currentStatus;
}

/** Resolved endpoints once `ready`, else `null` (answer to `gtsim:getEndpoints`). */
export function getCurrentEndpoints(): GtSimEndpoints | null {
  return currentStatus?.state === 'ready' ? (currentStatus.endpoints ?? null) : null;
}

/** True while the process is alive. */
export function isGtSimBackendRunning(): boolean {
  return serverProcess !== null && serverProcess.exitCode === null;
}

function setStatus(status: GtSimBackendStatus): void {
  currentStatus = status;
  emitter.emit(STATUS_EVENT, status);
}

// ---------------------------------------------------------------------------
// Port scanning
// ---------------------------------------------------------------------------

/** Resolve whether a single TCP port is free to bind on `host`. */
function isPortFree(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, host);
  });
}

/**
 * Return the first free port at/after `startPort` (scanning `PORT_SCAN_SPAN`
 * candidates). Rejects if none is free in range.
 */
export async function findFreePort(
  host: string,
  startPort: number,
  span: number = PORT_SCAN_SPAN,
): Promise<number> {
  for (let port = startPort; port < startPort + span; port++) {
    if (await isPortFree(host, port)) return port;
  }
  throw new Error(
    `No free port found in range ${startPort}–${startPort + span - 1} on ${host}`,
  );
}

// ---------------------------------------------------------------------------
// Health wait
// ---------------------------------------------------------------------------

/** Poll `${HEALTH_ENDPOINT}` until it answers 200, or reject after `timeoutMs`. */
export function waitForHealth(
  host: string,
  port: number,
  timeoutMs: number = HEALTH_TIMEOUT_MS,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    const poll = (): void => {
      if (Date.now() > deadline) {
        reject(new Error(`Backend did not become ready within ${timeoutMs}ms`));
        return;
      }

      const req = http.get(
        { hostname: host, port, path: HEALTH_ENDPOINT, timeout: 2000 },
        (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            setTimeout(poll, HEALTH_POLL_INTERVAL_MS);
          }
          res.resume(); // drain
        },
      );

      req.on('error', () => setTimeout(poll, HEALTH_POLL_INTERVAL_MS));
      req.on('timeout', () => {
        req.destroy();
        setTimeout(poll, HEALTH_POLL_INTERVAL_MS);
      });
    };

    poll();
  });
}

// ---------------------------------------------------------------------------
// Path / command resolution
// ---------------------------------------------------------------------------

/**
 * Locate the GT_Sim esmini fork root (the dir containing `GT_esmini/` and
 * `EnvironmentSimulator/`) in a dev checkout.
 *
 * Priority:
 *  1. `GTSIM_BACKEND_ROOT` env override.
 *  2. Walk up from `mainDir` and `process.cwd()` until a
 *     `Thirdparty/GT_Sim/GT_esmini/web/start_server.py` marker is found.
 */
function resolveEsminiRoot(mainDir: string): string | null {
  const override = process.env.GTSIM_BACKEND_ROOT;
  if (override) return override;

  const rel = path.join(
    'Thirdparty',
    'GT_Sim',
    'GT_esmini',
    'web',
    'start_server.py',
  );
  const marker = path.join('Thirdparty', 'GT_Sim');

  for (const start of [mainDir, process.cwd()]) {
    let dir = start;
    for (let depth = 0; depth < 12; depth++) {
      if (existsSync(path.join(dir, rel))) {
        return path.join(dir, marker);
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return null;
}

/**
 * Resolve how to launch the FastAPI backend for the given (already-scanned)
 * ports, branching on packaged vs dev.
 */
function resolveCommand(
  opts: GtSimBackendOptions,
  host: string,
  httpPort: number,
  grpcPort: number,
): ResolvedCommand {
  const portEnv: NodeJS.ProcessEnv = {
    GT_SIM_HTTP_PORT: String(httpPort),
    GT_SIM_GRPC_PORT: String(grpcPort),
  };

  if (opts.isPackaged) {
    // TODO(WP6): finalize the packaged staging layout. The WP6 staging script
    // will collect gt_sim_web.exe + bin/ + config/ + resources/ under a
    // dedicated resources subfolder. This assumes `resources/gtsim-backend/`
    // with `server/gt_sim_web.exe` and treats that folder as the package root
    // (config.py's GT_SIM_WEB_PACKAGE_ROOT).
    const packageRoot = path.join(opts.resourcesPath, 'gtsim-backend');
    const serverExe = path.join(packageRoot, 'server', 'gt_sim_web.exe');
    return {
      command: serverExe,
      args: ['--host', host, '--port', String(httpPort)],
      cwd: packageRoot,
      env: { ...portEnv, GT_SIM_WEB_PACKAGE_ROOT: packageRoot },
    };
  }

  // Dev: run start_server.py with the fork's DriverScript venv Python if
  // present, else fall back to a system interpreter.
  const esminiRoot = resolveEsminiRoot(opts.mainDir);
  if (!esminiRoot) {
    throw new Error(
      'GT_Sim backend root not found. Set GTSIM_BACKEND_ROOT to the esmini ' +
        'fork root (the dir containing GT_esmini/ and EnvironmentSimulator/).',
    );
  }

  const startScript = path.join(esminiRoot, 'GT_esmini', 'web', 'start_server.py');
  if (!existsSync(startScript)) {
    throw new Error(`GT_Sim start script not found: ${startScript}`);
  }

  const venvPython =
    process.platform === 'win32'
      ? path.join(esminiRoot, 'DriverScript', '.venv', 'Scripts', 'python.exe')
      : path.join(esminiRoot, 'DriverScript', '.venv', 'bin', 'python');

  const fallbackPython =
    process.env.GTSIM_PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3');
  const command = existsSync(venvPython) ? venvPython : fallbackPython;

  return {
    command,
    args: [startScript, '--host', host, '--port', String(httpPort)],
    cwd: esminiRoot,
    env: portEnv,
  };
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

function buildEndpoints(host: string, httpPort: number, grpcPort: number): GtSimEndpoints {
  return {
    restBaseUrl: `http://${host}:${httpPort}`,
    wsBaseUrl: `ws://${host}:${httpPort}`,
    grpcPort,
  };
}

// ---------------------------------------------------------------------------
// Start / stop
// ---------------------------------------------------------------------------

/** One spawn attempt: pick ports, spawn, wait for health. Cleans up on failure. */
async function startOnce(opts: GtSimBackendOptions): Promise<GtSimEndpoints> {
  const host = DEFAULT_HOST;
  const [httpPort, grpcPort] = await Promise.all([
    findFreePort(host, BASE_HTTP_PORT),
    findFreePort(host, BASE_GRPC_PORT),
  ]);
  const { command, args, cwd, env } = resolveCommand(opts, host, httpPort, grpcPort);

  console.log(`[gtsim] Starting: ${command} ${args.join(' ')}`);
  console.log(`[gtsim] CWD: ${cwd}  HTTP:${httpPort} gRPC:${grpcPort}`);

  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  serverProcess = child;

  child.stdout?.on('data', (data: Buffer) => {
    process.stdout.write(`[gtsim] ${data.toString()}`);
  });
  child.stderr?.on('data', (data: Buffer) => {
    process.stderr.write(`[gtsim] ${data.toString()}`);
  });

  child.on('exit', (code, signal) => {
    console.log(`[gtsim] Exited (code=${code}, signal=${signal})`);
    // Only the *current* process may mutate module state: a stale child from a
    // failed attempt can exit late (async taskkill) after a newer attempt has
    // already spawned/become ready, and must not clobber its status.
    if (serverProcess !== child) return;
    serverProcess = null;
    // Unexpected exit after readiness → crashed. Pre-ready exits are handled by
    // the start attempt (earlyExit race below); stop() suppresses via `stopping`.
    if (currentStatus?.state === 'ready' && !stopping) {
      setStatus({
        state: 'crashed',
        message: `Backend exited unexpectedly (code=${code}, signal=${signal})`,
        pid: child.pid,
      });
    }
  });

  setStatus({ state: 'starting', pid: child.pid });

  // Fast-fail path: reject on spawn error, or on the child exiting before it
  // ever became healthy (e.g. missing deps → immediate non-zero exit). Without
  // this, a dead child would burn the full health timeout on every attempt.
  // Note: Promise.race subscribes to this promise, so a post-ready exit
  // rejecting it later is not an unhandled rejection.
  const earlyExit = new Promise<never>((_resolve, reject) => {
    child.once('error', (err) => reject(err));
    child.once('exit', (code, signal) =>
      reject(
        new Error(`Backend exited before becoming ready (code=${code}, signal=${signal})`),
      ),
    );
  });

  try {
    await Promise.race([waitForHealth(host, httpPort), earlyExit]);
  } catch (err) {
    // Clean up the half-started child before the caller retries.
    killProcessTree(child);
    if (serverProcess === child) serverProcess = null;
    throw err;
  }

  const endpoints = buildEndpoints(host, httpPort, grpcPort);
  setStatus({ state: 'ready', endpoints, pid: child.pid });
  console.log('[gtsim] Ready.');
  return endpoints;
}

/**
 * Start the GT_Sim backend by spawning it (`GTSIM_BACKEND=1` path only — see
 * `resolveStartupPlan`; a pre-started backend is reached via
 * `requestGtSimConnect` instead). Emits status transitions and resolves with
 * the endpoints on success. On failure it emits `failed` and rejects —
 * callers (index.ts) should treat this as non-fatal for the editor.
 */
export async function startGtSimBackend(
  opts: GtSimBackendOptions,
): Promise<GtSimEndpoints> {
  if (starting) {
    throw new Error('GT_Sim backend start already in progress');
  }
  if (isGtSimBackendRunning()) {
    const existing = getCurrentEndpoints();
    if (existing) return existing;
  }

  starting = true;
  stopping = false;

  try {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_START_ATTEMPTS; attempt++) {
      // A `requestGtSimConnect` call may have stopped this spawn mid-retry
      // (e.g. the user connected to a different backend via the settings
      // panel) — abort silently rather than keep spawning or overwrite the
      // newer connect's status with a stale `failed`.
      if (stopping) {
        throw new Error('GT_Sim backend start aborted (stopped)');
      }
      try {
        console.log(`[gtsim] Start attempt ${attempt}/${MAX_START_ATTEMPTS}`);
        return await startOnce(opts);
      } catch (err) {
        lastError = err;
        console.error(`[gtsim] Attempt ${attempt} failed:`, (err as Error).message);
      }
    }

    if (stopping) {
      throw new Error('GT_Sim backend start aborted (stopped)');
    }
    const message = `Backend failed to start after ${MAX_START_ATTEMPTS} attempts: ${
      (lastError as Error)?.message ?? 'unknown error'
    }`;
    setStatus({ state: 'failed', message });
    throw new Error(message);
  } finally {
    starting = false;
  }
}

/** Kill a child process tree (Windows: taskkill /T /F; else SIGTERM). */
function killProcessTree(child: ChildProcess): void {
  try {
    if (process.platform === 'win32' && child.pid) {
      spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    // Process may already have exited.
  }
}

/**
 * Stop the backend and its child-process tree. Idempotent, and safe to call
 * with no spawned process (e.g. before connecting to a pre-started backend,
 * which never spawns one) — it just marks any in-progress spawn as aborted.
 */
export function stopGtSimBackend(): void {
  stopping = true;
  const child = serverProcess;
  if (!child) return;

  console.log(`[gtsim] Stopping (pid=${child.pid})...`);
  killProcessTree(child);
  serverProcess = null;
}

// ---------------------------------------------------------------------------
// Connect mode (pre-started backend, e.g. the settings-panel "connect" flow)
// ---------------------------------------------------------------------------

/**
 * Health-check a pre-started backend at `config` and, on success, mark it
 * `ready`. Each call is independent (no `starting`-style reentrancy guard) so
 * a failed connect can always be retried by calling this again — see
 * `connectGeneration` for how overlapping calls are resolved.
 */
async function connectToBackend(config: Required<GtSimConnectConfig>): Promise<GtSimEndpoints> {
  const generation = ++connectGeneration;
  const grpcPort = Number.parseInt(process.env.GTSIM_GRPC_PORT ?? String(BASE_GRPC_PORT), 10);

  console.log(`[gtsim] Connect mode: health-checking backend on ${config.host}:${config.port}`);
  setStatus({ state: 'starting' });

  try {
    await waitForHealth(config.host, config.port);
  } catch (err) {
    if (generation !== connectGeneration) {
      // Superseded by a newer connect request; that one owns the status now.
      throw new Error('GT_Sim connect aborted (superseded by a newer connect request)');
    }
    const message = `Could not reach backend on ${config.host}:${config.port}: ${
      (err as Error).message
    }`;
    setStatus({ state: 'failed', message });
    throw new Error(message);
  }

  if (generation !== connectGeneration) {
    throw new Error('GT_Sim connect aborted (superseded by a newer connect request)');
  }
  const endpoints = buildEndpoints(config.host, config.port, grpcPort);
  setStatus({ state: 'ready', endpoints });
  console.log('[gtsim] Connected.');
  return endpoints;
}

/**
 * (Re)connect to a manually-started GT_Sim backend at `config` — the
 * `gtsim:connect` IPC handler's implementation. Stops any currently spawned
 * backend or in-progress spawn attempt first, then persists `config` (unless
 * `persist: false`, used for the env-var startup override so it does not
 * silently clobber a user's saved settings) and health-checks the new target.
 *
 * Safe to call repeatedly — including immediately after a failure — which is
 * how the settings panel's "Connect" button recovers from a bad host/port
 * without requiring an app restart.
 */
export async function requestGtSimConnect(
  rawConfig: GtSimConnectConfig,
  options: { persist?: boolean } = {},
): Promise<GtSimEndpoints> {
  const config = normalizeConnectConfig(rawConfig);

  stopGtSimBackend();

  if (options.persist !== false) {
    setPersistedConnectConfig({ host: config.host, port: config.port });
  }

  return connectToBackend(config);
}
