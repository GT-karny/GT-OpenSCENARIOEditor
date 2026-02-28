import { useCallback } from 'react';
import { detectElementType } from '@osce/node-editor';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';
import { isInputFocused } from '../lib/dom-utils';

export function useElementDelete() {
  const storeApi = useScenarioStoreApi();

  const deleteElementById = useCallback(
    (id: string) => {
      const store = storeApi.getState();
      const element = store.getElementById(id);
      if (!element) return;

      const type = detectElementType(element);
      if (!type) return;

      switch (type) {
        case 'entity':
          store.removeEntity(id);
          break;
        case 'story':
          store.removeStory(id);
          break;
        case 'act':
          store.removeAct(id);
          break;
        case 'maneuverGroup':
          store.removeManeuverGroup(id);
          break;
        case 'maneuver':
          store.removeManeuver(id);
          break;
        case 'event':
          store.removeEvent(id);
          break;
        case 'action':
          store.removeAction(id);
          break;
        case 'condition':
          store.removeCondition(id);
          break;
        // storyboard, init, trigger are structural — not deletable
        case 'storyboard':
        case 'init':
        case 'trigger':
          break;
      }
    },
    [storeApi],
  );

  const deleteSelected = useCallback(() => {
    if (isInputFocused()) return;

    const selectedIds = useEditorStore.getState().selection.selectedElementIds;
    if (selectedIds.length === 0) return;

    for (const id of selectedIds) {
      deleteElementById(id);
    }
    useEditorStore.getState().clearSelection();
  }, [deleteElementById]);

  return { deleteElementById, deleteSelected };
}
