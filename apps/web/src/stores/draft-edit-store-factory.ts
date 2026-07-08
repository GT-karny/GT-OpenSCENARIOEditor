/**
 * Shared infrastructure for "draft edit" stores (route editing, trajectory editing).
 *
 * Both stores follow the same pattern: a working copy is cloned from a source on
 * enter, mutated through history-tracked actions, and either committed back to the
 * source or discarded on exit. This module single-sources that common behaviour —
 * bounded undo/redo history, snapshot cloning, commit/cancel semantics, selection
 * clamping — so the concrete stores only implement their divergent CRUD.
 *
 * The factory is intentionally structural rather than a full store creator: the
 * route/trajectory stores keep their existing public field names (`editingRoute` /
 * `editingTrajectory`, `selectedWaypointIndex` / `selectedPointIndex`, etc.) so
 * consumers outside these files are unaffected. The shared logic operates on a
 * small `DraftEditConfig` adapter that maps generic concepts onto those names.
 */

/** Max number of undo snapshots retained per store. */
export const MAX_HISTORY = 50;

/** Deep-clone a draft via structured JSON round-trip (drafts are plain data). */
export function cloneDraft<T>(draft: T): T {
  return JSON.parse(JSON.stringify(draft)) as T;
}

/** Undo/redo history buffers for a draft type. */
export interface DraftHistory<T> {
  past: T[];
  future: T[];
}

/** Push a snapshot onto the past buffer, dropping the oldest beyond MAX_HISTORY. */
export function pushHistory<T>(past: T[], draft: T): T[] {
  const newPast = [...past, cloneDraft(draft)];
  if (newPast.length > MAX_HISTORY) {
    newPast.shift();
  }
  return newPast;
}

/**
 * Common draft-edit state shared by every draft store, expressed generically.
 * The concrete stores intersect this with their divergent state via field aliases
 * supplied through {@link DraftEditConfig}.
 */
export interface DraftEditCoreState<TDraft, TSource> {
  active: boolean;
  source: TSource | null;
  warnings: string[];
  history: DraftHistory<TDraft>;
}

/**
 * Adapter mapping the generic draft concept onto a concrete store's shape.
 *
 * `read`/`write` are the store's own `get`/`set` so shared helpers can operate on
 * the divergent field names without knowing them. `getDraft`/`setDraft` and
 * `getSelectedIndex`/`setSelectedIndex` bridge to the store-specific field names
 * (`editingRoute` vs `editingTrajectory`, etc.). `validate` and `pointCount`
 * capture the only per-store domain logic the shared actions need.
 */
/** Minimal state shape the shared draft actions read/write directly. */
export interface DraftEditBaseState {
  warnings: string[];
}

export interface DraftEditConfig<TDraft, TState extends DraftEditBaseState> {
  getDraft: (state: TState) => TDraft | null;
  /** Partial state that assigns the working draft back onto the concrete store. */
  setDraft: (draft: TDraft | null) => Partial<TState>;
  getSelectedIndex: (state: TState) => number | null;
  /** Partial state that assigns the selection index back onto the concrete store. */
  setSelectedIndex: (index: number | null) => Partial<TState>;
  getHistory: (state: TState) => DraftHistory<TDraft>;
  validate: (draft: TDraft) => string[];
  /** Number of selectable points in a draft, used to clamp selection on undo/redo. */
  pointCount: (draft: TDraft) => number;
}

/**
 * Build the shared draft-edit actions for a concrete store.
 *
 * `set`/`get` are the zustand store's own setter/getter. Returns the common
 * actions (mutation helper, undo/redo, selection, commit) which the concrete
 * store spreads into its definition. Divergent CRUD lives in the concrete store
 * and should route all draft writes through {@link commitDraftChange} for
 * consistent history + validation handling.
 */
export function createDraftEditActions<TDraft, TState extends DraftEditBaseState>(
  set: (partial: Partial<TState> | ((state: TState) => Partial<TState> | TState)) => void,
  get: () => TState,
  config: DraftEditConfig<TDraft, TState>,
) {
  /** Build a `warnings` state patch typed as Partial<TState>. */
  function warningsPatch(warnings: string[]): Partial<TState> {
    return { warnings } as DraftEditBaseState as Partial<TState>;
  }

  /**
   * Apply a mutation to the current draft with history + validation handling.
   * `mutate` receives a fresh reference to the current draft and returns the
   * updated draft plus an optional selection override. History is pushed before
   * the change and the redo future is cleared, matching the previous behaviour.
   */
  function commitDraftChange(
    mutate: (draft: TDraft) => { draft: TDraft; selectedIndex?: number | null } | null,
    options: { revalidate?: boolean } = {},
  ): void {
    const { revalidate = true } = options;
    set((state) => {
      const current = config.getDraft(state);
      if (!current) return state;
      const result = mutate(current);
      if (!result) return state;
      const history = config.getHistory(state);
      const past = pushHistory(history.past, current);
      return {
        ...config.setDraft(result.draft),
        ...(result.selectedIndex !== undefined
          ? config.setSelectedIndex(result.selectedIndex)
          : {}),
        ...(revalidate ? warningsPatch(config.validate(result.draft)) : {}),
        history: { past, future: [] },
      } as Partial<TState>;
    });
  }

  /** Clamp a selection index against a draft's point count (null if out of range). */
  function clampSelection(state: TState, draft: TDraft): number | null {
    const selected = config.getSelectedIndex(state);
    return selected !== null && selected < config.pointCount(draft) ? selected : null;
  }

  return {
    commitDraftChange,

    selectIndex: (index: number | null) => {
      set(config.setSelectedIndex(index) as Partial<TState>);
    },

    undo: () => {
      set((state) => {
        const history = config.getHistory(state);
        const current = config.getDraft(state);
        if (history.past.length === 0 || !current) return state;
        const past = [...history.past];
        const previous = past.pop() as TDraft;
        const future = [cloneDraft(current), ...history.future];
        return {
          ...config.setDraft(previous),
          warnings: config.validate(previous),
          ...config.setSelectedIndex(clampSelection(state, previous)),
          history: { past, future },
        } as Partial<TState>;
      });
    },

    redo: () => {
      set((state) => {
        const history = config.getHistory(state);
        const current = config.getDraft(state);
        if (history.future.length === 0 || !current) return state;
        const future = [...history.future];
        const next = future.shift() as TDraft;
        const past = [...history.past, cloneDraft(current)];
        return {
          ...config.setDraft(next),
          warnings: config.validate(next),
          ...config.setSelectedIndex(clampSelection(state, next)),
          history: { past, future },
        } as Partial<TState>;
      });
    },

    canUndo: () => config.getHistory(get()).past.length > 0,
    canRedo: () => config.getHistory(get()).future.length > 0,

    commit: (): TDraft | null => {
      const draft = config.getDraft(get());
      return draft ? cloneDraft(draft) : null;
    },
  };
}
