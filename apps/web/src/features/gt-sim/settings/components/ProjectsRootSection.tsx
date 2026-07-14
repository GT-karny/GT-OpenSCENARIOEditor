/**
 * Projects-root sync display (design judgment D4).
 *
 * Fires `useProjectsRootSync` (mount-time + editor-projectsRoot-change sync,
 * see that hook's header comment for the source-of-truth investigation) and
 * shows both sides: the editor's `projectsRoot` (from `useProjectStore`) and
 * GT_Sim's own `GET /api/config/projects-root` (`effective_dir` — what
 * GT_Sim actually resolves to, including its own default when unset).
 *
 * No folder picker here: changing the editor's projects root is owned by
 * `HomeScreen` (`components/home/HomeScreen.tsx`, outside this cluster's
 * scope) — this section only mirrors that value into GT_Sim and reports
 * sync status, with a manual "re-sync" retry for transient failures.
 */
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import { Card, Button } from '../../ui';
import { useGtSimApi } from '../../lib';
import { useProjectsRootSync } from '../hooks/use-projects-root-sync';

export function ProjectsRootSection() {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const sync = useProjectsRootSync();

  const gtSimRootQuery = useQuery({
    queryKey: ['config', 'projects-root'],
    queryFn: () => api!.getProjectsRoot(),
    enabled: api !== null,
  });

  return (
    <Card title={t('gtSim.settings.projectsRoot.title')}>
      <dl className="grid grid-cols-[70px_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-[var(--color-text-secondary)]">{t('gtSim.settings.projectsRoot.editorLabel')}</dt>
        <dd className="truncate font-mono text-xs" title={sync.editorProjectsRoot ?? undefined}>
          {sync.editorProjectsRoot ?? t('gtSim.settings.projectsRoot.notSet')}
        </dd>
        <dt className="text-[var(--color-text-secondary)]">{t('gtSim.settings.projectsRoot.gtSimLabel')}</dt>
        <dd
          className="truncate font-mono text-xs"
          title={gtSimRootQuery.data?.effective_dir ?? undefined}
        >
          {api === null
            ? t('gtSim.settings.connection.notAvailable')
            : (gtSimRootQuery.data?.effective_dir ?? t('gtSim.settings.projectsRoot.notSet'))}
          {gtSimRootQuery.data?.is_custom && (
            <span className="ml-1.5 inline-block rounded-none border border-[var(--color-glass-edge)] px-1 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              {t('gtSim.settings.projectsRoot.customBadge')}
            </span>
          )}
        </dd>
      </dl>

      <div className="mt-3 flex items-center justify-between gap-3">
        {api === null ? (
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {t('gtSim.settings.projectsRoot.disconnectedHint')}
          </p>
        ) : (
          <>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {sync.status === 'syncing' && t('gtSim.settings.projectsRoot.syncStatus.syncing')}
              {sync.status === 'synced' && t('gtSim.settings.projectsRoot.syncStatus.synced')}
              {sync.status === 'error' &&
                t('gtSim.settings.projectsRoot.syncStatus.error', {
                  message: sync.error instanceof Error ? sync.error.message : String(sync.error),
                })}
              {sync.status === 'idle' && t('gtSim.settings.projectsRoot.syncStatus.idle')}
            </p>
            <Button variant="ghost" size="sm" onClick={sync.resync} disabled={sync.status === 'syncing'}>
              {t('gtSim.settings.projectsRoot.resync')}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
