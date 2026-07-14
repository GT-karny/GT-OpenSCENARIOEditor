/**
 * Cluster B — the run-form panel registered into the `side` slot.
 *
 * Fuses what the fork spread across `ProjectDetailPage` (project/scenario
 * selection) + `ParameterPanel` (params/presets column) + `ExecutionPanel`
 * (compact `SimulationRunForm` + `InlineSimulationStatus` + `CopyApiRequest`)
 * into one scrollable column, since the unified UI only has a single `side`
 * slot to place cluster B's UI into (migration instruction #4 explicitly
 * allows folding `ExecutionPanel` into the run-form panel).
 *
 * `activeJobId`/`latestJobId` — replacing the fork's react-router-driven job
 * navigation — live in this cluster's own `useRunFormStore` (D6).
 */
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import type { GtSimSimulationRequest } from '@osce/esmini';
import { useGtSimApi } from '../lib';
import { EmptyState } from '../ui';
import { useRunFormStore } from './store';
import { ProjectScenarioSelector } from './components/ProjectScenarioSelector';
import { ParameterPanel } from './components/ParameterPanel';
import { SimulationRunForm } from './components/SimulationRunForm';
import { InlineSimulationStatus } from './components/InlineSimulationStatus';
import { CopyApiRequest } from './components/CopyApiRequest';

export function RunFormPanel() {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const queryClient = useQueryClient();

  const selectedProjectId = useRunFormStore((s) => s.selectedProjectId);
  const selectedScenarioFile = useRunFormStore((s) => s.selectedScenarioFile);
  const latestJobId = useRunFormStore((s) => s.latestJobId);
  const activeJobId = useRunFormStore((s) => s.activeJobId);
  const setLatestJobId = useRunFormStore((s) => s.setLatestJobId);
  const setActiveJobId = useRunFormStore((s) => s.setActiveJobId);

  const [paramOverrides, setParamOverrides] = useState<Record<string, string>>({});
  const [requestBuilder, setRequestBuilder] = useState<(() => GtSimSimulationRequest) | null>(
    null,
  );

  const scenariosQuery = useQuery({
    queryKey: ['scenarios', selectedProjectId],
    queryFn: () => api!.getProjectScenarios(selectedProjectId!),
    enabled: api !== null && selectedProjectId !== null,
  });
  const scenario =
    scenariosQuery.data?.find((s) => s.file === selectedScenarioFile) ?? null;

  // Track the active job's status so it can be cleared once the job reaches a
  // terminal state (queued/running -> Run/Stop button enablement).
  const activeJobQuery = useQuery({
    queryKey: ['job', activeJobId],
    queryFn: () => api!.getSimulation(activeJobId!),
    enabled: api !== null && activeJobId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'running' || status === 'queued' ? 1000 : false;
    },
  });
  useEffect(() => {
    const status = activeJobQuery.data?.status;
    if (status && status !== 'running' && status !== 'queued') {
      setActiveJobId(null);
    }
  }, [activeJobQuery.data?.status, setActiveJobId]);

  const cancelMut = useMutation({
    mutationFn: () => {
      if (!api || !activeJobId) throw new Error('No active job to cancel');
      return api.cancelSimulation(activeJobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', activeJobId] });
      setActiveJobId(null);
    },
    onError: (error: Error) => {
      toast.error(t('gtSim.runForm.submit.cancelError', { message: error.message }));
    },
  });

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col gap-3 p-3">
        <ProjectScenarioSelector />
        <EmptyState message={t('gtSim.runForm.projectSelector.selectProject')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <ProjectScenarioSelector />

      {!scenario ? (
        <EmptyState message={t('gtSim.runForm.parameters.selectScenario')} />
      ) : (
        <>
          <ParameterPanel
            projectId={selectedProjectId}
            scenario={scenario}
            paramOverrides={paramOverrides}
            onParamOverridesChange={setParamOverrides}
          />

          <div className="border-b border-[var(--color-glass-edge)]" />

          <SimulationRunForm
            projectId={selectedProjectId}
            scenarioFile={scenario.file}
            paramOverrides={paramOverrides}
            isRunning={activeJobId !== null}
            onStop={() => cancelMut.mutate()}
            onSubmitted={(job) => {
              setLatestJobId(job.job_id);
              setActiveJobId(job.job_id);
            }}
            onRequestBuilder={setRequestBuilder}
          />

          {latestJobId && (
            <div className="mt-1">
              <InlineSimulationStatus jobId={latestJobId} />
            </div>
          )}

          <div className="pt-3 border-t border-[var(--color-glass-edge)]">
            <CopyApiRequest
              getRequest={() => requestBuilder?.() ?? null}
              scenarioParams={scenario.params ?? []}
              paramSource={paramOverrides}
            />
          </div>
        </>
      )}
    </div>
  );
}
