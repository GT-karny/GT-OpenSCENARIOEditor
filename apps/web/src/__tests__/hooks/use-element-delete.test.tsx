import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { I18nextProvider, initI18n, i18n } from '@osce/i18n';
import { ScenarioStoreProvider } from '../../stores/scenario-store-context';
import { useScenarioStoreContext } from '../../stores/scenario-store-context';
import { TooltipProvider } from '../../components/ui/tooltip';
import { useElementDelete } from '../../hooks/use-element-delete';
import { useEditorStore } from '../../stores/editor-store';
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

afterEach(() => {
  useEditorStore.getState().clearSelection();
});

function renderDelete() {
  return renderHook(
    () => {
      const storeApi = useScenarioStoreContext();
      const del = useElementDelete();
      return { storeApi, del };
    },
    { wrapper },
  );
}

describe('useElementDelete — multi-delete single undo', () => {
  it('deletes all selected entities and restores them with one undo', () => {
    const { result } = renderDelete();
    const store = result.current.storeApi.getState();

    let ids: string[] = [];
    act(() => {
      ids = [
        store.addEntity({ name: 'A' }).id,
        store.addEntity({ name: 'B' }).id,
        store.addEntity({ name: 'C' }).id,
      ];
    });
    expect(store.getScenario().entities).toHaveLength(3);

    act(() => {
      useEditorStore.getState().setSelection({ selectedElementIds: ids });
    });

    const undoBefore = store.getCommandHistory().getUndoStack().length;
    act(() => {
      result.current.del.deleteSelected();
    });

    const st = result.current.storeApi.getState();
    expect(st.getScenario().entities).toHaveLength(0);
    // Exactly one compound entry added.
    expect(st.getCommandHistory().getUndoStack().length - undoBefore).toBe(1);

    act(() => {
      st.undo();
    });
    const restored = result.current.storeApi
      .getState()
      .getScenario()
      .entities.map((e) => e.name);
    expect(restored.sort()).toEqual(['A', 'B', 'C']);
  });

  it('dedupes descendants so deleting a parent + child is one delete', () => {
    const { result } = renderDelete();
    const store = result.current.storeApi.getState();

    let storyId = '';
    let actId = '';
    act(() => {
      const story = store.addStory({ name: 'S' });
      storyId = story.id;
      const a = store.addAct(storyId, { name: 'Act1' });
      actId = a.id;
    });

    // Select both the story (parent) and the act (descendant).
    act(() => {
      useEditorStore.getState().setSelection({ selectedElementIds: [storyId, actId] });
    });

    const undoBefore = store.getCommandHistory().getUndoStack().length;
    act(() => {
      result.current.del.deleteSelected();
    });

    const st = result.current.storeApi.getState();
    expect(st.getScenario().storyboard.stories).toHaveLength(0);
    // Descendant was deduped: only the story delete ran, so exactly ONE
    // command was added (no compound wrapping, no empty child-delete entry).
    expect(st.getCommandHistory().getUndoStack().length - undoBefore).toBe(1);

    // One undo restores the story subtree.
    act(() => {
      st.undo();
    });
    expect(result.current.storeApi.getState().getScenario().storyboard.stories).toHaveLength(1);
  });
});
