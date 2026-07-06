/**
 * Undoable commands for the catalog store.
 *
 * Each command captures the affected catalog document (and its lossless rawXml)
 * before mutating, then restores them on undo via immutable Map replacement —
 * the same before/after capture pattern the scenario-engine commands use. The
 * mutations mirror the previous hand-written store actions exactly (selection
 * side-effects included), so component behavior is unchanged; the only addition
 * is reversibility.
 *
 * Commands are defensive: if the target catalog is absent (e.g. undoing an edit
 * after the catalog was unloaded), execute/undo no-op instead of throwing or
 * resurrecting a document. {@link UnloadCatalogCommand} is the deliberate
 * exception — its undo restores the removed catalog.
 */
import { BaseCommand } from '@osce/scenario-engine';
import type { StoreApi } from 'zustand';
import type { CatalogDocument, CatalogEntry } from '@osce/shared';
import type { CatalogState } from './catalog-store';

type GetState = StoreApi<CatalogState>['getState'];
type SetState = StoreApi<CatalogState>['setState'];

/** A catalog command tags every history entry with the catalog it mutated. */
export type CatalogCommand = BaseCommand & { readonly catalogName: string };

function mapSet<V>(m: Map<string, V>, key: string, value: V): Map<string, V> {
  const next = new Map(m);
  next.set(key, value);
  return next;
}

function mapDelete<V>(m: Map<string, V>, key: string): Map<string, V> {
  const next = new Map(m);
  next.delete(key);
  return next;
}

/** Restore a name→rawXml entry to its captured value (absent stays absent). */
function restoreRawXml(
  rawXmls: Map<string, string>,
  name: string,
  captured: string | undefined,
): Map<string, string> {
  return captured === undefined ? mapDelete(rawXmls, name) : mapSet(rawXmls, name, captured);
}

/**
 * Shared base for the entry-level mutations (add / update / remove / duplicate).
 * Subclasses only describe how to derive the next document and selection; the
 * base handles rawXml invalidation on execute and full restore on undo.
 */
abstract class CatalogEntryCommand extends BaseCommand {
  private prevDoc: CatalogDocument | undefined;
  private prevRawXml: string | undefined;
  private prevSelectedEntryIndex: number | null = null;

  constructor(
    readonly catalogName: string,
    protected readonly get: GetState,
    protected readonly set: SetState,
    description: string,
  ) {
    super(description);
  }

  /**
   * Derive the mutated document and (optionally) the new selected entry index,
   * or `null` to abort the command (e.g. an out-of-range index) as a no-op.
   */
  protected abstract mutate(
    doc: CatalogDocument,
    state: CatalogState,
  ): { nextDoc: CatalogDocument; selectedEntryIndex?: number | null } | null;

  execute(): void {
    const state = this.get();
    const doc = state.catalogs.get(this.catalogName);
    if (!doc) return;
    const result = this.mutate(doc, state);
    if (!result) return;
    this.prevDoc = doc;
    this.prevRawXml = state.rawXmls.get(this.catalogName);
    this.prevSelectedEntryIndex = state.selectedEntryIndex;
    const updates: Partial<CatalogState> = {
      catalogs: mapSet(state.catalogs, this.catalogName, result.nextDoc),
      // The verbatim rawXml no longer matches the mutated model — drop it so
      // simulation re-serializes (undo restores it, returning the lossless path).
      rawXmls: mapDelete(state.rawXmls, this.catalogName),
    };
    if (result.selectedEntryIndex !== undefined) {
      updates.selectedEntryIndex = result.selectedEntryIndex;
    }
    this.set(updates);
  }

  undo(): void {
    const state = this.get();
    // Defensive: never resurrect a catalog removed by another path.
    if (!this.prevDoc || !state.catalogs.has(this.catalogName)) return;
    this.set({
      catalogs: mapSet(state.catalogs, this.catalogName, this.prevDoc),
      rawXmls: restoreRawXml(state.rawXmls, this.catalogName, this.prevRawXml),
      selectedEntryIndex: this.prevSelectedEntryIndex,
    });
  }
}

export class AddEntryCommand extends CatalogEntryCommand {
  constructor(catalogName: string, private readonly entry: CatalogEntry, get: GetState, set: SetState) {
    super(catalogName, get, set, 'Add catalog entry');
  }

  protected mutate(doc: CatalogDocument) {
    return {
      nextDoc: { ...doc, entries: [...doc.entries, this.entry] },
      selectedEntryIndex: doc.entries.length,
    };
  }
}

export class UpdateEntryCommand extends CatalogEntryCommand {
  constructor(
    catalogName: string,
    private readonly index: number,
    private readonly entry: CatalogEntry,
    get: GetState,
    set: SetState,
  ) {
    super(catalogName, get, set, 'Update catalog entry');
  }

  protected mutate(doc: CatalogDocument) {
    if (this.index < 0 || this.index >= doc.entries.length) return null;
    const entries = [...doc.entries];
    entries[this.index] = this.entry;
    return { nextDoc: { ...doc, entries } };
  }
}

export class RemoveEntryCommand extends CatalogEntryCommand {
  constructor(catalogName: string, private readonly index: number, get: GetState, set: SetState) {
    super(catalogName, get, set, 'Remove catalog entry');
  }

  protected mutate(doc: CatalogDocument, state: CatalogState) {
    if (this.index < 0 || this.index >= doc.entries.length) return null;
    const entries = doc.entries.filter((_, i) => i !== this.index);
    let selectedEntryIndex = state.selectedEntryIndex;
    if (state.selectedEntryIndex === this.index) {
      selectedEntryIndex = entries.length > 0 ? Math.min(this.index, entries.length - 1) : null;
    } else if (state.selectedEntryIndex !== null && state.selectedEntryIndex > this.index) {
      selectedEntryIndex = state.selectedEntryIndex - 1;
    }
    return { nextDoc: { ...doc, entries }, selectedEntryIndex };
  }
}

export class DuplicateEntryCommand extends CatalogEntryCommand {
  constructor(catalogName: string, private readonly index: number, get: GetState, set: SetState) {
    super(catalogName, get, set, 'Duplicate catalog entry');
  }

  protected mutate(doc: CatalogDocument) {
    if (this.index < 0 || this.index >= doc.entries.length) return null;
    const original = doc.entries[this.index];
    const cloned: CatalogEntry = {
      ...original,
      definition: { ...original.definition, name: `${original.definition.name}_copy` },
    } as CatalogEntry;
    const entries = [...doc.entries];
    entries.splice(this.index + 1, 0, cloned);
    return { nextDoc: { ...doc, entries }, selectedEntryIndex: this.index + 1 };
  }
}

/**
 * Rename a catalog (its Map key). The history entry is tagged with the *new*
 * name so per-catalog dirty tracks the renamed catalog going forward; the old
 * name's history becomes an excluded ghost (it is no longer in the catalogs Map).
 */
export class UpdateCatalogNameCommand extends BaseCommand {
  readonly catalogName: string;
  private prevDoc: CatalogDocument | undefined;
  private prevRawXml: string | undefined;
  private prevSelectedCatalogName: string | null = null;

  constructor(
    private readonly oldName: string,
    newName: string,
    private readonly get: GetState,
    private readonly set: SetState,
  ) {
    super('Rename catalog');
    this.catalogName = newName;
  }

  execute(): void {
    const state = this.get();
    const doc = state.catalogs.get(this.oldName);
    if (!doc) return;
    this.prevDoc = doc;
    this.prevRawXml = state.rawXmls.get(this.oldName);
    this.prevSelectedCatalogName = state.selectedCatalogName;
    const catalogs = mapSet(mapDelete(state.catalogs, this.oldName), this.catalogName, {
      ...doc,
      catalogName: this.catalogName,
    });
    this.set({
      catalogs,
      rawXmls: mapDelete(state.rawXmls, this.oldName),
      selectedCatalogName:
        state.selectedCatalogName === this.oldName ? this.catalogName : state.selectedCatalogName,
    });
  }

  undo(): void {
    const state = this.get();
    if (!this.prevDoc || !state.catalogs.has(this.catalogName)) return;
    const catalogs = mapSet(mapDelete(state.catalogs, this.catalogName), this.oldName, this.prevDoc);
    this.set({
      catalogs,
      rawXmls: restoreRawXml(mapDelete(state.rawXmls, this.catalogName), this.oldName, this.prevRawXml),
      selectedCatalogName: this.prevSelectedCatalogName,
    });
  }
}

/**
 * Unload a catalog (remove it and its rawXml, clearing selection if it matched).
 * Undo restores both the document and its lossless rawXml — closing a catalog is
 * a loss of in-memory content, so it must be reversible.
 */
export class UnloadCatalogCommand extends BaseCommand {
  private prevDoc: CatalogDocument | undefined;
  private prevRawXml: string | undefined;
  private prevSelectedCatalogName: string | null = null;
  private prevSelectedEntryIndex: number | null = null;

  constructor(
    readonly catalogName: string,
    private readonly get: GetState,
    private readonly set: SetState,
  ) {
    super('Unload catalog');
  }

  execute(): void {
    const state = this.get();
    const doc = state.catalogs.get(this.catalogName);
    if (!doc) return;
    this.prevDoc = doc;
    this.prevRawXml = state.rawXmls.get(this.catalogName);
    this.prevSelectedCatalogName = state.selectedCatalogName;
    this.prevSelectedEntryIndex = state.selectedEntryIndex;
    const updates: Partial<CatalogState> = {
      catalogs: mapDelete(state.catalogs, this.catalogName),
      rawXmls: mapDelete(state.rawXmls, this.catalogName),
    };
    if (state.selectedCatalogName === this.catalogName) {
      updates.selectedCatalogName = null;
      updates.selectedEntryIndex = null;
    }
    this.set(updates);
  }

  undo(): void {
    if (!this.prevDoc) return;
    const state = this.get();
    this.set({
      catalogs: mapSet(state.catalogs, this.catalogName, this.prevDoc),
      rawXmls: restoreRawXml(state.rawXmls, this.catalogName, this.prevRawXml),
      selectedCatalogName: this.prevSelectedCatalogName,
      selectedEntryIndex: this.prevSelectedEntryIndex,
    });
  }
}
