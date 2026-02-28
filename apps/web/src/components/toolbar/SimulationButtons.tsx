import { useTranslation } from '@osce/i18n';
import { Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { XoscSerializer } from '@osce/openscenario';
import { Button } from '../ui/button';
import { useServerConnectionContext } from '../../providers/ServerConnectionProvider';
import { useSimulationStore } from '../../stores/simulation-store';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';

export function SimulationButtons() {
  const { t } = useTranslation('common');
  const { startSimulation, stopSimulation, isConnected } = useServerConnectionContext();
  const simStatus = useSimulationStore((s) => s.status);
  const storeApi = useScenarioStoreApi();

  const handleRun = () => {
    try {
      const doc = storeApi.getState().document;
      const serializer = new XoscSerializer();
      const xml = serializer.serializeFormatted(doc);
      useSimulationStore.getState().reset();
      startSimulation(xml);
    } catch {
      toast.error(t('labels.serializeFailed'));
    }
  };

  const handleStop = () => {
    stopSimulation();
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
      disabled={!isConnected}
    >
      <Play className="h-3.5 w-3.5 mr-1" />
      {t('buttons.run')}
    </Button>
  );
}
