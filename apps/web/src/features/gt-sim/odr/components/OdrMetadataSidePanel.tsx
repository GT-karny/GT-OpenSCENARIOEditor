/**
 * Registered `side`-slot wrapper around the fork-compatible `OdrMetadataPanel`.
 *
 * The fork drove `OdrMetadataPanel` from route params (`ProjectDetailPage` /
 * `VerificationAnnotatePage`); neither route is ported wholesale into this
 * execution mode. This wrapper instead gives the panel its own compact
 * project + scenario picker, following cluster F's `VdRunLauncher` pattern
 * (self-contained local state backed directly by `getProjects` /
 * `getProjectScenarios` — no dedicated view-state store needed here).
 *
 * `OdrMetadataPanel` itself is exported separately (see `../index.ts`) so
 * other clusters (e.g. cluster F's AnnotateView, which already knows
 * `projectId` / `scenarioFile` for the selected run) can embed it directly
 * without this picker.
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import { useGtSimApi } from '../../lib';
import { SelectInput } from '../../ui';
import { OdrMetadataPanel } from './OdrMetadataPanel';

export function OdrMetadataSidePanel() {
  const { t } = useTranslation('common');
  const api = useGtSimApi();

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api!.getProjects(),
    enabled: api !== null,
  });
  const [projectId, setProjectId] = useState('');
  const [scenarioFile, setScenarioFile] = useState('');

  const { data: scenarios } = useQuery({
    // Same key shape as run-form's / cluster F's scenario queries
    // (['scenarios', projectId]) so the identical getProjectScenarios data
    // shares one cache entry.
    queryKey: ['scenarios', projectId],
    queryFn: () => api!.getProjectScenarios(projectId),
    enabled: api !== null && !!projectId,
  });
  const scenarioList = useMemo(() => scenarios ?? [], [scenarios]);

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <SelectInput
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            setScenarioFile('');
          }}
          disabled={api === null}
          wrapperClassName="w-40"
        >
          <option value="" disabled>
            {t('gtSim.odr.sidePanel.projectPlaceholder')}
          </option>
          {(projects ?? []).map((p) => (
            <option key={p.project_id} value={p.project_id}>
              {p.name}
            </option>
          ))}
        </SelectInput>

        <SelectInput
          value={scenarioFile}
          onChange={(e) => setScenarioFile(e.target.value)}
          disabled={!projectId}
          wrapperClassName="w-48"
        >
          <option value="" disabled>
            {t('gtSim.odr.sidePanel.scenarioPlaceholder')}
          </option>
          {scenarioList.map((s) => (
            <option key={s.file} value={s.file}>
              {s.file}
            </option>
          ))}
        </SelectInput>
      </div>

      {projectId && scenarioFile ? (
        <OdrMetadataPanel projectId={projectId} scenarioFile={scenarioFile} defaultOpen />
      ) : (
        <div className="text-xs text-[var(--color-text-tertiary)]">{t('gtSim.odr.sidePanel.emptyPrompt')}</div>
      )}
    </div>
  );
}
