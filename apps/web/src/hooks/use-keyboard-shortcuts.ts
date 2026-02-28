import { useEffect } from 'react';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useFileOperations } from './use-file-operations';
import { useElementDelete } from './use-element-delete';
import { isInputFocused } from '../lib/dom-utils';

export function useKeyboardShortcuts() {
  const storeApi = useScenarioStoreApi();
  const { openXosc, saveXosc } = useFileOperations();
  const { deleteSelected } = useElementDelete();

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
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isInputFocused()) return;
        e.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [storeApi, openXosc, saveXosc, deleteSelected]);
}
