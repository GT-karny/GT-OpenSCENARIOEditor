import type { ScenarioDocument, OpenDriveDocument } from '@osce/shared';
import type { AutosaveSnapshot } from './types';

/** Inputs needed to build a snapshot from the current editor state. */
export interface SnapshotSource {
  scenario: ScenarioDocument;
  opendrive: OpenDriveDocument | null;
  fileName: string | null;
}

/**
 * Build a snapshot record from the current editor state.
 *
 * `savedAt` is injected (defaulting to now) so callers and tests can control the
 * timestamp deterministically.
 */
export function buildSnapshot(source: SnapshotSource, savedAt: number = Date.now()): AutosaveSnapshot {
  return {
    savedAt,
    scenario: source.scenario,
    opendrive: source.opendrive,
    fileName: source.fileName,
  };
}

/** Sinks used to apply a recovered snapshot back into the editor stores. */
export interface RestoreTargets {
  /** Replace the scenario document (scenario store's loadDocument). */
  loadScenario: (document: ScenarioDocument) => void;
  /** Replace the OpenDRIVE document, or clear it when null. */
  setOpenDrive: (document: OpenDriveDocument | null) => void;
  /** Restore the file name shown in the editor. */
  setFileName: (name: string | null) => void;
  /** Mark the editor dirty — restored work is unsaved by definition. */
  markDirty: () => void;
}

/**
 * Apply a recovered snapshot to the editor.
 *
 * The OpenDRIVE document is restored the same way a freshly opened `.xodr` is:
 * by handing it to the editor store's road-network setter. The RoadNetwork
 * editor's own effect then syncs it into the opendrive-engine store. After
 * restoring, the editor is marked dirty because the recovered state was, by
 * definition, never saved.
 */
export function applySnapshot(snapshot: AutosaveSnapshot, targets: RestoreTargets): void {
  targets.loadScenario(snapshot.scenario);
  targets.setOpenDrive(snapshot.opendrive);
  targets.setFileName(snapshot.fileName);
  targets.markDirty();
}
