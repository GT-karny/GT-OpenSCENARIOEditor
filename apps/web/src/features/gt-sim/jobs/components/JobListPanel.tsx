/**
 * Job list panel — bottom dock slot (order 10). Ports the fork's
 * `pages/SimulationsPage.tsx`.
 *
 * react-router (`useNavigate` to `/simulations/{id}`) is replaced by
 * `jobs-view-store.selectJob`, per the migration plan's D6 decision (no
 * router in the execution mode) — a row click opens the detail side panel
 * (`JobDetailPanel`) instead of navigating to a route.
 *
 * "View Live" (WP5, trunk wiring): a running row's action button sets
 * `live-view-store.watchedJobId` and switches `ExecutionLayout`'s `main`
 * slot to the Live Monitor tab (`main-panel-store`) — see
 * `JobDetailPanel.tsx` for the same action on the detail side panel.
 */
import { useTranslation } from '@osce/i18n';
import { Radio } from 'lucide-react';
import type { GtSimSimulationStatus } from '@osce/esmini';
import {
  StatusBadge,
  TableShell,
  TableSkeleton,
  EmptyState,
  ErrorPanel,
  Button,
  type TableColumn,
} from '../../ui';
import { useLiveViewStore } from '../../live/stores/live-view-store';
import { useMainPanelStore, LIVE_MONITOR_PANEL_ID } from '../../stores/main-panel-store';
import { useJobsList, JOBS_PAGE_SIZE } from '../hooks/useJobsList';
import { useJobsViewStore, type JobStatusFilter } from '../stores/jobs-view-store';

const STATUS_FILTERS: readonly JobStatusFilter[] = ['', 'running', 'completed', 'failed'];

export function JobListPanel() {
  const { t } = useTranslation('common');
  const statusFilter = useJobsViewStore((s) => s.statusFilter);
  const page = useJobsViewStore((s) => s.page);
  const setStatusFilter = useJobsViewStore((s) => s.setStatusFilter);
  const setPage = useJobsViewStore((s) => s.setPage);
  const selectJob = useJobsViewStore((s) => s.selectJob);
  const setWatchedJobId = useLiveViewStore((s) => s.setWatchedJobId);
  const setActiveMainPanelId = useMainPanelStore((s) => s.setActivePanelId);

  const { jobs, total, totalPages, projectNames, isLoading, error, refetch } = useJobsList();

  const viewLive = (jobId: string) => {
    setWatchedJobId(jobId);
    setActiveMainPanelId(LIVE_MONITOR_PANEL_ID);
  };

  const columns: TableColumn[] = [
    { key: 'id', label: t('gtSim.jobs.list.columns.jobId') },
    { key: 'project', label: t('gtSim.jobs.list.columns.project') },
    { key: 'scenario', label: t('gtSim.jobs.list.columns.scenario') },
    { key: 'controller', label: t('gtSim.jobs.list.columns.controller') },
    { key: 'status', label: t('gtSim.jobs.list.columns.status') },
    { key: 'started', label: t('gtSim.jobs.list.columns.started') },
    { key: 'actions', label: '' },
  ];

  const filterLabel = (filter: JobStatusFilter): string =>
    filter === '' ? t('gtSim.jobs.list.filters.all') : t(`gtSim.jobs.list.filters.${filter}`);

  const emptyMessage = statusFilter
    ? t(`gtSim.jobs.list.empty.${statusFilter}`)
    : t('gtSim.jobs.list.empty.all');

  return (
    <div className="flex max-h-80 flex-col gap-3 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-sm font-bold tracking-wide text-[var(--color-text-primary)]">
          {t('gtSim.jobs.list.title')}
        </h2>
        <div className="flex gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter || 'all'}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={
                statusFilter === filter
                  ? 'cursor-pointer rounded-none bg-[var(--color-accent-vivid)]/80 px-3 py-1 text-xs font-medium text-[var(--color-bg-void)] glow-edge'
                  : 'cursor-pointer rounded-none bg-[var(--color-glass-1)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-glass-hover)] hover:text-[var(--color-text-primary)]'
              }
            >
              {filterLabel(filter)}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <TableSkeleton columns={7} rows={4} />}

      {!isLoading && error && <ErrorPanel error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && jobs.length === 0 && (
        <EmptyState
          message={emptyMessage}
          action={
            statusFilter ? (
              <Button variant="ghost" size="sm" onClick={() => setStatusFilter('')}>
                {t('gtSim.jobs.list.showAll')}
              </Button>
            ) : undefined
          }
        />
      )}

      {!isLoading && !error && jobs.length > 0 && (
        <>
          <TableShell columns={columns}>
            {jobs.map((job: GtSimSimulationStatus) => (
              <tr
                key={job.job_id}
                onClick={() => selectJob(job.job_id)}
                className="cursor-pointer border-b border-[var(--color-glass-edge)]/50 hover:bg-[var(--color-glass-hover)]/30"
              >
                <td className="px-4 py-3 font-mono text-[var(--color-accent)]">{job.job_id}</td>
                <td className="px-4 py-3">
                  {job.project_id
                    ? (projectNames.get(job.project_id) ?? job.project_id)
                    : t('gtSim.jobs.notAvailable')}
                </td>
                <td className="px-4 py-3">{job.scenario_id}</td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                  {job.controller_type}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                  {job.started_at
                    ? new Date(job.started_at).toLocaleTimeString()
                    : t('gtSim.jobs.notAvailable')}
                </td>
                <td className="px-4 py-3 text-right">
                  {job.status === 'running' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewLive(job.job_id);
                      }}
                    >
                      <Radio className="h-3 w-3" />
                      {t('gtSim.target.jobs.viewLive')}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </TableShell>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                {t('gtSim.jobs.list.pagination.range', {
                  from: page * JOBS_PAGE_SIZE + 1,
                  to: Math.min((page + 1) * JOBS_PAGE_SIZE, total),
                  total,
                })}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  {t('gtSim.jobs.list.pagination.prev')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  {t('gtSim.jobs.list.pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
