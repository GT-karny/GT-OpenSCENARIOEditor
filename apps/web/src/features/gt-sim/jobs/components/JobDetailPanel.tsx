/**
 * Job detail panel — right inspector slot (order 50). Ports the fork's
 * `pages/SimulationDetailPage.tsx`.
 *
 * `useParams`/`useNavigate`/`Link` are replaced by `jobs-view-store`
 * (`selectedJobId`), per the migration plan's D6 decision (no router in the
 * execution mode).
 *
 * NOT ported (see cluster D task brief §3): the fork embeds a live OSI feed
 * (`OsiLivePanel`) and VirtualDriver telemetry (`LiveVdPanel`) here while the
 * job is running, plus a "Re-run" button that navigates to the project's run
 * form. Those belong to other clusters:
 *  - OsiLivePanel / LiveVdPanel: clusters E / F (not yet landed). See the
 *    TODO marker below — WP5 (trunk) wires a "view live" transition from
 *    this panel once those land.
 *  - Re-run (re-opening the run form with the scenario preselected): cluster
 *    B's run form + cluster A's project navigation, neither in scope here.
 *    Deferred; see this lane's final report.
 */
import { useMemo } from 'react';
import { useTranslation } from '@osce/i18n';
import type { ResultFile } from '@osce/esmini';
import { Card, StatusBadge, Button, ErrorPanel, EmptyState } from '../../ui';
import { useJobsViewStore } from '../stores/jobs-view-store';
import { useJobDetail } from '../hooks/useJobDetail';
import { useJobResults } from '../hooks/useJobResults';
import { useResultFileUrl } from '../lib/result-file-url';

/** Physical-unit symbols are locale-invariant — not routed through i18n. */
const METRIC_UNITS: Readonly<Record<string, string>> = {
  xy_rmse: 'm',
  endpoint_distance: 'm',
  speed_rmse: 'm/s',
  speed_end_delta: 'm/s',
  t_offset_rmse: 'm',
  s_end_delta: 'm',
  total_time: 's',
  total_distance: 'm',
  avg_speed: 'm/s',
  max_speed: 'm/s',
};

/** Fallback formatting for metric keys the backend adds that we don't know yet. */
function formatMetricKeyFallback(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Render a metric value of unknown wire type as a plain string. */
function formatMetricValue(val: unknown): string {
  if (typeof val === 'number') return val.toFixed(2);
  return String(val ?? '-');
}

/**
 * Wire metric key -> translated label. The typed i18n layer rejects dynamic
 * template-literal keys, so every known key is enumerated with a static
 * `t()` call; unknown metric keys fall back to `formatMetricKeyFallback`.
 */
function useMetricLabels(): Readonly<Record<string, string>> {
  const { t } = useTranslation('common');
  return useMemo(
    () => ({
      xy_rmse: t('gtSim.jobs.metrics.labels.xyRmse'),
      endpoint_distance: t('gtSim.jobs.metrics.labels.endpointDistance'),
      xy_correlation: t('gtSim.jobs.metrics.labels.xyCorrelation'),
      speed_rmse: t('gtSim.jobs.metrics.labels.speedRmse'),
      speed_end_delta: t('gtSim.jobs.metrics.labels.speedEndDelta'),
      acceleration_correlation: t('gtSim.jobs.metrics.labels.accelerationCorrelation'),
      t_offset_rmse: t('gtSim.jobs.metrics.labels.tOffsetRmse'),
      lane_id_match_ratio: t('gtSim.jobs.metrics.labels.laneIdMatchRatio'),
      s_end_delta: t('gtSim.jobs.metrics.labels.sEndDelta'),
      road_id_match_ratio: t('gtSim.jobs.metrics.labels.roadIdMatchRatio'),
      total_time: t('gtSim.jobs.metrics.labels.totalTime'),
      total_distance: t('gtSim.jobs.metrics.labels.totalDistance'),
      avg_speed: t('gtSim.jobs.metrics.labels.avgSpeed'),
      max_speed: t('gtSim.jobs.metrics.labels.maxSpeed'),
    }),
    [t],
  );
}

function ResultFileRow({ jobId, file }: { jobId: string; file: ResultFile }) {
  const { t } = useTranslation('common');
  const url = useResultFileUrl(jobId, file.name);
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <div className="flex items-center gap-2">
        <span className="bg-[var(--color-glass-1)] px-1.5 py-0.5 text-xs text-[var(--color-text-secondary)]">
          {file.type}
        </span>
        <span>{file.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[var(--color-text-secondary)]">
          {t('gtSim.jobs.files.sizeKb', { size: (file.size / 1024).toFixed(1) })}
        </span>
        {url && (
          <a
            href={url}
            download
            className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-bright)]"
          >
            {t('gtSim.jobs.files.download')}
          </a>
        )}
      </div>
    </div>
  );
}

export function JobDetailPanel() {
  const { t } = useTranslation('common');
  const metricLabels = useMetricLabels();
  const selectedJobId = useJobsViewStore((s) => s.selectedJobId);
  const { job, adapted, isLoading, error, refetch, cancel, isCancelling } =
    useJobDetail(selectedJobId);
  const { resultMeta, metrics } = useJobResults(selectedJobId, job?.status);

  if (!selectedJobId) {
    return (
      <div className="p-4">
        <EmptyState message={t('gtSim.jobs.detail.empty')} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <div className="h-6 w-40 animate-pulse bg-[var(--color-glass-1)]" />
        <div className="h-24 animate-pulse bg-[var(--color-glass-1)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorPanel error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4">
        <EmptyState message={t('gtSim.jobs.detail.notFound')} />
      </div>
    );
  }

  const summary =
    metrics && !('error' in metrics) ? (metrics.summary as Record<string, number> | undefined) : undefined;
  const finalState =
    metrics && !('error' in metrics)
      ? (metrics.final_state as Record<string, unknown> | undefined)
      : undefined;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-lg font-bold tracking-wide">
          {t('gtSim.jobs.detail.title', { jobId: job.job_id })}
        </h2>
        <StatusBadge status={job.status} bordered />

        {job.status === 'running' && adapted && adapted.progress > 0 && (
          <div className="ml-2 flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden bg-[var(--color-glass-1)]">
              <div
                className="h-full bg-[var(--color-accent)] transition-all duration-300"
                style={{ width: `${Math.min(100, adapted.progress * 100)}%` }}
              />
            </div>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {(adapted.progress * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      <Card title={t('gtSim.jobs.detail.detailsTitle')}>
        <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-[var(--color-text-secondary)]">{t('gtSim.jobs.detail.fields.project')}</dt>
          <dd>{job.project_id ?? t('gtSim.jobs.notAvailable')}</dd>
          <dt className="text-[var(--color-text-secondary)]">{t('gtSim.jobs.detail.fields.scenario')}</dt>
          <dd>{job.scenario_id}</dd>
          <dt className="text-[var(--color-text-secondary)]">{t('gtSim.jobs.detail.fields.controller')}</dt>
          <dd>{job.controller_type}</dd>
          <dt className="text-[var(--color-text-secondary)]">{t('gtSim.jobs.detail.fields.started')}</dt>
          <dd>{job.started_at ? new Date(job.started_at).toLocaleString() : t('gtSim.jobs.notAvailable')}</dd>
          <dt className="text-[var(--color-text-secondary)]">{t('gtSim.jobs.detail.fields.completed')}</dt>
          <dd>
            {job.completed_at ? new Date(job.completed_at).toLocaleString() : t('gtSim.jobs.notAvailable')}
          </dd>
          <dt className="text-[var(--color-text-secondary)]">{t('gtSim.jobs.detail.fields.exitCode')}</dt>
          <dd>{job.exit_code ?? t('gtSim.jobs.notAvailable')}</dd>
          <dt className="text-[var(--color-text-secondary)]">{t('gtSim.jobs.detail.fields.pid')}</dt>
          <dd>{job.pid ?? t('gtSim.jobs.notAvailable')}</dd>
        </dl>

        {job.error_message && (
          <div className="mt-3 max-h-48 overflow-auto border border-[var(--color-destructive)]/20 bg-[var(--color-destructive)]/10 p-3 font-mono text-sm whitespace-pre-wrap text-[var(--color-destructive)]">
            {job.error_message}
          </div>
        )}

        {job.status === 'running' && (
          <div className="mt-3">
            <Button variant="danger" size="sm" onClick={() => cancel()} disabled={isCancelling}>
              {isCancelling ? t('gtSim.jobs.detail.cancelling') : t('gtSim.jobs.detail.cancel')}
            </Button>
          </div>
        )}
      </Card>

      {/*
       * TODO(WP5, trunk): the fork embeds a live OSI panel (OsiLivePanel,
       * cluster E) and VirtualDriver telemetry (LiveVdPanel, cluster F) here
       * while job.status === 'running'. Neither is embedded by this cluster
       * (see the migration plan's cluster D task brief §3). Once clusters
       * E/F land, wire a "view live" affordance here that opens their
       * panel for `job.job_id`.
       */}

      {summary && (
        <Card title={t('gtSim.jobs.metrics.title')}>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(summary).map(([key, val]) => {
              const label = metricLabels[key] ?? formatMetricKeyFallback(key);
              const unit = METRIC_UNITS[key] ?? '';
              return (
                <div key={key} className="bg-[var(--color-glass-1)]/50 p-3">
                  <div className="mb-1 text-xs text-[var(--color-text-secondary)]">{label}</div>
                  <div className="font-mono text-lg">
                    {formatMetricValue(val)}
                    {unit && <span className="ml-1 text-xs text-[var(--color-text-secondary)]">{unit}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {finalState && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs text-[var(--color-text-secondary)]">
                {t('gtSim.jobs.metrics.finalState')}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(finalState).map(([key, val]) => {
                  const label = metricLabels[key] ?? formatMetricKeyFallback(key);
                  return (
                    <div key={key} className="text-sm">
                      <span className="text-[var(--color-text-secondary)]">{label}: </span>
                      <span className="font-mono">{formatMetricValue(val)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {resultMeta && resultMeta.files.length > 0 && (
        <Card title={t('gtSim.jobs.files.title')}>
          <div className="space-y-1">
            {resultMeta.files.map((file) => (
              <ResultFileRow key={file.name} jobId={job.job_id} file={file} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
