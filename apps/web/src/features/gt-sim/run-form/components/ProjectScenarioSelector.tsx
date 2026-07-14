/**
 * Compact project + scenario picker for the run-form panel.
 *
 * The fork drove project/scenario context from `ProjectsPage`/`ProjectDetailPage`
 * (react-router routes) — neither is ported (migration plan WP4 clusterB row:
 * "ProjectsPage/ProjectDetailPageは移植しない"). Instead, this mirrors the
 * fork's `VdRunLauncher` pattern: a self-contained selector backed directly by
 * `getProjects` / `getProjectScenarios`, storing the selection in this
 * cluster's own view-state store (`../store`).
 *
 * Auto-linking to the editor's currently open project (design note D4) is out
 * of scope for this lane (WP5/H' territory) — selection here is manual.
 */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import { useGtSimApi } from '../../lib';
import { SelectInput } from '../../ui';
import { useRunFormStore } from '../store';

export function ProjectScenarioSelector() {
  const { t } = useTranslation('common');
  const api = useGtSimApi();

  const selectedProjectId = useRunFormStore((s) => s.selectedProjectId);
  const selectedScenarioFile = useRunFormStore((s) => s.selectedScenarioFile);
  const setSelectedProject = useRunFormStore((s) => s.setSelectedProject);
  const setSelectedScenario = useRunFormStore((s) => s.setSelectedScenario);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => api!.getProjects(),
    enabled: api !== null,
  });

  const scenariosQuery = useQuery({
    queryKey: ['scenarios', selectedProjectId],
    queryFn: () => api!.getProjectScenarios(selectedProjectId!),
    enabled: api !== null && selectedProjectId !== null,
  });

  const projects = projectsQuery.data ?? [];
  const scenarios = scenariosQuery.data ?? [];

  // Default to the first project once the list loads (quality-of-life; the
  // user can still switch). Never overrides an explicit user selection.
  useEffect(() => {
    if (selectedProjectId === null && projects.length > 0) {
      setSelectedProject(projects[0].project_id);
    }
    // Only react to the project list arriving, not to selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  return (
    <div className="grid grid-cols-1 gap-2">
      <SelectInput
        label={t('gtSim.runForm.projectSelector.projectLabel')}
        value={selectedProjectId ?? ''}
        onChange={(e) => setSelectedProject(e.target.value || null)}
        disabled={api === null || projects.length === 0}
      >
        <option value="" disabled>
          {t('gtSim.runForm.projectSelector.selectProject')}
        </option>
        {projects.map((p) => (
          <option key={p.project_id} value={p.project_id}>
            {p.name}
          </option>
        ))}
      </SelectInput>

      <SelectInput
        label={t('gtSim.runForm.projectSelector.scenarioLabel')}
        value={selectedScenarioFile ?? ''}
        onChange={(e) => setSelectedScenario(e.target.value || null)}
        disabled={selectedProjectId === null || scenarios.length === 0}
      >
        <option value="" disabled>
          {scenarios.length === 0
            ? t('gtSim.runForm.projectSelector.noScenarios')
            : t('gtSim.runForm.projectSelector.selectScenario')}
        </option>
        {scenarios.map((s) => (
          <option key={s.file} value={s.file}>
            {s.filename}
          </option>
        ))}
      </SelectInput>
    </div>
  );
}
