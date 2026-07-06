import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// ---- Mocks ---------------------------------------------------------------
// The save functions are mocked to model real save semantics: a successful save
// clears its own dirty flag, while a cancelled save leaves the flag set. The
// editor store (dirty flags + editorMode) is left real and driven via setState.

const saveXosc = vi.fn();
const saveXodr = vi.fn();
const saveDistribution = vi.fn(async () => true);
const saveAllDirtyCatalogs = vi.fn(async () => true);

vi.mock('../../hooks/use-file-operations', () => ({
  useFileOperations: () => ({ saveXosc, saveXodr, saveDistribution }),
}));
vi.mock('../../hooks/use-catalog-operations', () => ({
  useCatalogOperations: () => ({ saveAllDirtyCatalogs }),
}));

import { useUnsavedChangesGuard } from '../../hooks/use-unsaved-changes-guard';
import { useDocumentRegistry } from '../../stores/document-registry';

type RunSaveHandler = () => void;

let runSaveHandler: RunSaveHandler | null = null;
let saveComplete: boolean | null = null;

beforeEach(() => {
  saveXosc.mockReset();
  saveXodr.mockReset();
  saveDistribution.mockReset();
  saveDistribution.mockResolvedValue(true);
  saveAllDirtyCatalogs.mockReset();
  saveAllDirtyCatalogs.mockResolvedValue(true);
  runSaveHandler = null;
  saveComplete = null;

  (window as unknown as { electronAPI: unknown }).electronAPI = {
    isElectron: true,
    onCloseRequested: () => () => {},
    onRunSave: (cb: RunSaveHandler) => {
      runSaveHandler = cb;
      return () => {
        runSaveHandler = null;
      };
    },
    respondCloseDecision: vi.fn(),
    respondSaveComplete: (ok: boolean) => {
      saveComplete = ok;
    },
  };
});

afterEach(() => {
  delete (window as unknown as { electronAPI?: unknown }).electronAPI;
  useDocumentRegistry.getState().markLoaded('scenario');
  useDocumentRegistry.getState().markLoaded('roadNetwork');
  useDocumentRegistry.getState().markLoaded('catalog');
  useDocumentRegistry.getState().markLoaded('distribution');
});

/** Run the captured onRunSave callback and wait for its async body to settle. */
async function runSave(): Promise<void> {
  expect(runSaveHandler).toBeTypeOf('function');
  runSaveHandler!();
  // Allow the queued microtasks (awaited saves) to flush.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('useUnsavedChangesGuard — onRunSave (S0-2)', () => {
  it('runs BOTH saves when both documents are dirty and reports success', async () => {
    // A successful save clears its own dirty flag.
    saveXosc.mockImplementation(async () => {
      useDocumentRegistry.getState().markLoaded('scenario');
    });
    saveXodr.mockImplementation(async () => {
      useDocumentRegistry.getState().markLoaded('roadNetwork');
    });

    useDocumentRegistry.getState().markRestoredDirty('scenario');
    useDocumentRegistry.getState().markRestoredDirty('roadNetwork');

    renderHook(() => useUnsavedChangesGuard());
    await runSave();

    expect(saveXosc).toHaveBeenCalledTimes(1);
    expect(saveXodr).toHaveBeenCalledTimes(1);
    expect(saveComplete).toBe(true);
  });

  it('only saves the dirty document when a single document is dirty', async () => {
    saveXodr.mockImplementation(async () => {
      useDocumentRegistry.getState().markLoaded('roadNetwork');
    });

    useDocumentRegistry.getState().markLoaded('scenario');
    useDocumentRegistry.getState().markRestoredDirty('roadNetwork');

    renderHook(() => useUnsavedChangesGuard());
    await runSave();

    expect(saveXosc).not.toHaveBeenCalled();
    expect(saveXodr).toHaveBeenCalledTimes(1);
    expect(saveComplete).toBe(true);
  });

  it('aborts and reports false when the first save is cancelled', async () => {
    // Cancelled xosc save: dirty flag stays set.
    saveXosc.mockImplementation(async () => {
      // no-op — user cancelled the picker, isDirty remains true
    });
    saveXodr.mockImplementation(async () => {
      useDocumentRegistry.getState().markLoaded('roadNetwork');
    });

    useDocumentRegistry.getState().markRestoredDirty('scenario');
    useDocumentRegistry.getState().markRestoredDirty('roadNetwork');

    renderHook(() => useUnsavedChangesGuard());
    await runSave();

    expect(saveXosc).toHaveBeenCalledTimes(1);
    // Second save must NOT run once the first is cancelled.
    expect(saveXodr).not.toHaveBeenCalled();
    expect(saveComplete).toBe(false);
  });

  it('aborts and reports false when the second save is cancelled', async () => {
    saveXosc.mockImplementation(async () => {
      useDocumentRegistry.getState().markLoaded('scenario');
    });
    // Cancelled xodr save: dirty flag stays set.
    saveXodr.mockImplementation(async () => {
      // no-op — user cancelled the picker, isRoadNetworkDirty remains true
    });

    useDocumentRegistry.getState().markRestoredDirty('scenario');
    useDocumentRegistry.getState().markRestoredDirty('roadNetwork');

    renderHook(() => useUnsavedChangesGuard());
    await runSave();

    expect(saveXosc).toHaveBeenCalledTimes(1);
    expect(saveXodr).toHaveBeenCalledTimes(1);
    expect(saveComplete).toBe(false);
  });

  it('saves a dirty catalog and distribution and reports success', async () => {
    saveAllDirtyCatalogs.mockImplementation(async () => {
      useDocumentRegistry.getState().markLoaded('catalog');
      return true;
    });
    saveDistribution.mockImplementation(async () => {
      useDocumentRegistry.getState().markLoaded('distribution');
      return true;
    });

    useDocumentRegistry.getState().markRestoredDirty('catalog');
    useDocumentRegistry.getState().markRestoredDirty('distribution');

    renderHook(() => useUnsavedChangesGuard());
    await runSave();

    expect(saveXosc).not.toHaveBeenCalled(); // scenario/road were clean
    expect(saveAllDirtyCatalogs).toHaveBeenCalledTimes(1);
    expect(saveDistribution).toHaveBeenCalledTimes(1);
    expect(saveComplete).toBe(true);
  });

  it('aborts (does not reach distribution) when the catalog save is cancelled', async () => {
    saveAllDirtyCatalogs.mockResolvedValue(false); // user cancelled a catalog picker

    useDocumentRegistry.getState().markRestoredDirty('catalog');
    useDocumentRegistry.getState().markRestoredDirty('distribution');

    renderHook(() => useUnsavedChangesGuard());
    await runSave();

    expect(saveAllDirtyCatalogs).toHaveBeenCalledTimes(1);
    expect(saveDistribution).not.toHaveBeenCalled();
    expect(saveComplete).toBe(false);
  });
});
