import { useEffect } from 'react';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useFileOperations } from './use-file-operations';

export function useKeyboardShortcuts() {
  const storeApi = useScenarioStoreApi();
  const { openXosc, saveXosc } = useFileOperations();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        storeApi.getState().undo();
      } else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        storeApi.getState().redo();
      } else if (ctrl && e.key === 's') {
        e.preventDefault();
        saveXosc();
      } else if (ctrl && e.key === 'o') {
        e.preventDefault();
        openXosc();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [storeApi, openXosc, saveXosc]);
}
