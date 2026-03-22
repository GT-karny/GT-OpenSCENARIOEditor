import { useTranslation } from '@osce/i18n';
import { Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { XoscSerializer, serializeCatalog } from '@osce/openscenario';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useSimulationStore } from '../../stores/simulation-store';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { useCatalogStore } from '../../stores/catalog-store';
import { useProjectStore } from '../../stores/project-store';
import { useWasmSimulation } from '../../hooks/use-wasm-simulation';
import * as api from '../../lib/project-api';

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

  console.warn(
    '[SimulationButtons] On-demand loading catalogs:',
    catalogFiles.map((f) => f.relativePath),
  );

  await Promise.allSettled(
    catalogFiles.map(async (f) => {
      try {
        const content = await api.readProjectFile(project.meta.id, f.relativePath);
        const doc = useCatalogStore.getState().loadCatalog(content, f.relativePath);
        console.warn(`[SimulationButtons] Loaded catalog "${doc.catalogName}"`);
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
  const { startSimulation, stopSimulation } = useWasmSimulation();

  const handleRun = async () => {
    try {
      const doc = storeApi.getState().document;
      const serializer = new XoscSerializer();
      const xml = serializer.serializeFormatted(doc);
      const xodrXml = useEditorStore.getState().roadNetworkXml;

      const hasCatalogLocations = Object.values(doc.catalogLocations).some(
        (loc) => loc?.directory,
      );

      // Collect catalogs from the store
      let catalogXmls = collectCatalogXmls();
      console.warn(
        '[SimulationButtons] Catalogs in store:',
        Object.keys(catalogXmls),
        'hasCatalogLocations:',
        hasCatalogLocations,
      );

      // On-demand fallback: if scenario needs catalogs but none are loaded,
      // try loading from the project before giving up
      if (hasCatalogLocations && Object.keys(catalogXmls).length === 0) {
        console.warn('[SimulationButtons] No catalogs loaded, attempting on-demand load...');
        await loadProjectCatalogs();
        catalogXmls = collectCatalogXmls();
        console.warn('[SimulationButtons] After on-demand load:', Object.keys(catalogXmls));
      }

      // Block simulation if catalogs are still missing
      if (hasCatalogLocations && Object.keys(catalogXmls).length === 0) {
        toast.error(
          'Scenario references catalogs but none could be loaded. Check project catalog files.',
        );
        return;
      }

      await startSimulation(xml, xodrXml ?? undefined, catalogXmls);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('labels.serializeFailed'),
      );
    }
  };

  const handleStop = async () => {
    await stopSimulation();
  };

  if (simStatus === 'running') {
    return (
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
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? 'icon' : 'sm'}
          className={compact ? 'h-8 w-8' : 'text-xs'}
          onClick={handleRun}
        >
          <Play className={compact ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 mr-1'} />
          {!compact && t('buttons.run')}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('buttons.run')}</TooltipContent>
    </Tooltip>
  );
}
