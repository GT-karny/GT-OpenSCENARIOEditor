/**
 * Hook for copy/paste/duplicate operations on storyboard elements.
 */

import { useCallback } from 'react';
import type {
  ManeuverGroup,
  Maneuver,
  ScenarioEvent,
  ScenarioAction,
} from '@osce/shared';
import { deepCloneWithNewIds } from '@osce/scenario-engine';
import type { CloneableElementType } from '@osce/scenario-engine';
import { useClipboardStore } from '../stores/clipboard-store';
import { useScenarioStoreApi } from '../stores/use-scenario-store';

/** Map from parent field name to the element type it contains. */
const FIELD_TO_TYPE: Record<string, CloneableElementType> = {
  maneuverGroups: 'maneuverGroup',
  maneuvers: 'maneuver',
  events: 'event',
  actions: 'action',
};

/** Which parent field accepts which clipboard type for paste. */
const PASTE_TARGET_FIELD: Record<CloneableElementType, string> = {
  maneuverGroup: 'maneuverGroups',
  maneuver: 'maneuvers',
  event: 'events',
  action: 'actions',
};

/**
 * Detect the CloneableElementType of an element by asking the store
 * which field the element lives in within its parent.
 */
function detectElementType(
  getParentOf: (id: string) => { parent: unknown; field: string } | undefined,
  elementId: string,
): CloneableElementType | null {
  const info = getParentOf(elementId);
  if (!info) return null;
  return FIELD_TO_TYPE[info.field] ?? null;
}

export function useCopyPaste() {
  const storeApi = useScenarioStoreApi();

  const copyElement = useCallback(
    (elementId: string) => {
      const store = storeApi.getState();
      const element = store.getElementById(elementId);
      if (!element) return;

      const type = detectElementType(store.getParentOf, elementId);
      if (!type) return;

      useClipboardStore.getState().copy(type, element);
    },
    [storeApi],
  );

  const duplicateElement = useCallback(
    (elementId: string) => {
      const store = storeApi.getState();
      const element = store.getElementById(elementId);
      if (!element) return;

      const type = detectElementType(store.getParentOf, elementId);
      if (!type) return;

      const parentInfo = store.getParentOf(elementId);
      if (!parentInfo) return;
      const parentId = (parentInfo.parent as { id: string }).id;

      const clone = deepCloneWithNewIds(element, type);
      pasteCloneInto(store, type, parentId, clone);
    },
    [storeApi],
  );

  const pasteInto = useCallback(
    (targetParentId: string) => {
      const { copiedItem } = useClipboardStore.getState();
      if (!copiedItem) return;

      const store = storeApi.getState();
      const clone = deepCloneWithNewIds(copiedItem.data, copiedItem.type);
      pasteCloneInto(store, copiedItem.type, targetParentId, clone);
    },
    [storeApi],
  );

  /**
   * Smart paste: given a selected element ID and clipboard content,
   * figure out the correct parent to paste into.
   *
   * Rules:
   * - If selected element IS a valid parent type → paste as child
   * - If selected element is the SAME type as clipboard → paste as sibling (into its parent)
   */
  const pasteAtSelection = useCallback(
    (selectedElementId: string) => {
      const { copiedItem } = useClipboardStore.getState();
      if (!copiedItem) return;

      const store = storeApi.getState();
      const selectedType = detectElementType(store.getParentOf, selectedElementId);
      if (!selectedType) return;

      const expectedParentField = PASTE_TARGET_FIELD[copiedItem.type];

      // Check if selected element can be a parent for the clipboard content
      const selectedElement = store.getElementById(selectedElementId) as Record<string, unknown> | undefined;
      if (selectedElement && expectedParentField in selectedElement) {
        // Selected element IS a valid parent
        pasteInto(selectedElementId);
        return;
      }

      // Otherwise, if same type, paste as sibling (into shared parent)
      if (selectedType === copiedItem.type) {
        const parentInfo = store.getParentOf(selectedElementId);
        if (parentInfo) {
          const parentId = (parentInfo.parent as { id: string }).id;
          pasteInto(parentId);
        }
      }
    },
    [storeApi, pasteInto],
  );

  const canPasteInto = useCallback(
    (targetParentId: string): boolean => {
      const { copiedItem } = useClipboardStore.getState();
      if (!copiedItem) return false;

      const store = storeApi.getState();
      const target = store.getElementById(targetParentId) as Record<string, unknown> | undefined;
      if (!target) return false;

      const expectedField = PASTE_TARGET_FIELD[copiedItem.type];
      return expectedField in target;
    },
    [storeApi],
  );

  /**
   * Check if the clipboard content can be pasted relative to the given element
   * using the same smart logic as pasteAtSelection.
   */
  const canPasteAtSelection = useCallback(
    (selectedElementId: string): boolean => {
      const { copiedItem } = useClipboardStore.getState();
      if (!copiedItem) return false;

      const store = storeApi.getState();
      const selectedType = detectElementType(store.getParentOf, selectedElementId);
      if (!selectedType) return false;

      const expectedParentField = PASTE_TARGET_FIELD[copiedItem.type];

      // Can paste as child?
      const selectedElement = store.getElementById(selectedElementId) as Record<string, unknown> | undefined;
      if (selectedElement && expectedParentField in selectedElement) return true;

      // Can paste as sibling?
      if (selectedType === copiedItem.type) return true;

      return false;
    },
    [storeApi],
  );

  return { copyElement, duplicateElement, pasteInto, pasteAtSelection, canPasteInto, canPasteAtSelection };
}

// --- Internal helper ---

function pasteCloneInto(
  store: ReturnType<ReturnType<typeof useScenarioStoreApi>['getState']>,
  type: CloneableElementType,
  parentId: string,
  clone: unknown,
): void {
  switch (type) {
    case 'maneuverGroup':
      store.addManeuverGroup(parentId, clone as ManeuverGroup);
      break;
    case 'maneuver':
      store.addManeuver(parentId, clone as Maneuver);
      break;
    case 'event':
      store.addEvent(parentId, clone as ScenarioEvent);
      break;
    case 'action':
      store.addAction(parentId, clone as ScenarioAction);
      break;
  }
}
