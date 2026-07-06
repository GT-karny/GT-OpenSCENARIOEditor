import type {
  OpenDriveDocument,
  ParameterValueDistributionDocument,
  ScenarioDocument,
} from '@osce/shared';
import type { AutosaveCatalogEntry, AutosaveSnapshot, AutosaveSnapshotV1 } from './types';

/** Inputs needed to build a snapshot from the current editor state. */
export interface SnapshotSource {
  scenario: ScenarioDocument;
  opendrive: OpenDriveDocument | null;
  catalogs: AutosaveCatalogEntry[];
  distribution: ParameterValueDistributionDocument | null;
  fileName: string | null;
}

/**
 * Build a v2 snapshot record from the current editor state.
 *
 * `savedAt` is injected (defaulting to now) so callers and tests can control the
 * timestamp deterministically.
 */
export function buildSnapshot(
  source: SnapshotSource,
  savedAt: number = Date.now(),
): AutosaveSnapshot {
  return {
    version: 2,
    savedAt,
    scenario: source.scenario,
    opendrive: source.opendrive,
    catalogs: source.catalogs,
    distribution: source.distribution,
    fileName: source.fileName,
  };
}

/**
 * Normalize a stored snapshot to the current (v2) envelope. A v1 record predates
 * catalog/distribution capture and carries no `version` field, so it migrates to
 * v2 with empty catalogs and no distribution. Exported for the recovery read path
 * and unit tests.
 */
export function migrateSnapshot(raw: AutosaveSnapshot | AutosaveSnapshotV1): AutosaveSnapshot {
  if ('version' in raw && raw.version === 2) return raw;
  return { ...(raw as AutosaveSnapshotV1), version: 2, catalogs: [], distribution: null };
}

/** Sinks used to apply a recovered snapshot back into the editor stores. */
export interface RestoreTargets {
  /** Replace the scenario document (scenario store's loadDocument). */
  loadScenario: (document: ScenarioDocument) => void;
  /** Replace the OpenDRIVE document, or clear it when null. */
  setOpenDrive: (document: OpenDriveDocument | null) => void;
  /** Repopulate the catalog store from the recovered documents. */
  restoreCatalogs: (entries: AutosaveCatalogEntry[]) => void;
  /** Restore the distribution side-document, or leave empty when null. */
  restoreDistribution: (document: ParameterValueDistributionDocument | null) => void;
  /** Restore the file name shown in the editor. */
  setFileName: (name: string | null) => void;
  /** Mark the restored documents dirty — recovered work is unsaved by definition. */
  markDirty: () => void;
}

/**
 * Apply a recovered snapshot to the editor.
 *
 * Each document is restored the same way a freshly opened file is: by handing it
 * to the owning store. After restoring, the editor is marked dirty because the
 * recovered state was, by definition, never saved.
 */
export function applySnapshot(snapshot: AutosaveSnapshot, targets: RestoreTargets): void {
  targets.loadScenario(snapshot.scenario);
  targets.setOpenDrive(snapshot.opendrive);
  targets.restoreCatalogs(snapshot.catalogs);
  targets.restoreDistribution(snapshot.distribution);
  targets.setFileName(snapshot.fileName);
  targets.markDirty();
}
