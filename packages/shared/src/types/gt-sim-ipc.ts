/**
 * IPC contract between the Electron main process (which spawns and supervises
 * the GT_Sim FastAPI backend) and the renderer (`apps/web`).
 *
 * Two channels only (see `GTSIM_IPC_CHANNELS`):
 *  - `gtsim:getEndpoints` — request/response: renderer asks main for the
 *    resolved backend endpoints (the port is scanned at startup, so it is not
 *    known ahead of time).
 *  - `gtsim:status` — main -> renderer push (`webContents.send`): lifecycle
 *    updates so the renderer can show a backend-status banner.
 *
 * This module is additive to `@osce/shared` and changes no existing type
 * (immutable-package rule).
 */

/**
 * Resolved connection info for the GT_Sim backend, returned by
 * `gtsim:getEndpoints`. The renderer injects these into the `@osce/esmini`
 * REST/WS clients (which take an absolute base URL / host).
 */
export interface GtSimEndpoints {
  /** Absolute REST base URL, e.g. `http://127.0.0.1:8000`. */
  restBaseUrl: string;
  /** Absolute WebSocket base URL, e.g. `ws://127.0.0.1:8000`. */
  wsBaseUrl: string;
  /**
   * Resolved gRPC port on localhost. Reserved for the future main-side gRPC
   * bridge (design judgment D1); the renderer streams over WS and can ignore it.
   */
  grpcPort: number;
}

/**
 * Lifecycle state of the GT_Sim backend process, pushed over `gtsim:status`.
 *  - `starting`: process spawned, waiting for `/api/health`.
 *  - `ready`: health check passed; `endpoints` is populated.
 *  - `failed`: never became healthy (spawn error / port scan / health timeout).
 *  - `crashed`: was ready, then exited unexpectedly.
 */
export type GtSimBackendState = 'starting' | 'ready' | 'failed' | 'crashed';

/** Payload pushed on the `gtsim:status` channel. */
export interface GtSimBackendStatus {
  state: GtSimBackendState;
  /** Resolved endpoints; present once `state === 'ready'`. */
  endpoints?: GtSimEndpoints;
  /** Human-readable detail; set on `failed` / `crashed`. */
  message?: string;
  /** OS process id of the backend, when it has been spawned. */
  pid?: number;
}

/** Canonical IPC channel names for the GT_Sim backend bridge. */
export const GTSIM_IPC_CHANNELS = {
  /** Renderer -> main (invoke): resolve `GtSimEndpoints`. */
  getEndpoints: 'gtsim:getEndpoints',
  /** Main -> renderer (send): `GtSimBackendStatus` lifecycle push. */
  status: 'gtsim:status',
} as const;

/** Union of the GT_Sim IPC channel name string literals. */
export type GtSimIpcChannel = (typeof GTSIM_IPC_CHANNELS)[keyof typeof GTSIM_IPC_CHANNELS];
