/**
 * DocumentRegistry — a single source of truth for per-document dirty state.
 *
 * Dirty is a *derived* value, never a hand-set boolean: a document is dirty when
 * its engine command-history revision differs from the revision captured at the
 * last save/load. Because {@link CommandHistory.getRevision} is position-derived,
 * undoing back to the save point restores the saved revision and the document
 * reads clean again — the core value the S1 registry unlocks.
 *
 * The engine stores expose revision differently: OpenDRIVE, catalog, and
 * distribution are module singletons (reachable by direct import), while the
 * scenario store lives in React context, so its API is injected once by
 * {@link initDocumentRegistry}. All four stores are subscribed and their live
 * revision mirrored into `current`, so `dirty = current !== saved` is reactive
 * and drives re-renders through ordinary Zustand selectors.
 *
 * The 'catalog' kind stands for the *set* of loaded catalogs; per-catalog dirty
 * is derived inside the catalog store (see catalog-store) and its kind-level
 * revision is re-baselined via markSaved only when the whole set matches disk.
 */
import { create } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';
import type { ScenarioStore } from '@osce/scenario-engine';
import { getOpenDriveStoreApi } from '../hooks/use-opendrive-store';
import { useCatalogStore } from './catalog-store';
import { useDistributionStore } from './distribution-store';
import { useEditorStore } from './editor-store';

export type DocumentKind = 'scenario' | 'roadNetwork' | 'catalog' | 'distribution';

const KINDS: readonly DocumentKind[] = ['scenario', 'roadNetwork', 'catalog', 'distribution'];

/**
 * A savedRevision sentinel that can never equal a real command-history revision
 * (revisions are non-negative), so the document stays dirty until an explicit
 * save. Used after autosave recovery, where restored work is unsaved by
 * definition.
 */
const RESTORED_DIRTY = -1;

/** Injected scenario store API — see {@link initDocumentRegistry}. */
let scenarioApi: StoreApi<ScenarioStore> | null = null;

/** Read a document's live command-history revision from its engine store. */
function liveRevision(kind: DocumentKind): number {
  switch (kind) {
    case 'scenario':
      return scenarioApi ? scenarioApi.getState().getCommandHistory().getRevision() : 0;
    case 'roadNetwork':
      return getOpenDriveStoreApi().getState().getCommandHistory().getRevision();
    case 'catalog':
      return useCatalogStore.getState().getCommandHistory().getRevision();
    case 'distribution':
      return useDistributionStore.getState().getCommandHistory().getRevision();
  }
}

interface DocumentRegistryState {
  /** Command-history revision captured at the last save/load, per document. */
  saved: Record<DocumentKind, number>;
  /**
   * Mirror of each engine store's live revision, kept in sync by the engine
   * subscriptions so `dirty = current !== saved` is a reactive derived value.
   */
  current: Record<DocumentKind, number>;

  /**
   * Which document currently has edit focus, when it is one that lives outside
   * the main editor view (a catalog modal / distribution affordance). `null`
   * defers focus to {@link EditorStore.editorMode}. Drives undo/redo routing so
   * Ctrl+Z rewinds the document the user is actually editing.
   */
  focusedOverride: 'catalog' | 'distribution' | null;
  setFocusedOverride: (kind: 'catalog' | 'distribution' | null) => void;

  /** Capture the current revision as the clean baseline (called on save). */
  markSaved: (kind: DocumentKind) => void;
  /** Same as {@link markSaved}; a freshly loaded document is clean. */
  markLoaded: (kind: DocumentKind) => void;
  /** Force dirty until the next save (autosave recovery). */
  markRestoredDirty: (kind: DocumentKind) => void;
  isDirty: (kind: DocumentKind) => boolean;
  anyDirty: () => boolean;
  dirtyKinds: () => DocumentKind[];
}

export const useDocumentRegistry = create<DocumentRegistryState>((set, get) => ({
  saved: { scenario: 0, roadNetwork: 0, catalog: 0, distribution: 0 },
  current: { scenario: 0, roadNetwork: 0, catalog: 0, distribution: 0 },

  focusedOverride: null,
  setFocusedOverride: (kind) => set({ focusedOverride: kind }),

  markSaved: (kind) => {
    const rev = liveRevision(kind);
    set((s) => ({
      saved: { ...s.saved, [kind]: rev },
      current: { ...s.current, [kind]: rev },
    }));
  },
  markLoaded: (kind) => get().markSaved(kind),
  markRestoredDirty: (kind) => {
    const rev = liveRevision(kind);
    set((s) => ({
      saved: { ...s.saved, [kind]: RESTORED_DIRTY },
      current: { ...s.current, [kind]: rev },
    }));
  },
  isDirty: (kind) => {
    const s = get();
    return s.current[kind] !== s.saved[kind];
  },
  anyDirty: () => KINDS.some((k) => get().isDirty(k)),
  dirtyKinds: () => KINDS.filter((k) => get().isDirty(k)),
}));

/**
 * Wire the registry to the engine stores. Call once from a mounted component
 * (it needs the scenario store API from React context). Subscribes to both
 * engine stores and mirrors their live revision into `current`; returns an
 * unsubscribe for cleanup.
 */
export function initDocumentRegistry(scenarioStoreApi: StoreApi<ScenarioStore>): () => void {
  scenarioApi = scenarioStoreApi;

  const refresh = (kind: DocumentKind): void => {
    const rev = liveRevision(kind);
    const state = useDocumentRegistry.getState();
    if (state.current[kind] !== rev) {
      useDocumentRegistry.setState({ current: { ...state.current, [kind]: rev } });
    }
  };

  // Seed the mirror so a document already loaded at mount reads correctly.
  useDocumentRegistry.setState({
    current: {
      scenario: liveRevision('scenario'),
      roadNetwork: liveRevision('roadNetwork'),
      catalog: liveRevision('catalog'),
      distribution: liveRevision('distribution'),
    },
  });

  const unsubScenario = scenarioStoreApi.subscribe(() => refresh('scenario'));
  const unsubRoad = getOpenDriveStoreApi().subscribe(() => refresh('roadNetwork'));
  const unsubCatalog = useCatalogStore.subscribe(() => refresh('catalog'));
  const unsubDistribution = useDistributionStore.subscribe(() => refresh('distribution'));
  return () => {
    unsubScenario();
    unsubRoad();
    unsubCatalog();
    unsubDistribution();
    scenarioApi = null;
  };
}

/**
 * The document that currently owns edit focus, for undo/redo routing. A catalog
 * modal or distribution affordance sets {@link DocumentRegistryState.focusedOverride}
 * while open; otherwise focus follows the active editor view (`editorMode`).
 */
export function getFocusedDocumentKind(): DocumentKind {
  const override = useDocumentRegistry.getState().focusedOverride;
  return override ?? useEditorStore.getState().editorMode;
}
