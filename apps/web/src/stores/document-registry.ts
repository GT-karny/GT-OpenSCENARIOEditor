/**
 * DocumentRegistry — a single source of truth for per-document dirty state.
 *
 * Dirty is a *derived* value, never a hand-set boolean: a document is dirty when
 * its engine command-history revision differs from the revision captured at the
 * last save/load. Because {@link CommandHistory.getRevision} is position-derived,
 * undoing back to the save point restores the saved revision and the document
 * reads clean again — the core value the S1 registry unlocks.
 *
 * The two engine stores expose revision differently: the OpenDRIVE store is a
 * module singleton reachable via {@link getOpenDriveStoreApi}, while the scenario
 * store lives in React context, so its API is injected once by
 * {@link initDocumentRegistry}. Both stores are subscribed and their live
 * revision mirrored into `current`, so `dirty = current !== saved` is reactive
 * and drives re-renders through ordinary Zustand selectors.
 */
import { create } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';
import type { ScenarioStore } from '@osce/scenario-engine';
import { getOpenDriveStoreApi } from '../hooks/use-opendrive-store';

// catalog / distribution join the registry in S3; scenario + roadNetwork for now.
export type DocumentKind = 'scenario' | 'roadNetwork';

const KINDS: readonly DocumentKind[] = ['scenario', 'roadNetwork'];

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
  if (kind === 'scenario') {
    return scenarioApi ? scenarioApi.getState().getCommandHistory().getRevision() : 0;
  }
  return getOpenDriveStoreApi().getState().getCommandHistory().getRevision();
}

interface DocumentRegistryState {
  /** Command-history revision captured at the last save/load, per document. */
  saved: Record<DocumentKind, number>;
  /**
   * Mirror of each engine store's live revision, kept in sync by the engine
   * subscriptions so `dirty = current !== saved` is a reactive derived value.
   */
  current: Record<DocumentKind, number>;

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
  saved: { scenario: 0, roadNetwork: 0 },
  current: { scenario: 0, roadNetwork: 0 },

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
    },
  });

  const unsubScenario = scenarioStoreApi.subscribe(() => refresh('scenario'));
  const unsubRoad = getOpenDriveStoreApi().subscribe(() => refresh('roadNetwork'));
  return () => {
    unsubScenario();
    unsubRoad();
    scenarioApi = null;
  };
}
