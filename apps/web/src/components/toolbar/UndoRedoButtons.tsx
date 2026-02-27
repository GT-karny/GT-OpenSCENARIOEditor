import { useTranslation } from '@osce/i18n';
import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';

export function UndoRedoButtons() {
  const { t } = useTranslation('common');
  const undoAvailable = useScenarioStore((s) => s.undoAvailable);
  const redoAvailable = useScenarioStore((s) => s.redoAvailable);
  const storeApi = useScenarioStoreApi();

  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={!undoAvailable}
            onClick={() => storeApi.getState().undo()}
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
            onClick={() => storeApi.getState().redo()}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('buttons.redo')} (Ctrl+Y)</TooltipContent>
      </Tooltip>
    </div>
  );
}
