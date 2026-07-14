/**
 * Pure polling-interval helpers for the jobs cluster (D).
 *
 * Extracted from the hook/panel code so the "running -> fast poll, idle ->
 * slow poll" policy (migration plan WP4 cluster D instruction #5; fork
 * behavior: job list used a constant 3000ms, job detail polled at 1000ms
 * while active) can be unit tested without mounting react-query.
 */
import { isGtSimTerminal, narrowGtSimStatus } from '@osce/esmini';
import type { GtSimSimulationStatus } from '@osce/esmini';

/** Job list polling: fast while any job on the current page is live, slow otherwise. */
export const JOB_LIST_ACTIVE_INTERVAL_MS = 2000;
export const JOB_LIST_IDLE_INTERVAL_MS = 8000;

/** Job detail polling: fast while the tracked job is running/queued. */
export const JOB_DETAIL_ACTIVE_INTERVAL_MS = 1000;

/** `useJobPolling`'s externally-started-job discovery probe (fork: 2000ms). */
export const JOB_ACTIVE_PROBE_INTERVAL_MS = 2000;

/** Delay before `useJobPolling` stops tracking a job after it turns terminal. */
export const JOB_POLLING_CLEAR_DELAY_MS = 2000;

/** True once a raw wire status string reaches a terminal outcome. */
export function isTerminalJobStatus(status: string): boolean {
  return isGtSimTerminal(narrowGtSimStatus(status));
}

/** `refetchInterval` for the job list query, given the current page's jobs. */
export function jobListRefetchInterval(jobs: readonly GtSimSimulationStatus[]): number {
  const hasActiveJob = jobs.some((job) => !isTerminalJobStatus(job.status));
  return hasActiveJob ? JOB_LIST_ACTIVE_INTERVAL_MS : JOB_LIST_IDLE_INTERVAL_MS;
}

/** `refetchInterval` for a single job's detail query (`false` stops polling). */
export function jobDetailRefetchInterval(status: string | undefined): number | false {
  if (status === undefined) return false;
  return isTerminalJobStatus(status) ? false : JOB_DETAIL_ACTIVE_INTERVAL_MS;
}
