import { useEffect } from 'react';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useFileOperations } from './use-file-operations';

/**
 * Listens for menu actions dispatched from the Electron native menu.
 * No-op when running in a regular browser.
 */
export function useElectronMenu() {
  const { newScenario, openXosc, saveXosc, saveAsXosc } = useFileOperations();
  const storeApi = useScenarioStoreApi();

  useEffect(() => {
    if (!window.electronAPI?.isElectron) return;

    const cleanup = window.electronAPI.onMenuAction((action) => {
      switch (action) {
        case 'new':
          newScenario();
          break;
        case 'open':
          openXosc();
          break;
        case 'save':
          saveXosc();
          break;
        case 'saveAs':
          saveAsXosc();
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
  }, [newScenario, openXosc, saveXosc, saveAsXosc, storeApi]);
}
