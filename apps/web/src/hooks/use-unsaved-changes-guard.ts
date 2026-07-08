import { useEffect } from 'react';
import { useDocumentRegistry } from '../stores/document-registry';
import { useFileOperations } from './use-file-operations';
import { useCatalogOperations } from './use-catalog-operations';

/** True when any registered document (scenario or road network) has unsaved edits. */
function hasUnsavedChanges(): boolean {
  return useDocumentRegistry.getState().anyDirty();
}

/**
 * Blocks accidental data loss from unsaved changes.
 *
 * - Web: a standard `beforeunload` handler prompts the browser's native
 *   "Leave site?" dialog when the document is dirty.
 * - Electron: cooperates with the main-process close guard — it reports the
 *   dirty state on request and runs the save flow when the user chooses "Save".
 *
 * The dirty flag is read imperatively via `getState()` so this adds no
 * re-render subscription.
 */
export function useUnsavedChangesGuard(): void {
  const { saveXosc, saveXodr, saveDistribution } = useFileOperations();
  const { saveAllDirtyCatalogs } = useCatalogOperations();

  // Web: beforeunload guard.
  useEffect(() => {
    if (window.electronAPI?.isElectron) return;

    const handler = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges()) return;
      event.preventDefault();
      // Legacy requirement for some browsers to trigger the prompt.
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Electron: respond to the main-process close guard.
  useEffect(() => {
    const electron = window.electronAPI;
    if (!electron?.isElectron) return;

    const offCloseRequested = electron.onCloseRequested(() => {
      electron.respondCloseDecision(hasUnsavedChanges());
    });

    const offRunSave = electron.onRunSave(() => {
      void (async () => {
        try {
          // Any of the four documents may be dirty at once (e.g. edited scenario
          // + road network + catalog + distribution). Save each dirty document in
          // turn; a single mode-specific save would leave the others dirty and the
          // window would never close.
          //
          // Cancellation is detected via the per-document derived dirty state: a
          // successful save captures a new saved revision (markSaved) and the
          // document reads clean, whereas a cancelled picker leaves it dirty. If
          // a save leaves its document dirty, the user cancelled — abort
          // immediately and report failure. Catalog/distribution also return a
          // boolean, which is checked alongside the re-check.
          const registry = useDocumentRegistry.getState();
          if (registry.isDirty('scenario')) {
            await saveXosc();
            if (registry.isDirty('scenario')) {
              electron.respondSaveComplete(false);
              return;
            }
          }
          if (registry.isDirty('roadNetwork')) {
            await saveXodr();
            if (registry.isDirty('roadNetwork')) {
              electron.respondSaveComplete(false);
              return;
            }
          }
          if (registry.isDirty('catalog')) {
            const ok = await saveAllDirtyCatalogs();
            if (!ok || registry.isDirty('catalog')) {
              electron.respondSaveComplete(false);
              return;
            }
          }
          if (registry.isDirty('distribution')) {
            const ok = await saveDistribution();
            if (!ok || registry.isDirty('distribution')) {
              electron.respondSaveComplete(false);
              return;
            }
          }
          // Treat success as "no longer dirty". If the save was cancelled or
          // failed, the dirty flag stays set and we keep the window open.
          electron.respondSaveComplete(!hasUnsavedChanges());
        } catch {
          electron.respondSaveComplete(false);
        }
      })();
    });

    return () => {
      offCloseRequested();
      offRunSave();
    };
  }, [saveXosc, saveXodr, saveAllDirtyCatalogs, saveDistribution]);
}
