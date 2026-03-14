import { useTranslation } from '@osce/i18n';
import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useOpenDriveStore, useOpenDriveStoreApi } from '../../hooks/use-opendrive-store';
import { useEditorStore } from '../../stores/editor-store';

export function UndoRedoButtons() {
  const { t } = useTranslation('common');
  const editorMode = useEditorStore((s) => s.editorMode);
  const isRoadNetwork = editorMode === 'roadNetwork';

  const scenarioUndoAvailable = useScenarioStore((s) => s.undoAvailable);
  const scenarioRedoAvailable = useScenarioStore((s) => s.redoAvailable);
  const scenarioStoreApi = useScenarioStoreApi();

  const odrUndoAvailable = useOpenDriveStore((s) => s.undoAvailable);
  const odrRedoAvailable = useOpenDriveStore((s) => s.redoAvailable);
  const odrStoreApi = useOpenDriveStoreApi();

  const undoAvailable = isRoadNetwork ? odrUndoAvailable : scenarioUndoAvailable;
  const redoAvailable = isRoadNetwork ? odrRedoAvailable : scenarioRedoAvailable;

  const handleUndo = () => {
    if (isRoadNetwork) {
      odrStoreApi.getState().undo();
    } else {
      scenarioStoreApi.getState().undo();
    }
  };

  const handleRedo = () => {
    if (isRoadNetwork) {
      odrStoreApi.getState().redo();
    } else {
      scenarioStoreApi.getState().redo();
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={!undoAvailable}
            onClick={handleUndo}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('buttons.undo')} (Ctrl+Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={!redoAvailable}
            onClick={handleRedo}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('buttons.redo')} (Ctrl+Y)</TooltipContent>
      </Tooltip>
    </div>
  );
}
