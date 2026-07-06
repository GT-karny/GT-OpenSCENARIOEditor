import { create } from 'zustand';
import type {
  CatalogDocument,
  CatalogEntry,
  CatalogReference,
  ParameterDeclaration,
} from '@osce/shared';
import { parseCatalogXml } from '@osce/openscenario';
import { CommandHistory } from '@osce/scenario-engine';
import {
  AddEntryCommand,
  UpdateEntryCommand,
  RemoveEntryCommand,
  DuplicateEntryCommand,
  UpdateCatalogNameCommand,
  UnloadCatalogCommand,
} from './catalog-commands';
import type { CatalogCommand } from './catalog-commands';
import { useDocumentRegistry } from './document-registry';

export interface ResolvedCatalogEntry {
  catalogType: CatalogEntry['catalogType'];
  definition: CatalogEntry['definition'];
  parameterDeclarations: ParameterDeclaration[];
}

/** One entry per executed command: the history revision it produced + its catalog. */
interface CatalogEditLogEntry {
  id: number;
  name: string;
}

export interface CatalogState {
  /** Loaded catalog documents keyed by catalogName */
  catalogs: Map<string, CatalogDocument>;

  /** Raw XML strings keyed by catalogName, used for lossless simulation */
  rawXmls: Map<string, string>;

  /**
   * Per-catalog edit trail: for each executed command, the history revision it
   * produced and the catalog it touched. Enables per-catalog derived dirty over
   * a single shared history (a kind-level markSaved would clean *all* catalogs).
   */
  editLog: CatalogEditLogEntry[];

  /** Revision each catalog was last saved/loaded at, keyed by catalogName. */
  savedEditIds: Map<string, number>;

  /** Whether the catalog editor modal is open */
  editorOpen: boolean;

  /** Currently selected catalog name in the editor */
  selectedCatalogName: string | null;

  /** Currently selected entry index in the editor */
  selectedEntryIndex: number | null;

  // --- Command history ---
  getCommandHistory: () => CommandHistory;
  undoCatalog: () => void;
  redoCatalog: () => void;

  // --- Modal ---
  openEditor: () => void;
  closeEditor: () => void;

  // --- Catalog I/O ---
  loadCatalog: (xml: string, sourcePath?: string) => CatalogDocument;
  unloadCatalog: (catalogName: string) => void;

  // --- Selection ---
  selectCatalog: (name: string | null) => void;
  selectEntry: (index: number | null) => void;

  // --- Entry CRUD ---
  addEntry: (catalogName: string, entry: CatalogEntry) => void;
  updateEntry: (catalogName: string, index: number, entry: CatalogEntry) => void;
  removeEntry: (catalogName: string, index: number) => void;
  duplicateEntry: (catalogName: string, index: number) => void;

  // --- Catalog metadata ---
  updateCatalogName: (oldName: string, newName: string) => void;

  // --- Per-catalog dirty ---
  /** Highest edit-log id ≤ the current position for `name` (0 when none). */
  lastEditId: (name: string) => number;
  /** True when `name`'s current edit position differs from its last save/load. */
  isCatalogDirty: (name: string) => boolean;
  /** Names present in the catalogs Map whose in-memory state diverges from disk. */
  dirtyCatalogNames: () => string[];
  /** Record `name` as saved at its current revision and re-baseline the kind. */
  markCatalogSaved: (name: string) => void;

  // --- Resolution ---
  resolveReference: (ref: CatalogReference) => ResolvedCatalogEntry | null;
  getCatalogNames: () => string[];
  getEntryNames: (catalogName: string) => string[];

  // --- Reset ---
  resetAll: () => void;
}

// One shared history for all catalogs; per-catalog dirty is derived from editLog
// (see design D1). resetAll clears it — the reset path tests rely on.
const commandHistory = new CommandHistory();

export const useCatalogStore = create<CatalogState>((set, get) => {
  /**
   * Run a catalog command through the shared history and record its revision in
   * the edit log. Pruning the redo-branch entries first keeps `lastEditId`
   * correct after an undo-then-edit discards a future (ids are never reused).
   */
  const executeCatalogCommand = (cmd: CatalogCommand): void => {
    const before = commandHistory.getRevision();
    set((state) => ({ editLog: state.editLog.filter((e) => e.id <= before) }));
    commandHistory.execute(cmd);
    set((state) => ({
      editLog: [...state.editLog, { id: commandHistory.getRevision(), name: cmd.catalogName }],
    }));
  };

  /**
   * Re-baseline the kind-level registry revision when the catalog set matches
   * disk (nothing dirty), clearing the 'catalog' dirty indicator. Called after
   * load / save / unload — never on undo/redo (a saved kind must go dirty again
   * when the user undoes past the save point).
   */
  const maybeRebaselineCatalogKind = (): void => {
    if (get().dirtyCatalogNames().length === 0) {
      useDocumentRegistry.getState().markSaved('catalog');
    }
  };

  return {
    catalogs: new Map(),
    rawXmls: new Map(),
    editLog: [],
    savedEditIds: new Map(),
    editorOpen: false,
    selectedCatalogName: null,
    selectedEntryIndex: null,

    getCommandHistory: () => commandHistory,

    undoCatalog: () => {
      commandHistory.undo();
      // The revision moved even if the command no-op'd (target catalog gone);
      // nudge subscribers so the registry mirror re-reads the new revision.
      set((s) => ({ editLog: s.editLog }));
    },
    redoCatalog: () => {
      commandHistory.redo();
      set((s) => ({ editLog: s.editLog }));
    },

    openEditor: () => set({ editorOpen: true }),
    closeEditor: () => set({ editorOpen: false }),

    loadCatalog: (xml, sourcePath) => {
      // Loading is additive (not a document replacement), so it is NOT a command
      // and must NOT clear the shared history — that would falsely clean another
      // catalog's edits. A reload over a dirty catalog reads clean (revert-to-disk)
      // because savedEditId is snapped to the catalog's current position.
      const doc = parseCatalogXml(xml);
      if (sourcePath) doc._sourcePath = sourcePath;
      const savedId = get().lastEditId(doc.catalogName);
      set((state) => ({
        catalogs: new Map(state.catalogs).set(doc.catalogName, doc),
        rawXmls: new Map(state.rawXmls).set(doc.catalogName, xml),
        savedEditIds: new Map(state.savedEditIds).set(doc.catalogName, savedId),
      }));
      maybeRebaselineCatalogKind();
      return doc;
    },

    unloadCatalog: (catalogName) => {
      executeCatalogCommand(new UnloadCatalogCommand(catalogName, get, set));
      // Unloading a dirty catalog may empty the dirty set (its ghost is excluded).
      maybeRebaselineCatalogKind();
    },

    selectCatalog: (name) => set({ selectedCatalogName: name, selectedEntryIndex: null }),
    selectEntry: (index) => set({ selectedEntryIndex: index }),

    addEntry: (catalogName, entry) => {
      executeCatalogCommand(new AddEntryCommand(catalogName, entry, get, set));
    },

    updateEntry: (catalogName, index, entry) => {
      executeCatalogCommand(new UpdateEntryCommand(catalogName, index, entry, get, set));
    },

    removeEntry: (catalogName, index) => {
      executeCatalogCommand(new RemoveEntryCommand(catalogName, index, get, set));
    },

    duplicateEntry: (catalogName, index) => {
      executeCatalogCommand(new DuplicateEntryCommand(catalogName, index, get, set));
    },

    updateCatalogName: (oldName, newName) => {
      if (oldName === newName) return;
      executeCatalogCommand(new UpdateCatalogNameCommand(oldName, newName, get, set));
    },

    lastEditId: (name) => {
      const rev = commandHistory.getRevision();
      let max = 0;
      for (const e of get().editLog) {
        if (e.name === name && e.id <= rev && e.id > max) max = e.id;
      }
      return max;
    },

    isCatalogDirty: (name) => get().lastEditId(name) !== (get().savedEditIds.get(name) ?? 0),

    dirtyCatalogNames: () => {
      const state = get();
      return Array.from(state.catalogs.keys()).filter((name) => state.isCatalogDirty(name));
    },

    markCatalogSaved: (name) => {
      const savedId = get().lastEditId(name);
      set((state) => ({ savedEditIds: new Map(state.savedEditIds).set(name, savedId) }));
      maybeRebaselineCatalogKind();
    },

    resolveReference: (ref) => {
      const doc = get().catalogs.get(ref.catalogName);
      if (!doc) return null;
      const entry = doc.entries.find((e) => e.definition.name === ref.entryName);
      if (!entry) return null;
      return {
        catalogType: entry.catalogType,
        definition: entry.definition,
        parameterDeclarations:
          'parameterDeclarations' in entry.definition ? (entry.definition.parameterDeclarations ?? []) : [],
      };
    },

    getCatalogNames: () => Array.from(get().catalogs.keys()),

    getEntryNames: (catalogName) => {
      const doc = get().catalogs.get(catalogName);
      if (!doc) return [];
      return doc.entries.map((e) => e.definition.name);
    },

    resetAll: () => {
      commandHistory.clear();
      set({
        catalogs: new Map(),
        rawXmls: new Map(),
        editLog: [],
        savedEditIds: new Map(),
        editorOpen: false,
        selectedCatalogName: null,
        selectedEntryIndex: null,
      });
      useDocumentRegistry.getState().markLoaded('catalog');
    },
  };
});
