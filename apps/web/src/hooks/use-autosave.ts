import { useEffect, useRef, useState, useCallback } from 'react';
import type { ScenarioDocument, OpenDriveDocument } from '@osce/shared';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';
import {
  readSnapshot,
  writeSnapshot,
  deleteSnapshot,
  buildSnapshot,
  applySnapshot,
  DebounceScheduler,
  type AutosaveSnapshot,
} from '../lib/autosave';

/** Quiet period after the last edit before a snapshot is written. */
const DEBOUNCE_MS = 2_000;
/** Hard ceiling: snapshot at least this often during continuous editing. */
const MAX_WAIT_MS = 30_000;

export interface UseAutosaveResult {
  /** The snapshot found at startup, or null when there is nothing to recover. */
  recoverySnapshot: AutosaveSnapshot | null;
  /** Restore the recovered snapshot into the editor and dismiss the dialog. */
  restore: () => void;
  /** Discard the recovered snapshot and dismiss the dialog. */
  discard: () => void;
}

/**
 * Autosave with crash recovery. Mount once (in EditorLayout).
 *
 * - Snapshots the scenario + OpenDRIVE documents to IndexedDB while the editor
 *   is dirty and the autoSave preference is on, debounced 2s after the last
 *   change with a 30s max-wait so long editing sessions still checkpoint.
 * - Deletes the snapshot when the editor transitions from dirty to clean (a save
 *   completed, or a fresh document was loaded), keeping recovery self-contained.
 * - On first mount, reads any leftover snapshot. Because the snapshot is always
 *   cleared on a clean transition, any snapshot present at startup means the
 *   previous session ended uncleanly — so it is offered for recovery with no
 *   extra heuristic.
 *
 * Writes never throw into the UI: failures are caught and logged once.
 */
export function useAutosave(): UseAutosaveResult {
  const scenarioStoreApi = useScenarioStoreApi();
  const [recoverySnapshot, setRecoverySnapshot] = useState<AutosaveSnapshot | null>(null);

  // Latest documents, tracked imperatively (no React re-renders for autosave).
  const scenarioRef = useRef<ScenarioDocument>(scenarioStoreApi.getState().document);
  const opendriveRef = useRef<OpenDriveDocument | null>(useEditorStore.getState().roadNetwork);

  // --- Recovery read on first mount ---
  useEffect(() => {
    let cancelled = false;
    readSnapshot()
      .then((snapshot) => {
        if (!cancelled && snapshot) setRecoverySnapshot(snapshot);
      })
      .catch((err) => {
        console.error('[autosave] failed to read recovery snapshot', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Snapshot writer + debounce scheduler ---
  useEffect(() => {
    let loggedWriteError = false;

    const writeNow = (): void => {
      // Re-check the guard at flush time, not just at schedule time.
      const { isDirty, preferences, roadNetwork, currentFileName } = useEditorStore.getState();
      if (!isDirty || !preferences.autoSave) return;

      const snapshot = buildSnapshot({
        scenario: scenarioRef.current,
        opendrive: roadNetwork ?? opendriveRef.current,
        fileName: currentFileName,
      });
      writeSnapshot(snapshot).catch((err) => {
        if (!loggedWriteError) {
          loggedWriteError = true;
          console.error('[autosave] failed to write snapshot', err);
        }
      });
    };

    const scheduler = new DebounceScheduler({
      debounceMs: DEBOUNCE_MS,
      maxWaitMs: MAX_WAIT_MS,
      flush: writeNow,
    });

    const onChange = (): void => {
      const { isDirty, preferences } = useEditorStore.getState();
      if (!isDirty || !preferences.autoSave) return;
      scheduler.schedule();
    };

    // Subscribe to the scenario document (imperative — does not re-render).
    const unsubScenario = scenarioStoreApi.subscribe((state) => {
      if (state.document !== scenarioRef.current) {
        scenarioRef.current = state.document;
        onChange();
      }
    });

    // Subscribe to the OpenDRIVE document + dirty transitions on the editor store.
    let prevDirty = useEditorStore.getState().isDirty;
    const unsubEditor = useEditorStore.subscribe((state) => {
      if (state.roadNetwork !== opendriveRef.current) {
        opendriveRef.current = state.roadNetwork;
        onChange();
      }
      // Clear the snapshot when dirty transitions true -> false.
      if (prevDirty && !state.isDirty) {
        scheduler.cancel();
        deleteSnapshot().catch((err) => {
          console.error('[autosave] failed to clear snapshot', err);
        });
      }
      prevDirty = state.isDirty;
    });

    return () => {
      unsubScenario();
      unsubEditor();
      scheduler.cancel();
    };
  }, [scenarioStoreApi]);

  // --- Recovery actions ---
  const restore = useCallback(() => {
    const snapshot = recoverySnapshot;
    if (!snapshot) return;
    applySnapshot(snapshot, {
      loadScenario: (document) => scenarioStoreApi.getState().loadDocument(document),
      // Mirror the .xodr open path: the RoadNetwork editor effect syncs this
      // into the opendrive-engine store from editorStore.roadNetwork.
      setOpenDrive: (document) => useEditorStore.getState().setRoadNetwork(document, null),
      setFileName: (name) => useEditorStore.getState().setCurrentFileName(name),
      // Restored work is unsaved by definition; keep the snapshot until the next
      // clean transition deletes it.
      markDirty: () => useEditorStore.getState().setDirty(true),
    });
    // Keep refs in sync so the restore itself does not trigger an immediate write.
    scenarioRef.current = scenarioStoreApi.getState().document;
    opendriveRef.current = useEditorStore.getState().roadNetwork;
    setRecoverySnapshot(null);
  }, [recoverySnapshot, scenarioStoreApi]);

  const discard = useCallback(() => {
    setRecoverySnapshot(null);
    deleteSnapshot().catch((err) => {
      console.error('[autosave] failed to discard snapshot', err);
    });
  }, []);

  return { recoverySnapshot, restore, discard };
}
