import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import {
  MAX_HISTORY,
  cloneDraft,
  pushHistory,
  createDraftEditActions,
  type DraftEditConfig,
  type DraftHistory,
} from '../../stores/draft-edit-store-factory';

// A minimal draft type + store to exercise the shared infrastructure in isolation.
interface Draft {
  values: number[];
}

interface TestState {
  draft: Draft | null;
  selectedIndex: number | null;
  warnings: string[];
  history: DraftHistory<Draft>;
  // actions
  commitDraftChange: ReturnType<typeof createDraftEditActions<Draft, TestState>>['commitDraftChange'];
  selectIndex: (index: number | null) => void;
  addValue: (v: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  commit: () => Draft | null;
}

const config: DraftEditConfig<Draft, TestState> = {
  getDraft: (s) => s.draft,
  setDraft: (draft) => ({ draft }),
  getSelectedIndex: (s) => s.selectedIndex,
  setSelectedIndex: (index) => ({ selectedIndex: index }),
  getHistory: (s) => s.history,
  validate: (d) => (d.values.length < 1 ? ['empty'] : []),
  pointCount: (d) => d.values.length,
};

function makeStore(initialDraft: Draft) {
  return create<TestState>((set, get) => {
    const core = createDraftEditActions<Draft, TestState>(set, get, config);
    return {
      draft: cloneDraft(initialDraft),
      selectedIndex: null,
      warnings: config.validate(initialDraft),
      history: { past: [], future: [] },
      commitDraftChange: core.commitDraftChange,
      selectIndex: core.selectIndex,
      addValue: (v) =>
        core.commitDraftChange((d) => ({
          draft: { values: [...d.values, v] },
          selectedIndex: d.values.length,
        })),
      undo: core.undo,
      redo: core.redo,
      canUndo: core.canUndo,
      canRedo: core.canRedo,
      commit: core.commit,
    };
  });
}

describe('draft-edit-store-factory helpers', () => {
  it('pushHistory clones and bounds to MAX_HISTORY', () => {
    let past: Draft[] = [];
    for (let i = 0; i < MAX_HISTORY + 10; i++) {
      past = pushHistory(past, { values: [i] });
    }
    expect(past.length).toBe(MAX_HISTORY);
    // Oldest entries dropped: first retained is index 10.
    expect(past[0].values[0]).toBe(10);
  });

  it('cloneDraft produces a deep copy', () => {
    const src = { values: [1, 2, 3] };
    const copy = cloneDraft(src);
    copy.values.push(4);
    expect(src.values).toEqual([1, 2, 3]);
  });
});

describe('createDraftEditActions', () => {
  it('commitDraftChange records history, clears future, and revalidates', () => {
    const store = makeStore({ values: [1] });
    store.getState().addValue(2);
    expect(store.getState().draft?.values).toEqual([1, 2]);
    expect(store.getState().selectedIndex).toBe(1);
    expect(store.getState().history.past.length).toBe(1);
    expect(store.getState().history.future).toEqual([]);
    expect(store.getState().warnings).toEqual([]);
  });

  it('undo/redo restore prior snapshots and clamp selection', () => {
    const store = makeStore({ values: [1] });
    store.getState().addValue(2); // [1,2] selected 1
    store.getState().addValue(3); // [1,2,3] selected 2

    store.getState().undo();
    expect(store.getState().draft?.values).toEqual([1, 2]);
    // Selection 2 is out of range for [1,2] -> clamped to null.
    expect(store.getState().selectedIndex).toBeNull();

    store.getState().redo();
    expect(store.getState().draft?.values).toEqual([1, 2, 3]);
  });

  it('canUndo/canRedo reflect history availability', () => {
    const store = makeStore({ values: [1] });
    expect(store.getState().canUndo()).toBe(false);
    expect(store.getState().canRedo()).toBe(false);
    store.getState().addValue(2);
    expect(store.getState().canUndo()).toBe(true);
    expect(store.getState().canRedo()).toBe(false);
    store.getState().undo();
    expect(store.getState().canRedo()).toBe(true);
  });

  it('history is bounded to MAX_HISTORY snapshots', () => {
    const store = makeStore({ values: [0] });
    for (let i = 1; i <= MAX_HISTORY + 5; i++) {
      store.getState().addValue(i);
    }
    expect(store.getState().history.past.length).toBe(MAX_HISTORY);
  });

  it('commit returns a deep clone of the draft', () => {
    const store = makeStore({ values: [1, 2] });
    const committed = store.getState().commit();
    expect(committed).toEqual({ values: [1, 2] });
    committed!.values.push(3);
    expect(store.getState().draft?.values).toEqual([1, 2]);
  });

  it('selectIndex updates the selection', () => {
    const store = makeStore({ values: [1, 2] });
    store.getState().selectIndex(1);
    expect(store.getState().selectedIndex).toBe(1);
  });

  it('commitDraftChange with { revalidate: false } leaves warnings untouched', () => {
    const store = makeStore({ values: [1] });
    // Force a warning state first via an empty draft.
    store.getState().commitDraftChange(() => ({ draft: { values: [] } }));
    expect(store.getState().warnings).toEqual(['empty']);
    // Non-revalidating change keeps the stale warnings.
    store.getState().commitDraftChange(() => ({ draft: { values: [] } }), { revalidate: false });
    expect(store.getState().warnings).toEqual(['empty']);
  });

  it('commitDraftChange returning null is a no-op', () => {
    const store = makeStore({ values: [1] });
    const before = store.getState().history.past.length;
    store.getState().commitDraftChange(() => null);
    expect(store.getState().history.past.length).toBe(before);
    expect(store.getState().draft?.values).toEqual([1]);
  });
});
