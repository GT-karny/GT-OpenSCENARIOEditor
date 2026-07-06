import type {
  CatalogDocument,
  OpenDriveDocument,
  ParameterValueDistributionDocument,
  ScenarioDocument,
} from '@osce/shared';

/** One recovered catalog: its name, parsed document, and optional source path. */
export interface AutosaveCatalogEntry {
  name: string;
  doc: CatalogDocument;
  sourcePath?: string;
}

/**
 * A single autosave snapshot (v2 envelope). Persisted as one rolling record
 * under a fixed key in IndexedDB so that recovery only ever has to deal with the
 * most recent state.
 *
 * Every field is plain, structuredClone-compatible data (no class instances,
 * functions, or DOM nodes), which is what IndexedDB's structured-clone
 * serialization requires.
 */
export interface AutosaveSnapshot {
  /**
   * Envelope schema version. v1 records had no `version` field and no
   * catalogs/distribution; they are migrated to this shape on read
   * (see {@link migrateSnapshot}).
   */
  version: 2;
  /** Epoch milliseconds at which the snapshot was written. */
  savedAt: number;
  /** The scenario document at snapshot time. */
  scenario: ScenarioDocument;
  /** The loaded OpenDRIVE document, or null when no road network is loaded. */
  opendrive: OpenDriveDocument | null;
  /** Loaded catalog documents (empty when none were open). */
  catalogs: AutosaveCatalogEntry[];
  /** The distribution side-document, or null when none exists. */
  distribution: ParameterValueDistributionDocument | null;
  /** The current file name (.xosc), or null for an unsaved document. */
  fileName: string | null;
}

/**
 * The pre-versioning (v1) snapshot shape, retained for migration typing. A
 * stored record with no `version` field is read as this and migrated to
 * {@link AutosaveSnapshot}.
 */
export interface AutosaveSnapshotV1 {
  savedAt: number;
  scenario: ScenarioDocument;
  opendrive: OpenDriveDocument | null;
  fileName: string | null;
}
