import { useRef } from 'react';
import { useCatalogOperations } from './use-catalog-operations';
import type { SaveFns } from './file-operations/core';
import { useXoscOperations } from './file-operations/use-xosc-operations';
import { useXodrOperations } from './file-operations/use-xodr-operations';

/**
 * Composition point for the file-operations surface (design doc S6 §D3).
 *
 * The xosc (scenario + distribution) and xodr (road network) save/load flows
 * used to live together in this one ~955-line hook. They are now split into
 * `useXoscOperations` and `useXodrOperations` under `./file-operations/`,
 * with shared plumbing (disk IO, the unsaved-changes guard wiring, and the
 * validation gate) factored into `./file-operations/core`.
 *
 * This file is the deliberate, permanent composition point: it calls both
 * hooks, owns the `saveFnsRef` the unsaved-changes guard reads from, and
 * merges both hooks' returns into the original `useFileOperations()` shape
 * so every existing consumer keeps working unchanged. It is NOT a shim/facade
 * slated for removal.
 */
export function useFileOperations() {
  const { saveAllDirtyCatalogs } = useCatalogOperations();

  // Holds the current save flows so the unsaved-changes guard can invoke them
  // without depending on their declaration order (they are defined below).
  const saveFnsRef = useRef<SaveFns>({
    saveXosc: async () => {},
    saveXodr: async () => {},
    saveCatalogs: async () => true,
    saveDistribution: async () => true,
  });

  const xosc = useXoscOperations({ saveFnsRef });
  const xodr = useXodrOperations({ saveFnsRef });

  // Keep the guard's save-flow reference current so it can persist on "Save"
  // without creating a declaration-order dependency on these callbacks.
  saveFnsRef.current = {
    saveXosc: xosc.saveXosc,
    saveXodr: xodr.saveXodr,
    saveCatalogs: saveAllDirtyCatalogs,
    saveDistribution: xosc.saveDistribution,
  };

  return {
    newScenario: xosc.newScenario,
    openXosc: xosc.openXosc,
    saveXosc: xosc.saveXosc,
    saveAsXosc: xosc.saveAsXosc,
    loadXodr: xodr.loadXodr,
    saveXodr: xodr.saveXodr,
    saveAsXodr: xodr.saveAsXodr,
    handleSaveAs: xosc.handleSaveAs,
    handleSaveAsXodr: xodr.handleSaveAsXodr,
    newOpenDrive: xodr.newOpenDrive,
    saveDistribution: xosc.saveDistribution,
    // Lower-level loaders shared with drag-and-drop and recent-files reopen.
    loadXoscFromRead: xosc.loadXoscFromRead,
    loadXodrFromRead: xodr.loadXodrFromRead,
  };
}
