import type { ScenarioDocument, OpenDriveDocument } from '@osce/shared';

/**
 * A single autosave snapshot. Persisted as one rolling record under a fixed key
 * in IndexedDB so that recovery only ever has to deal with the most recent state.
 *
 * The documents are stored as-is; both ScenarioDocument and OpenDriveDocument are
 * plain, structuredClone-compatible data (no class instances, functions, or DOM
 * nodes), which is what IndexedDB's structured-clone serialization requires.
 */
export interface AutosaveSnapshot {
  /** Epoch milliseconds at which the snapshot was written. */
  savedAt: number;
  /** The scenario document at snapshot time. */
  scenario: ScenarioDocument;
  /** The loaded OpenDRIVE document, or null when no road network is loaded. */
  opendrive: OpenDriveDocument | null;
  /** The current file name (.xosc), or null for an unsaved document. */
  fileName: string | null;
}
