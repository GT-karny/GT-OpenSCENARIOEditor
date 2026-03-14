import { useEffect } from 'react';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';
import { useRouteEditStore } from '../stores/route-edit-store';
import { useFileOperations } from './use-file-operations';
import { useElementDelete } from './use-element-delete';
import { getOpenDriveStoreApi } from './use-opendrive-store';
import { isInputFocused } from '../lib/dom-utils';

export function useKeyboardShortcuts() {
  const storeApi = useScenarioStoreApi();
  const { openXosc, saveXosc, saveAsXosc, loadXodr, saveXodr, saveAsXodr } = useFileOperations();
  const { deleteSelected } = useElementDelete();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const editorMode = useEditorStore.getState().editorMode;
      const isRoadNetwork = editorMode === 'roadNetwork';

      const routeEditActive = useRouteEditStore.getState().active;

      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (!routeEditActive) {
          if (isRoadNetwork) {
            getOpenDriveStoreApi().getState().undo();
          } else {
            storeApi.getState().undo();
          }
        }
      } else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (!routeEditActive) {
          if (isRoadNetwork) {
            getOpenDriveStoreApi().getState().redo();
          } else {
            storeApi.getState().redo();
          }
        }
      } else if (ctrl && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (isRoadNetwork) {
          saveAsXodr();
        } else {
          saveAsXosc();
        }
      } else if (ctrl && e.key === 's') {
        e.preventDefault();
        if (isRoadNetwork) {
          saveXodr();
        } else {
          saveXosc();
        }
      } else if (ctrl && e.key === 'o') {
        e.preventDefault();
        if (isRoadNetwork) {
          loadXodr();
        } else {
          openXosc();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isInputFocused() || routeEditActive) return;
        e.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [storeApi, openXosc, saveXosc, saveAsXosc, loadXodr, saveXodr, saveAsXodr, deleteSelected]);
}
