import { useEffect } from 'react';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useProjectStore } from '../stores/project-store';
import { useCatalogStore } from '../stores/catalog-store';
import { useDistributionStore } from '../stores/distribution-store';
import { getFocusedDocumentKind, useDocumentRegistry } from '../stores/document-registry';
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
      const focusedBase = useDocumentRegistry.getState().focusedBase;
      const isRoadNetwork = focusedBase === 'roadNetwork';
      // Execution mode owns no document: document menu actions are ignored so
      // they can never mutate a background scenario/road document. (Disabling
      // the native items needs a main-process change — deferred; no-op here.)
      const isExecution = focusedBase === 'execution';

      // Open a specific recent file by absolute path (carried in the action).
      if (action.startsWith('open-recent:')) {
        if (isExecution) return;
        const filePath = action.slice('open-recent:'.length);
        const name = filePath.split(/[/\\]/).pop() ?? filePath;
        const kind = kindFromFileName(name);
        if (!kind) return;
        void (async () => {
          const text = await window.electronAPI!.readFile(filePath);
          const read = { text, name, filePath };
          const ok = kind === 'xosc' ? await loadXoscFromRead(read) : await loadXodrFromRead(read);
          if (ok) {
            // Bare focus switch (no lifecycle cascade); the load already primed the
            // matching document. The cascade lives in switchEditorMode (use-app-lifecycle).
            useDocumentRegistry.getState().setFocusedBase(kind === 'xodr' ? 'roadNetwork' : 'scenario');
            if (useProjectStore.getState().currentView !== 'editor') {
              useProjectStore.getState().setView('editor');
            }
          }
        })();
        return;
      }

      switch (action) {
        case 'new':
          if (isExecution) break;
          newScenario();
          break;
        case 'open':
          if (isExecution) break;
          openXosc();
          break;
        case 'clear-recent':
          window.electronAPI?.clearRecentFiles();
          break;
        case 'save':
          if (isExecution) break;
          if (isRoadNetwork) {
            saveXodr();
          } else {
            saveXosc();
          }
          break;
        case 'saveAs':
          if (isExecution) break;
          if (isRoadNetwork) {
            saveAsXodr();
          } else {
            saveAsXosc();
          }
          break;
        case 'undo':
          // Route to the focused document (catalog modal / distribution
          // override). `null` = execution mode: no document, no-op.
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
            case 'scenario':
              storeApi.getState().undo();
              break;
            case null:
              break;
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
            case 'scenario':
              storeApi.getState().redo();
              break;
            case null:
              break;
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
