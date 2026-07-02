/**
 * Hook for copy/paste/duplicate operations on storyboard elements and entities.
 */

import { useCallback } from 'react';
import type {
  ManeuverGroup,
  Maneuver,
  ScenarioEvent,
  ScenarioAction,
  ScenarioEntity,
} from '@osce/shared';
import { deepCloneWithNewIds, CompoundCommand } from '@osce/scenario-engine';
import type { CloneableElementType } from '@osce/scenario-engine';
import { useClipboardStore } from '../stores/clipboard-store';
import type { ClipboardItem } from '../stores/clipboard-store';
import { useScenarioStoreApi } from '../stores/use-scenario-store';

/** Map from parent field name to the element type it contains. */
const FIELD_TO_TYPE: Record<string, CloneableElementType> = {
  maneuverGroups: 'maneuverGroup',
  maneuvers: 'maneuver',
  events: 'event',
  actions: 'action',
  entities: 'entity',
};

/** Which parent field accepts which clipboard type for paste. */
const PASTE_TARGET_FIELD: Record<CloneableElementType, string> = {
  maneuverGroup: 'maneuverGroups',
  maneuver: 'maneuvers',
  event: 'events',
  action: 'actions',
  entity: 'entities',
};

type ScenarioStoreState = ReturnType<ReturnType<typeof useScenarioStoreApi>['getState']>;

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

  /**
   * Copy several selected elements at once (order-stable). Elements whose
   * type cannot be detected are skipped. If nothing is copyable the clipboard
   * is left untouched.
   */
  const copyElements = useCallback(
    (elementIds: string[]) => {
      const store = storeApi.getState();
      const items: ClipboardItem[] = [];
      for (const id of elementIds) {
        const element = store.getElementById(id);
        if (!element) continue;
        const type = detectElementType(store.getParentOf, id);
        if (!type) continue;
        items.push({ type, data: element });
      }
      if (items.length === 0) return;
      useClipboardStore.getState().copyMany(items);
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

      if (type === 'entity') {
        store.duplicateEntity(elementId);
        return;
      }

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
      const { copiedItems } = useClipboardStore.getState();
      if (copiedItems.length === 0) return;

      const store = storeApi.getState();
      for (const item of copiedItems) {
        const clone = deepCloneWithNewIds(item.data, item.type);
        pasteCloneInto(store, item.type, targetParentId, clone);
      }
    },
    [storeApi],
  );

  /**
   * Smart paste: given a selected element ID and clipboard content,
   * figure out the correct parent to paste into.
   *
   * Rules (evaluated against the FIRST clipboard item):
   * - If selected element IS a valid parent type → paste as child
   * - If selected element is the SAME type as clipboard → paste as sibling (into its parent)
   *
   * All clipboard items are pasted into the resolved parent.
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
      const selectedElement = store.getElementById(selectedElementId) as
        | Record<string, unknown>
        | undefined;
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
      const selectedElement = store.getElementById(selectedElementId) as
        | Record<string, unknown>
        | undefined;
      if (selectedElement && expectedParentField in selectedElement) return true;

      // Can paste as sibling?
      if (selectedType === copiedItem.type) return true;

      return false;
    },
    [storeApi],
  );

  /**
   * Duplicate every element in the current selection in place. Entities go
   * through duplicateEntity (which clones init actions); storyboard elements
   * are cloned and pasted back into their own parent.
   *
   * The whole operation collapses into a SINGLE undo entry: when more than
   * one sub-command lands on the history, they are replaced by one
   * CompoundCommand so a single Ctrl+Z reverts the entire duplication.
   */
  const duplicateElements = useCallback(
    (elementIds: string[]) => {
      if (elementIds.length === 0) return;

      const store = storeApi.getState();
      const history = store.getCommandHistory();
      const before = history.getUndoStack().length;

      for (const id of elementIds) {
        duplicateElement(id);
      }

      const added = history.getUndoStack().slice(before);
      if (added.length > 1) {
        // Replace the individual sub-commands with one compound entry so a
        // single Ctrl+Z reverts the whole multi-duplicate. The document was
        // already mutated by the sub-commands; collapseUndo only rewrites the
        // history stacks, so undo/redo availability stays consistent.
        history.collapseUndo(
          added.length,
          new CompoundCommand(`Duplicate ${added.length} elements`, [...added]),
        );
      }
    },
    [storeApi, duplicateElement],
  );

  return {
    copyElement,
    copyElements,
    duplicateElement,
    duplicateElements,
    pasteInto,
    pasteAtSelection,
    canPasteInto,
    canPasteAtSelection,
  };
}

// --- Internal helper ---

function pasteCloneInto(
  store: ScenarioStoreState,
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
    case 'entity': {
      const entity = clone as ScenarioEntity;
      // Entities are keyed by NAME across the storyboard; ensure the pasted
      // copy does not collide with an existing entity name.
      entity.name = uniqueEntityName(store, entity.name);
      const definition = entity.definition as { name?: string };
      if (typeof definition.name === 'string') definition.name = entity.name;
      store.addEntity(entity);
      break;
    }
  }
}

/** Find a unique entity name based on `baseName` within the current document. */
function uniqueEntityName(store: ScenarioStoreState, baseName: string): string {
  const existing = new Set(store.getScenario().entities.map((e) => e.name));
  if (!existing.has(baseName)) return baseName;
  let counter = 2;
  let candidate = `${baseName}${counter}`;
  while (existing.has(candidate)) {
    counter += 1;
    candidate = `${baseName}${counter}`;
  }
  return candidate;
}
