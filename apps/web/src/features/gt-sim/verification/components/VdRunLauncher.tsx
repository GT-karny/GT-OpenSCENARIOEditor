/**
 * Compact launcher for the VD verification panel's Replay tab "run a
 * scenario" mode: pick a project + scenario and start a VirtualDriver run
 * (OSI on) so it can be watched live and then replayed — all without leaving
 * the panel. Advanced options (parameters, presets, physics flags) stay on
 * cluster B's full run form.
 *
 * Ported from the fork's `components/verification/VdRunLauncher.tsx`,
 * retargeted at `useGtSimApi()` + `buildGtSimSimulationRequest` (from
 * `@osce/esmini`) instead of the fork's same-origin `api/client.ts` +
 * `api/simulationRequest.ts` (the latter is cluster B's — not ported here),
 * restyled with APEX tokens / `ui/` primitives.
 */
import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import { buildGtSimSimulationRequest } from '@osce/esmini';
import { useGtSimApi } from '../../lib';
import { Button, Checkbox, SelectInput } from '../../ui';

export function VdRunLauncher({
  onStarted,
}: {
  onStarted: (jobId: string, opts: { override: boolean; projectId: string; scenarioFile: string }) => void;
}) {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api!.getProjects(),
    enabled: api !== null,
  });
  const [projectId, setProjectId] = useState('');
  const [scenarioFile, setScenarioFile] = useState('');
  const [override, setOverride] = useState(false);

  const { data: scenarios } = useQuery({
    // Same key shape as run-form's scenario queries (['scenarios', projectId])
    // so the identical getProjectScenarios data shares one cache entry.
    queryKey: ['scenarios', projectId],
    queryFn: () => api!.getProjectScenarios(projectId),
    enabled: api !== null && !!projectId,
  });
  const scenarioList = useMemo(() => scenarios ?? [], [scenarios]);

  const start = useMutation({
    mutationFn: () => {
      const req = buildGtSimSimulationRequest({
        scenarioId: scenarioFile,
        projectId,
        controllerType: 'virtual_driver',
        execution: { osi: { enabled: true } }, // required for the full scene
      });
      return api!.createSimulation(req);
    },
    onSuccess: (job) => onStarted(job.job_id, { override, projectId, scenarioFile }),
  });

  const canRun = api !== null && !!projectId && !!scenarioFile && !start.isPending;

  return (
    <div className="flex items-center gap-2 flex-wrap text-sm">
      <SelectInput
        value={projectId}
        onChange={(e) => {
          setProjectId(e.target.value);
          setScenarioFile('');
        }}
        wrapperClassName="w-40"
      >
        <option value="" disabled>
          {t('gtSim.vd.launcher.projectPlaceholder')}
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
          {t('gtSim.vd.launcher.scenarioPlaceholder')}
        </option>
        {scenarioList.map((s) => (
          <option key={s.file} value={s.file}>
            {s.file}
          </option>
        ))}
      </SelectInput>

      <Checkbox
        label={t('gtSim.vd.launcher.manualOverride')}
        checked={override}
        onChange={(e) => setOverride(e.target.checked)}
      />

      <Button size="sm" onClick={() => start.mutate()} disabled={!canRun}>
        {start.isPending ? t('gtSim.vd.launcher.starting') : t('gtSim.vd.launcher.runAndWatch')}
      </Button>

      {start.error != null && (
        <span className="text-xs text-[var(--color-destructive)]">
          {/^.*409.*$/.test(String(start.error))
            ? t('gtSim.vd.launcher.alreadyRunning')
            : String(start.error as Error)}
        </span>
      )}
    </div>
  );
}
