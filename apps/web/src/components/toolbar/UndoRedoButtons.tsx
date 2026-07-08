import { useTranslation } from '@osce/i18n';
import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useOpenDriveStore, useOpenDriveStoreApi } from '../../hooks/use-opendrive-store';
import { useCatalogStore } from '../../stores/catalog-store';
import { useDistributionStore } from '../../stores/distribution-store';
import { getFocusedDocumentKind, useDocumentRegistry } from '../../stores/document-registry';

export function UndoRedoButtons() {
  const { t } = useTranslation('common');

  // Undo/redo target the focused document: the active editor surface
  // (focusedBase), overridden by an open catalog/distribution modal
  // (focusedOverride) — same routing as the keyboard/menu shortcuts.
  const focusedBase = useDocumentRegistry((s) => s.focusedBase);
  const focusedOverride = useDocumentRegistry((s) => s.focusedOverride);
  const focused = focusedOverride ?? focusedBase;

  const scenarioUndoAvailable = useScenarioStore((s) => s.undoAvailable);
  const scenarioRedoAvailable = useScenarioStore((s) => s.redoAvailable);
  const scenarioStoreApi = useScenarioStoreApi();

  const odrUndoAvailable = useOpenDriveStore((s) => s.undoAvailable);
  const odrRedoAvailable = useOpenDriveStore((s) => s.redoAvailable);
  const odrStoreApi = useOpenDriveStoreApi();

  // Catalog/distribution keep no stored availability flags, so derive them from
  // their command history. Every edit and undo/redo on those stores runs through
  // set(), so these boolean selectors re-render exactly when availability flips.
  const catalogUndoAvailable = useCatalogStore((s) => s.getCommandHistory().canUndo());
  const catalogRedoAvailable = useCatalogStore((s) => s.getCommandHistory().canRedo());
  const distributionUndoAvailable = useDistributionStore((s) => s.getCommandHistory().canUndo());
  const distributionRedoAvailable = useDistributionStore((s) => s.getCommandHistory().canRedo());

  let undoAvailable: boolean;
  let redoAvailable: boolean;
  switch (focused) {
    case 'roadNetwork':
      undoAvailable = odrUndoAvailable;
      redoAvailable = odrRedoAvailable;
      break;
    case 'catalog':
      undoAvailable = catalogUndoAvailable;
      redoAvailable = catalogRedoAvailable;
      break;
    case 'distribution':
      undoAvailable = distributionUndoAvailable;
      redoAvailable = distributionRedoAvailable;
      break;
    default:
      undoAvailable = scenarioUndoAvailable;
      redoAvailable = scenarioRedoAvailable;
  }

  const handleUndo = () => {
    switch (getFocusedDocumentKind()) {
      case 'catalog':
        useCatalogStore.getState().undoCatalog();
        break;
      case 'roadNetwork':
        odrStoreApi.getState().undo();
        break;
      case 'distribution':
        useDistributionStore.getState().undoDistribution();
        break;
      default:
        scenarioStoreApi.getState().undo();
    }
  };

  const handleRedo = () => {
    switch (getFocusedDocumentKind()) {
      case 'catalog':
        useCatalogStore.getState().redoCatalog();
        break;
      case 'roadNetwork':
        odrStoreApi.getState().redo();
        break;
      case 'distribution':
        useDistributionStore.getState().redoDistribution();
        break;
      default:
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
