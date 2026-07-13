/**
 * GT_Sim job-status contract and the adapter to the editor's simulation status.
 *
 * The GT_Sim backend reports a raw string status (6 closed values). The editor
 * (`@osce/shared` `SimulationStatus`) uses a 4-value union. This module freezes
 * both the status value set and the mapping so every UI lane maps identically.
 * The mapping helpers are pure and derived from the constant tables below (the
 * tables ARE the contract); the REST/WS client implementation is WP1.
 */

import type { SimulationStatus } from '@osce/shared';

/**
 * Raw GT_Sim job status — the closed set of strings the backend can emit
 * (web/backend/models/simulation.py). `GtSimSimulationStatus.status` is typed
 * as `string` on the wire; narrow it to this union after receipt.
 */
export type GtSimJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

/**
 * Editor-facing status. Alias of `@osce/shared` `SimulationStatus`
 * (`'idle' | 'running' | 'completed' | 'error'`) — re-declared here as the
 * mapping target so the contract is self-documenting.
 */
export type EditorSimulationStatus = SimulationStatus;

/**
 * GT_Sim job status -> editor status mapping.
 *
 * Rationale:
 *  - `queued`    -> `running`: the job is accepted and live from the editor's
 *    point of view; it is not yet producing frames. Distinguish the pre-start
 *    "waiting" phase with the separate `isGtSimWaiting` flag rather than a
 *    distinct status (the editor union has no `queued`/`idle`-while-live state).
 *  - `running`   -> `running`.
 *  - `completed` -> `completed`.
 *  - `failed` / `cancelled` / `timeout` -> `error`: all three are terminal
 *    non-success outcomes; the editor union collapses them to `error`. The
 *    original reason is preserved out-of-band via `error_message`.
 */
export const GT_SIM_STATUS_TO_EDITOR: Readonly<Record<GtSimJobStatus, EditorSimulationStatus>> = {
  queued: 'running',
  running: 'running',
  completed: 'completed',
  failed: 'error',
  cancelled: 'error',
  timeout: 'error',
} as const;

/**
 * Statuses for which the job is live but has not started producing frames yet.
 * UI shows a "waiting"/"queued" affordance instead of a running indicator.
 */
export const GT_SIM_WAITING_STATUSES: readonly GtSimJobStatus[] = ['queued'] as const;

/** Terminal statuses (job will emit no further progress). */
export const GT_SIM_TERMINAL_STATUSES: readonly GtSimJobStatus[] = [
  'completed',
  'failed',
  'cancelled',
  'timeout',
] as const;

/** Map a raw GT_Sim job status to the editor `SimulationStatus`. */
export function mapGtSimStatus(status: GtSimJobStatus): EditorSimulationStatus {
  return GT_SIM_STATUS_TO_EDITOR[status];
}

/** True while the job is accepted but not yet producing frames (`queued`). */
export function isGtSimWaiting(status: GtSimJobStatus): boolean {
  return GT_SIM_WAITING_STATUSES.includes(status);
}

/** True once the job has reached a terminal outcome. */
export function isGtSimTerminal(status: GtSimJobStatus): boolean {
  return GT_SIM_TERMINAL_STATUSES.includes(status);
}

/**
 * Convert GT_Sim `progress_pct` (integer 0-100) to the editor's `progress`
 * scale (float 0-1), clamped to the valid range.
 */
export function mapGtSimProgress(progressPct: number): number {
  return Math.min(1, Math.max(0, progressPct / 100));
}
