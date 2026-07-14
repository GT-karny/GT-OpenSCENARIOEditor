import { useTranslation } from '@osce/i18n';
import { Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { XoscSerializer, serializeCatalog } from '@osce/openscenario';
import { Button } from '../../../../components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../components/ui/tooltip';
import { useSimulationStore } from '../../stores/simulation-store';
import { useScenarioStoreApi } from '../../../../stores/use-scenario-store';
import { useCatalogStore } from '../../../../stores/catalog-store';
import { useProjectStore } from '../../../../stores/project-store';
import { useDocumentRegistry } from '../../../../stores/document-registry';
import { useWasmSimulation } from '../../hooks/use-wasm-simulation';
import { getSimulationXodr } from '../../lib/simulation-xodr';
import * as api from '../../../../lib/project-api';
import { useExecutionTargetStore, useGtSimSimulation } from '../../../gt-sim/target';
import { useGtSimConnectionStore } from '../../../gt-sim/stores/gt-sim-connection-store';
import { useRunFormStore } from '../../../gt-sim/run-form/store';
import { useMainPanelStore, LIVE_MONITOR_PANEL_ID } from '../../../gt-sim/stores/main-panel-store';
import { useLiveViewStore } from '../../../gt-sim/live/stores/live-view-store';
import { TargetSwitcher } from '../../../gt-sim/target/TargetSwitcher';

/** Collect catalog XMLs from the catalog store */
function collectCatalogXmls(): Record<string, string> {
  const catalogState = useCatalogStore.getState();
  const catalogXmls: Record<string, string> = {};
  for (const [name] of catalogState.catalogs) {
    const raw = catalogState.rawXmls.get(name);
    if (raw) {
      catalogXmls[name] = raw;
    } else {
      const doc = catalogState.catalogs.get(name);
      if (doc) catalogXmls[name] = serializeCatalog(doc);
    }
  }
  return catalogXmls;
}

/** Load catalogs from the project's catalogs/ directory on-demand */
async function loadProjectCatalogs(): Promise<void> {
  const project = useProjectStore.getState().currentProject;
  if (!project) return;

  const catalogFiles = project.files.filter((f) => {
    if (f.type !== 'xosc') return false;
    const lower = f.relativePath.toLowerCase();
    return lower.startsWith('catalogs/') || lower.includes('/catalogs/');
  });

  if (catalogFiles.length === 0) {
    console.warn('[SimulationButtons] No catalog files found in project');
    return;
  }

  await Promise.allSettled(
    catalogFiles.map(async (f) => {
      try {
        const content = await api.readProjectFile(project.meta.id, f.relativePath);
        useCatalogStore.getState().loadCatalog(content, f.relativePath);
      } catch (err) {
        console.error(`[SimulationButtons] Failed to load ${f.relativePath}:`, err);
      }
    }),
  );
}

export function SimulationButtons({ compact }: { compact?: boolean }) {
  const { t } = useTranslation('common');
  const simStatus = useSimulationStore((s) => s.status);
  const storeApi = useScenarioStoreApi();
  const { startSimulation: startWasm, stopSimulation: stopWasm } = useWasmSimulation();
  const { startSimulation: startGtSim, stopSimulation: stopGtSim, getJobId } = useGtSimSimulation();
  const setWatchedJobId = useLiveViewStore((s) => s.setWatchedJobId);
  const setActiveMainPanelId = useMainPanelStore((s) => s.setActivePanelId);

  const target = useExecutionTargetStore((s) => s.target);
  const nativeWindow = useExecutionTargetStore((s) => s.nativeWindow);
  const runningTarget = useExecutionTargetStore((s) => s.runningTarget);
  const gtSimReady = useGtSimConnectionStore((s) => s.state === 'ready');
  const runFormProjectId = useRunFormStore((s) => s.selectedProjectId);
  const runFormScenarioFile = useRunFormStore((s) => s.selectedScenarioFile);

  const handleRunWasm = async () => {
    try {
      const doc = storeApi.getState().document;
      const serializer = new XoscSerializer();
      const xml = serializer.serializeFormatted(doc);
      const { xml: xodrXml } = getSimulationXodr();

      const hasCatalogLocations = Object.values(doc.catalogLocations).some(
        (loc) => loc?.directory,
      );

      // Collect catalogs from the store
      let catalogXmls = collectCatalogXmls();

      // On-demand fallback: if scenario needs catalogs but none are loaded,
      // try loading from the project before giving up
      if (hasCatalogLocations && Object.keys(catalogXmls).length === 0) {
        console.warn('[SimulationButtons] No catalogs loaded, attempting on-demand load...');
        await loadProjectCatalogs();
        catalogXmls = collectCatalogXmls();
      }

      // Block simulation if catalogs are still missing
      if (hasCatalogLocations && Object.keys(catalogXmls).length === 0) {
        toast.error(t('simulation.missingCatalogs'));
        return;
      }

      // Stamp the backend this run is actually started on (Stop routes
      // through it — see handleStop below).
      useExecutionTargetStore.getState().setRunningTarget('wasm');
      // Runtime/load failures are surfaced via the WASM service onError funnel
      // (see useWasmSimulation). This catch only covers pre-flight serialization.
      await startWasm(xml, xodrXml, catalogXmls);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('labels.serializeFailed'),
      );
    }
  };

  // GT_Sim executes a named project scenario file (not the in-editor XML —
  // see use-gtsim-simulation.ts), so this reuses the run-form's (cluster B)
  // project/scenario selection rather than serializing the live document.
  // Auto-linking the toolbar's currently-open document to a GT_Sim project id
  // is out of scope for WP5 (no reliable id mapping between the editor's
  // project store and GT_Sim's own project registry) — see final report.
  const handleRunGtSim = async () => {
    if (!gtSimReady) {
      toast.error(t('gtSim.target.runtime.notConnected'));
      return;
    }
    if (!runFormProjectId || !runFormScenarioFile) {
      toast.error(t('gtSim.target.runtime.noScenarioSelected'));
      return;
    }
    if (useDocumentRegistry.getState().isDirty('scenario')) {
      toast.warning(t('gtSim.target.runtime.unsavedWarning'));
    }
    useExecutionTargetStore.getState().setRunningTarget('gt-sim');
    await startGtSim(
      { projectId: runFormProjectId, scenarioId: runFormScenarioFile },
      { headless: !nativeWindow },
    );
    // Best-effort: preselect the new job in the live monitor so switching to
    // execution mode immediately shows this run (job list / run-form panel
    // wire the same pair — see JobListPanel.tsx / SimulationRunForm.tsx).
    const jobId = getJobId();
    if (jobId) {
      setWatchedJobId(jobId);
      setActiveMainPanelId(LIVE_MONITOR_PANEL_ID);
    }
  };

  const handleRun = target === 'gt-sim' ? handleRunGtSim : handleRunWasm;
  // Stop must address the backend the run was actually started on, NOT the
  // current selection: `runningTarget` is stamped at start (review finding —
  // routing Stop through `target` alone would no-op if the selection ever
  // changed mid-run). The TargetSwitcher is also disabled while running
  // (first line of defense); `?? target` covers a pre-first-run Stop, which
  // is a no-op on either service.
  const handleStop = (runningTarget ?? target) === 'gt-sim' ? stopGtSim : stopWasm;
  const runDisabled = target === 'gt-sim' && (!gtSimReady || !runFormProjectId || !runFormScenarioFile);

  if (simStatus === 'running') {
    return (
      <div className="flex items-center gap-1">
        <TargetSwitcher compact={compact} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={compact ? 'icon' : 'sm'}
              className={
                compact
                  ? 'h-8 w-8 text-[var(--color-destructive)] hover:text-[var(--color-destructive)]'
                  : 'text-xs text-[var(--color-destructive)] hover:text-[var(--color-destructive)]'
              }
              onClick={handleStop}
            >
              <Square className={compact ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 mr-1'} />
              {!compact && t('buttons.stop')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('buttons.stop')}</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <TargetSwitcher compact={compact} />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={compact ? 'icon' : 'sm'}
            className={compact ? 'h-8 w-8' : 'text-xs'}
            onClick={handleRun}
            disabled={runDisabled}
          >
            <Play className={compact ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 mr-1'} />
            {!compact && t('buttons.run')}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {runDisabled ? t('gtSim.target.runtime.runDisabledTooltip') : t('buttons.run')}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
