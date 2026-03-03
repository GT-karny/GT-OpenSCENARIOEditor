import { useTranslation } from '@osce/i18n';
import { Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { XoscSerializer, serializeCatalog } from '@osce/openscenario';
import { Button } from '../ui/button';
import { useSimulationStore } from '../../stores/simulation-store';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { useCatalogStore } from '../../stores/catalog-store';
import { useWasmSimulation } from '../../hooks/use-wasm-simulation';

export function SimulationButtons() {
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

      // Serialize loaded catalogs
      const catalogMap = useCatalogStore.getState().catalogs;
      const catalogXmls: Record<string, string> = {};
      for (const [name, catDoc] of catalogMap) {
        catalogXmls[name] = serializeCatalog(catDoc);
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
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-[var(--color-destructive)] hover:text-[var(--color-destructive)]"
        onClick={handleStop}
      >
        <Square className="h-3.5 w-3.5 mr-1" />
        {t('buttons.stop')}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs"
      onClick={handleRun}
    >
      <Play className="h-3.5 w-3.5 mr-1" />
      {t('buttons.run')}
    </Button>
  );
}
