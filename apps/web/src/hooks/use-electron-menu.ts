import { useEffect } from 'react';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';
import { useFileOperations } from './use-file-operations';

/**
 * Listens for menu actions dispatched from the Electron native menu.
 * No-op when running in a regular browser.
 */
export function useElectronMenu() {
  const { newScenario, openXosc, saveXosc, saveAsXosc, saveXodr, saveAsXodr } =
    useFileOperations();
  const storeApi = useScenarioStoreApi();

  useEffect(() => {
    if (!window.electronAPI?.isElectron) return;

    const cleanup = window.electronAPI.onMenuAction((action) => {
      const isRoadNetwork = useEditorStore.getState().editorMode === 'roadNetwork';
      switch (action) {
        case 'new':
          newScenario();
          break;
        case 'open':
          openXosc();
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
          storeApi.getState().undo();
          break;
        case 'redo':
          storeApi.getState().redo();
          break;
      }
    });

    return cleanup;
  }, [newScenario, openXosc, saveXosc, saveAsXosc, saveXodr, saveAsXodr, storeApi]);
}
