import { create } from 'zustand';
import type {
  CatalogDocument,
  CatalogEntry,
  CatalogReference,
  ParameterDeclaration,
} from '@osce/shared';
import { parseCatalogXml } from '@osce/openscenario';

export interface ResolvedCatalogEntry {
  catalogType: CatalogEntry['catalogType'];
  definition: CatalogEntry['definition'];
  parameterDeclarations: ParameterDeclaration[];
}

export interface CatalogState {
  /** Loaded catalog documents keyed by catalogName */
  catalogs: Map<string, CatalogDocument>;

  /** Whether the catalog editor modal is open */
  editorOpen: boolean;

  /** Currently selected catalog name in the editor */
  selectedCatalogName: string | null;

  /** Currently selected entry index in the editor */
  selectedEntryIndex: number | null;

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

  // --- Resolution ---
  resolveReference: (ref: CatalogReference) => ResolvedCatalogEntry | null;
  getCatalogNames: () => string[];
  getEntryNames: (catalogName: string) => string[];
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  catalogs: new Map(),
  editorOpen: false,
  selectedCatalogName: null,
  selectedEntryIndex: null,

  openEditor: () => set({ editorOpen: true }),
  closeEditor: () => set({ editorOpen: false }),

  loadCatalog: (xml, sourcePath) => {
    const doc = parseCatalogXml(xml);
    if (sourcePath) doc._sourcePath = sourcePath;
    set((state) => {
      const catalogs = new Map(state.catalogs);
      catalogs.set(doc.catalogName, doc);
      return { catalogs };
    });
    return doc;
  },

  unloadCatalog: (catalogName) => {
    set((state) => {
      const catalogs = new Map(state.catalogs);
      catalogs.delete(catalogName);
      const updates: Partial<CatalogState> = { catalogs };
      if (state.selectedCatalogName === catalogName) {
        updates.selectedCatalogName = null;
        updates.selectedEntryIndex = null;
      }
      return updates;
    });
  },

  selectCatalog: (name) => set({ selectedCatalogName: name, selectedEntryIndex: null }),
  selectEntry: (index) => set({ selectedEntryIndex: index }),

  addEntry: (catalogName, entry) => {
    set((state) => {
      const catalogs = new Map(state.catalogs);
      const doc = catalogs.get(catalogName);
      if (!doc) return state;
      catalogs.set(catalogName, {
        ...doc,
        entries: [...doc.entries, entry],
      });
      return { catalogs, selectedEntryIndex: doc.entries.length };
    });
  },

  updateEntry: (catalogName, index, entry) => {
    set((state) => {
      const catalogs = new Map(state.catalogs);
      const doc = catalogs.get(catalogName);
      if (!doc || index < 0 || index >= doc.entries.length) return state;
      const entries = [...doc.entries];
      entries[index] = entry;
      catalogs.set(catalogName, { ...doc, entries });
      return { catalogs };
    });
  },

  removeEntry: (catalogName, index) => {
    set((state) => {
      const catalogs = new Map(state.catalogs);
      const doc = catalogs.get(catalogName);
      if (!doc || index < 0 || index >= doc.entries.length) return state;
      const entries = doc.entries.filter((_, i) => i !== index);
      catalogs.set(catalogName, { ...doc, entries });
      const updates: Partial<CatalogState> = { catalogs };
      if (state.selectedEntryIndex === index) {
        updates.selectedEntryIndex = entries.length > 0 ? Math.min(index, entries.length - 1) : null;
      } else if (state.selectedEntryIndex !== null && state.selectedEntryIndex > index) {
        updates.selectedEntryIndex = state.selectedEntryIndex - 1;
      }
      return updates;
    });
  },

  duplicateEntry: (catalogName, index) => {
    set((state) => {
      const catalogs = new Map(state.catalogs);
      const doc = catalogs.get(catalogName);
      if (!doc || index < 0 || index >= doc.entries.length) return state;
      const original = doc.entries[index];
      const cloned: CatalogEntry = {
        ...original,
        definition: {
          ...original.definition,
          name: `${original.definition.name}_copy`,
        },
      } as CatalogEntry;
      const entries = [...doc.entries];
      entries.splice(index + 1, 0, cloned);
      catalogs.set(catalogName, { ...doc, entries });
      return { catalogs, selectedEntryIndex: index + 1 };
    });
  },

  updateCatalogName: (oldName, newName) => {
    if (oldName === newName) return;
    set((state) => {
      const catalogs = new Map(state.catalogs);
      const doc = catalogs.get(oldName);
      if (!doc) return state;
      catalogs.delete(oldName);
      catalogs.set(newName, { ...doc, catalogName: newName });
      return {
        catalogs,
        selectedCatalogName: state.selectedCatalogName === oldName ? newName : state.selectedCatalogName,
      };
    });
  },

  resolveReference: (ref) => {
    const doc = get().catalogs.get(ref.catalogName);
    if (!doc) return null;
    const entry = doc.entries.find((e) => e.definition.name === ref.entryName);
    if (!entry) return null;
    return {
      catalogType: entry.catalogType,
      definition: entry.definition,
      parameterDeclarations: entry.definition.parameterDeclarations ?? [],
    };
  },

  getCatalogNames: () => Array.from(get().catalogs.keys()),

  getEntryNames: (catalogName) => {
    const doc = get().catalogs.get(catalogName);
    if (!doc) return [];
    return doc.entries.map((e) => e.definition.name);
  },
}));
