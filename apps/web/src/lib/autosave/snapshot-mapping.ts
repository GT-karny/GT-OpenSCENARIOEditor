import type {
  OpenDriveDocument,
  ParameterValueDistributionDocument,
  ScenarioDocument,
} from '@osce/shared';
import { createDefaultDocument } from '@osce/scenario-engine';
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
  // D6c: a snapshot written by a different build may carry an _editor metadata
  // format the current app no longer maps cleanly. We still restore as-is (best
  // effort), but warn so a format drift is visible. The current default is read
  // from a throwaway default document because the metadata factory itself is not
  // individually exported from @osce/scenario-engine.
  const currentFormatVersion = createDefaultDocument()._editor.formatVersion;
  const snapshotFormatVersion = snapshot.scenario._editor?.formatVersion;
  if (snapshotFormatVersion !== currentFormatVersion) {
    console.warn(
      `autosave snapshot _editor.formatVersion ${snapshotFormatVersion} differs from current ${currentFormatVersion}; restoring as-is`,
    );
  }
  targets.loadScenario(snapshot.scenario);
  targets.setOpenDrive(snapshot.opendrive);
  targets.restoreCatalogs(snapshot.catalogs);
  targets.restoreDistribution(snapshot.distribution);
  targets.setFileName(snapshot.fileName);
  targets.markDirty();
}
