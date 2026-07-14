/**
 * Ports the fork's `hooks/useJobPolling.ts` near-verbatim: tracks a "live"
 * job — either explicitly started from this session (`handleRunning`) or
 * detected because it was started externally (e.g. via API) — and
 * auto-clears the tracked id shortly after the job reaches a terminal state.
 *
 * The fork version had no react-router dependency either, so this is a
 * direct port: react-query gated on the GT_Sim backend connection
 * (`enabled: api !== null`) and `@osce/esmini`'s status adapters instead of
 * local terminal-state checks.
 *
 * Note: the fork's only consumer of this hook is `ProjectDetailPage`
 * (cluster A — project management, out of scope per the migration plan's
 * appendix §A "原則移植しない"). It is ported here as instructed (WP4
 * cluster D file table) and is available for other lanes (e.g. cluster B's
 * run form) to import if they need "the currently live job" tracking.
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { GtSimSimulationStatus } from '@osce/esmini';
import { useGtSimApi } from '../../lib';
import {
  isTerminalJobStatus,
  JOB_ACTIVE_PROBE_INTERVAL_MS,
  JOB_DETAIL_ACTIVE_INTERVAL_MS,
  JOB_POLLING_CLEAR_DELAY_MS,
} from '../lib/polling';

export interface UseJobPollingResult {
  runningJobId: string | null;
  setRunningJobId: (jobId: string | null) => void;
  latestJobId: string | null;
  runningJobStatus: GtSimSimulationStatus | undefined;
  isJobActive: boolean;
  handleRunning: (jobId: string) => void;
}

export function useJobPolling(): UseJobPollingResult {
  const api = useGtSimApi();
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [latestJobId, setLatestJobId] = useState<string | null>(null);

  // --- Detect externally-started running jobs ---
  const { data: activeJobs } = useQuery({
    queryKey: ['jobs', 'active-probe'],
    queryFn: () => api!.getSimulations({ status: 'running', limit: 1 }),
    // Only poll when we are NOT already tracking a job.
    enabled: api !== null && !runningJobId,
    refetchInterval: JOB_ACTIVE_PROBE_INTERVAL_MS,
  });

  // Adopt an externally-started running job (render-time adjustment: guarded
  // by !runningJobId, which becomes truthy once set, so this latches exactly
  // once — https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  if (!runningJobId && activeJobs && activeJobs.jobs.length > 0) {
    const job = activeJobs.jobs[0];
    setRunningJobId(job.job_id);
    setLatestJobId(job.job_id);
  }

  // --- Poll the tracked job's status ---
  const { data: runningJobStatus } = useQuery({
    queryKey: ['job', runningJobId],
    queryFn: () => api!.getSimulation(runningJobId!),
    enabled: api !== null && !!runningJobId,
    refetchInterval: JOB_DETAIL_ACTIVE_INTERVAL_MS,
  });

  // Auto-clear the tracked job shortly after it reaches a terminal state.
  useEffect(() => {
    if (!runningJobStatus) return;
    if (isTerminalJobStatus(runningJobStatus.status)) {
      const timer = globalThis.setTimeout(() => {
        setRunningJobId(null);
      }, JOB_POLLING_CLEAR_DELAY_MS);
      return () => globalThis.clearTimeout(timer);
    }
  }, [runningJobStatus]);

  const isJobActive =
    !!runningJobId && !!runningJobStatus && !isTerminalJobStatus(runningJobStatus.status);

  const handleRunning = (jobId: string) => {
    setRunningJobId(jobId);
    setLatestJobId(jobId);
  };

  return {
    runningJobId,
    setRunningJobId,
    latestJobId,
    runningJobStatus,
    isJobActive,
    handleRunning,
  };
}
