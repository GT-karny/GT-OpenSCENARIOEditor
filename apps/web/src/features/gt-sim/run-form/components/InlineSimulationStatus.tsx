/**
 * Compact status card for the most recently submitted job — polls while the
 * job is active, shows a progress bar and error excerpt.
 *
 * Ported from the GT_Sim fork's `components/InlineSimulationStatus.tsx`. The
 * "Details →" / "Re-run" actions navigated to `SimulationDetailPage`
 * (cluster D, not ported yet) — dropped here; TODO left for when cluster D
 * lands and the job-detail panel exists to navigate to.
 *
 * queryKey `['job', jobId]` follows the shared convention
 * (`features/gt-sim/query-client.ts`) — the same key `RunFormPanel` uses to
 * derive `isRunning`, so react-query dedupes the network call.
 */
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import { useGtSimApi } from '../../lib';
import { StatusBadge } from '../../ui';

export interface InlineSimulationStatusProps {
  jobId: string;
}

export function InlineSimulationStatus({ jobId }: InlineSimulationStatusProps) {
  const { t } = useTranslation('common');
  const api = useGtSimApi();

  const { data: sim } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api!.getSimulation(jobId),
    enabled: api !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'running' || status === 'queued' ? 1000 : false;
    },
  });

  if (!sim) {
    return (
      <div className="bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] p-3 animate-pulse">
        <div className="h-4 bg-[var(--color-glass-hover)] w-32" />
      </div>
    );
  }

  const isActive = sim.status === 'running' || sim.status === 'queued';
  const isFailed = sim.status === 'failed' || sim.status === 'timeout';

  // Backend-only field not in the documented GtSimSimulationStatus wire type
  // (fork read it the same defensive way).
  const simTime = (sim as unknown as Record<string, unknown>).sim_time as number | undefined;

  return (
    <div className="bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] p-3 space-y-2">
      {/* Status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge status={sim.status} />
          <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
            {sim.job_id}
          </span>
        </div>
      </div>

      {/* Progress bar (running/queued) */}
      {isActive && (
        <div className="space-y-1">
          <div className="w-full h-1.5 bg-[var(--color-glass-1)] overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent-vivid)] transition-all duration-500"
              style={{ width: `${Math.min(sim.progress_pct, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
            <span>{t('gtSim.runForm.status.progress', { value: sim.progress_pct })}</span>
            {simTime !== undefined && (
              <span>{t('gtSim.runForm.status.simTime', { value: simTime.toFixed(1) })}</span>
            )}
          </div>
        </div>
      )}

      {/* Error excerpt (failed) */}
      {isFailed && sim.error_message && (
        <p className="text-xs text-[var(--color-destructive)] truncate" title={sim.error_message}>
          {sim.error_message.length > 120
            ? sim.error_message.slice(0, 120) + '...'
            : sim.error_message}
        </p>
      )}
    </div>
  );
}
