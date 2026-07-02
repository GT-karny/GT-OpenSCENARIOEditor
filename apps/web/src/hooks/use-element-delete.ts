import { useCallback } from 'react';
import { detectElementType } from '@osce/node-editor';
import { CompoundCommand } from '@osce/scenario-engine';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';
import { isInputFocused } from '../lib/dom-utils';

type ScenarioStoreState = ReturnType<ReturnType<typeof useScenarioStoreApi>['getState']>;

function deleteElementByIdOn(store: ScenarioStoreState, id: string): void {
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

/**
 * Drop ids that are descendants of another id in the same set. Deleting a
 * parent already removes its whole subtree, so a subsequent delete of a
 * descendant would be a no-op (and must not be counted as its own history
 * entry). Ancestry is resolved by walking getParentOf up to the root.
 */
function dedupeDescendants(store: ScenarioStoreState, ids: string[]): string[] {
  const idSet = new Set(ids);

  const isDescendantOfAnother = (id: string): boolean => {
    let current = store.getParentOf(id);
    let guard = 0;
    while (current && guard < 10_000) {
      const parent = current.parent as { id?: unknown } | undefined;
      const parentId = parent && typeof parent.id === 'string' ? parent.id : undefined;
      if (parentId && idSet.has(parentId)) return true;
      if (!parentId) break;
      current = store.getParentOf(parentId);
      guard += 1;
    }
    return false;
  };

  return ids.filter((id) => !isDescendantOfAnother(id));
}

export function useElementDelete() {
  const storeApi = useScenarioStoreApi();

  const deleteElementById = useCallback(
    (id: string) => {
      deleteElementByIdOn(storeApi.getState(), id);
    },
    [storeApi],
  );

  const deleteSelected = useCallback(() => {
    if (isInputFocused()) return;

    const selectedIds = useEditorStore.getState().selection.selectedElementIds;
    if (selectedIds.length === 0) return;

    const store = storeApi.getState();

    // Deleting a parent removes its subtree — drop any selected descendants so
    // they are not double-deleted and do not add empty history entries.
    const targets = dedupeDescendants(store, [...selectedIds]);
    if (targets.length === 0) {
      useEditorStore.getState().clearSelection();
      return;
    }

    const history = store.getCommandHistory();
    const before = history.getUndoStack().length;

    for (const id of targets) {
      deleteElementByIdOn(store, id);
    }

    // Collapse every delete command into ONE compound entry so a single
    // Ctrl+Z restores the whole multi-delete.
    const added = history.getUndoStack().slice(before);
    if (added.length > 1) {
      history.collapseUndo(
        added.length,
        new CompoundCommand(`Delete ${added.length} elements`, [...added]),
      );
    }

    useEditorStore.getState().clearSelection();
  }, [storeApi]);

  return { deleteElementById, deleteSelected };
}
