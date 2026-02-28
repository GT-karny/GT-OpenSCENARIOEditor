import { useEffect } from 'react';
import { detectElementType } from '@osce/node-editor';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';
import { useFileOperations } from './use-file-operations';

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable;
}

function deleteElementById(
  store: ReturnType<ReturnType<typeof useScenarioStoreApi>['getState']>,
  id: string,
): void {
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
}

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
      } else if (e.key === 'Delete' || (e.key === 'Backspace' && !isInputFocused())) {
        if (isInputFocused()) return;
        e.preventDefault();

        const selectedIds = useEditorStore.getState().selection.selectedElementIds;
        if (selectedIds.length === 0) return;

        const store = storeApi.getState();
        for (const id of selectedIds) {
          deleteElementById(store, id);
        }
        useEditorStore.getState().clearSelection();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [storeApi, openXosc, saveXosc]);
}
