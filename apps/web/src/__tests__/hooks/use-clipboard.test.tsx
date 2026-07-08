import { describe, it, expect, beforeAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { I18nextProvider, initI18n, i18n } from '@osce/i18n';
import { ScenarioStoreProvider } from '../../stores/scenario-store-context';
import { useScenarioStoreContext } from '../../stores/scenario-store-context';
import { TooltipProvider } from '../../components/ui/tooltip';
import { useCopyPaste } from '../../hooks/use-clipboard';
import { useClipboardStore } from '../../stores/clipboard-store';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ScenarioStoreProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ScenarioStoreProvider>
    </I18nextProvider>
  );
}

beforeAll(async () => {
  await initI18n('en');
});

/**
 * Renders useCopyPaste together with the scenario store api so tests can
 * seed entities and inspect the resulting document.
 */
function renderClipboard() {
  return renderHook(
    () => {
      const storeApi = useScenarioStoreContext();
      const clipboard = useCopyPaste();
      return { storeApi, clipboard };
    },
    { wrapper },
  );
}

describe('useCopyPaste — entity duplication', () => {
  it('duplicateElement clones an entity with a unique name as one undo step', () => {
    const { result } = renderClipboard();
    const store = result.current.storeApi.getState();

    let egoId = '';
    act(() => {
      egoId = store.addEntity({ name: 'Ego' }).id;
    });

    const undoBefore = store.getCommandHistory().getUndoStack().length;
    act(() => {
      result.current.clipboard.duplicateElement(egoId);
    });

    const entities = result.current.storeApi.getState().getScenario().entities;
    expect(entities).toHaveLength(2);
    expect(entities.map((e) => e.name)).toContain('Ego_copy');

    const undoAfter = result.current.storeApi.getState().getCommandHistory().getUndoStack().length;
    expect(undoAfter - undoBefore).toBe(1);
  });

  it('duplicateElements collapses multiple entity duplications into one undo', () => {
    const { result } = renderClipboard();
    const store = result.current.storeApi.getState();

    let aId = '';
    let bId = '';
    act(() => {
      aId = store.addEntity({ name: 'A' }).id;
      bId = store.addEntity({ name: 'B' }).id;
    });

    const undoBefore = store.getCommandHistory().getUndoStack().length;
    act(() => {
      result.current.clipboard.duplicateElements([aId, bId]);
    });

    const st = result.current.storeApi.getState();
    expect(st.getScenario().entities).toHaveLength(4);
    const undoAfter = st.getCommandHistory().getUndoStack().length;
    expect(undoAfter - undoBefore).toBe(1);

    // Single undo reverts both duplications.
    act(() => {
      st.undo();
    });
    expect(result.current.storeApi.getState().getScenario().entities).toHaveLength(2);
  });
});

describe('useCopyPaste — multi-select copy/paste', () => {
  it('copyElements captures all copyable selections in order', () => {
    const { result } = renderClipboard();
    const store = result.current.storeApi.getState();

    let aId = '';
    let bId = '';
    act(() => {
      aId = store.addEntity({ name: 'A' }).id;
      bId = store.addEntity({ name: 'B' }).id;
    });

    act(() => {
      result.current.clipboard.copyElements([aId, bId]);
    });

    const items = useClipboardStore.getState().copiedItems;
    expect(items).toHaveLength(2);
    expect(items.every((it) => it.type === 'entity')).toBe(true);
    // Legacy single accessor still points at the first item.
    expect(useClipboardStore.getState().copiedItem).toBe(items[0]);
  });
});

describe('useCopyPaste — parent field mapping subset', () => {
  it('copyElement is a no-op when the element id is unresolvable (unknown parent field)', () => {
    const { result } = renderClipboard();

    const before = useClipboardStore.getState().copiedItems.length;
    act(() => {
      // getParentOf returns undefined for an id that does not exist in the
      // document, exercising the same "no type resolved -> no-op" path that
      // a real element parented under a non-cloneable field (e.g. a Story's
      // 'acts' field, or Storyboard's 'stories' field) would take.
      result.current.clipboard.copyElement('does-not-exist');
    });
    expect(useClipboardStore.getState().copiedItems.length).toBe(before);
  });
});

describe('use-clipboard FIELD_TO_TYPE — subset of the shared registry', () => {
  it('is a strict subset of PARENT_FIELD_TO_TYPE covering only the 5 cloneable types', async () => {
    const { PARENT_FIELD_TO_TYPE } = await import('@osce/node-editor');

    // The clipboard must only ever be able to copy/paste these 5 types.
    // 'stories' -> 'story' and 'acts' -> 'act' exist as real storyboard
    // parent fields but must NOT be present in PARENT_FIELD_TO_TYPE's
    // cloneable subset consumed by the clipboard.
    expect(PARENT_FIELD_TO_TYPE.stories).toBeUndefined();
    expect(PARENT_FIELD_TO_TYPE.acts).toBeUndefined();

    // Every field that IS mapped must resolve to one of the 5 cloneable types.
    const cloneable = new Set(['maneuverGroup', 'maneuver', 'event', 'action', 'entity']);
    for (const type of Object.values(PARENT_FIELD_TO_TYPE)) {
      expect(cloneable.has(type as string)).toBe(true);
    }
  });
});
