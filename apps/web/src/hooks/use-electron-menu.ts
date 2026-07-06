import { useEffect } from 'react';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';
import { useProjectStore } from '../stores/project-store';
import { useCatalogStore } from '../stores/catalog-store';
import { useDistributionStore } from '../stores/distribution-store';
import { getFocusedDocumentKind } from '../stores/document-registry';
import { useFileOperations } from './use-file-operations';
import { getOpenDriveStoreApi } from './use-opendrive-store';
import { kindFromFileName } from '../lib/recent-files/recent-list';

/**
 * Listens for menu actions dispatched from the Electron native menu.
 * No-op when running in a regular browser.
 */
export function useElectronMenu() {
  const {
    newScenario,
    openXosc,
    saveXosc,
    saveAsXosc,
    saveXodr,
    saveAsXodr,
    loadXoscFromRead,
    loadXodrFromRead,
  } = useFileOperations();
  const storeApi = useScenarioStoreApi();

  useEffect(() => {
    if (!window.electronAPI?.isElectron) return;

    const cleanup = window.electronAPI.onMenuAction((action) => {
      const isRoadNetwork = useEditorStore.getState().editorMode === 'roadNetwork';

      // Open a specific recent file by absolute path (carried in the action).
      if (action.startsWith('open-recent:')) {
        const filePath = action.slice('open-recent:'.length);
        const name = filePath.split(/[/\\]/).pop() ?? filePath;
        const kind = kindFromFileName(name);
        if (!kind) return;
        void (async () => {
          const text = await window.electronAPI!.readFile(filePath);
          const read = { text, name, filePath };
          const ok = kind === 'xosc' ? await loadXoscFromRead(read) : await loadXodrFromRead(read);
          if (ok) {
            useEditorStore.getState().setEditorMode(kind === 'xodr' ? 'roadNetwork' : 'scenario');
            if (useProjectStore.getState().currentView !== 'editor') {
              useProjectStore.getState().setView('editor');
            }
          }
        })();
        return;
      }

      switch (action) {
        case 'new':
          newScenario();
          break;
        case 'open':
          openXosc();
          break;
        case 'clear-recent':
          window.electronAPI?.clearRecentFiles();
          break;
        case 'save':
          if (isRoadNetwork) {
            saveXodr();
          } else {
            saveXosc();
          }
          break;
        case 'saveAs':
          if (isRoadNetwork) {
            saveAsXodr();
          } else {
            saveAsXosc();
          }
          break;
        case 'undo':
          // Route to the focused document (catalog modal / distribution override).
          switch (getFocusedDocumentKind()) {
            case 'catalog':
              useCatalogStore.getState().undoCatalog();
              break;
            case 'roadNetwork':
              getOpenDriveStoreApi().getState().undo();
              break;
            case 'distribution':
              useDistributionStore.getState().undoDistribution();
              break;
            default:
              storeApi.getState().undo();
          }
          break;
        case 'redo':
          switch (getFocusedDocumentKind()) {
            case 'catalog':
              useCatalogStore.getState().redoCatalog();
              break;
            case 'roadNetwork':
              getOpenDriveStoreApi().getState().redo();
              break;
            case 'distribution':
              useDistributionStore.getState().redoDistribution();
              break;
            default:
              storeApi.getState().redo();
          }
          break;
      }
    });

    return cleanup;
  }, [
    newScenario,
    openXosc,
    saveXosc,
    saveAsXosc,
    saveXodr,
    saveAsXodr,
    loadXoscFromRead,
    loadXodrFromRead,
    storeApi,
  ]);
}
