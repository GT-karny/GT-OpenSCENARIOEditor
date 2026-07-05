import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// ---- Mocks ---------------------------------------------------------------
// The save functions are mocked to model real save semantics: a successful save
// clears its own dirty flag, while a cancelled save leaves the flag set. The
// editor store (dirty flags + editorMode) is left real and driven via setState.

const saveXosc = vi.fn();
const saveXodr = vi.fn();

vi.mock('../../hooks/use-file-operations', () => ({
  useFileOperations: () => ({ saveXosc, saveXodr }),
}));

import { useUnsavedChangesGuard } from '../../hooks/use-unsaved-changes-guard';
import { useEditorStore } from '../../stores/editor-store';

type RunSaveHandler = () => void;

let runSaveHandler: RunSaveHandler | null = null;
let saveComplete: boolean | null = null;

beforeEach(() => {
  saveXosc.mockReset();
  saveXodr.mockReset();
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
  useEditorStore.getState().setDirty(false);
  useEditorStore.getState().setRoadNetworkDirty(false);
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
      useEditorStore.getState().setDirty(false);
    });
    saveXodr.mockImplementation(async () => {
      useEditorStore.getState().setRoadNetworkDirty(false);
    });

    useEditorStore.getState().setDirty(true);
    useEditorStore.getState().setRoadNetworkDirty(true);

    renderHook(() => useUnsavedChangesGuard());
    await runSave();

    expect(saveXosc).toHaveBeenCalledTimes(1);
    expect(saveXodr).toHaveBeenCalledTimes(1);
    expect(saveComplete).toBe(true);
  });

  it('only saves the dirty document when a single document is dirty', async () => {
    saveXodr.mockImplementation(async () => {
      useEditorStore.getState().setRoadNetworkDirty(false);
    });

    useEditorStore.getState().setDirty(false);
    useEditorStore.getState().setRoadNetworkDirty(true);

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
      useEditorStore.getState().setRoadNetworkDirty(false);
    });

    useEditorStore.getState().setDirty(true);
    useEditorStore.getState().setRoadNetworkDirty(true);

    renderHook(() => useUnsavedChangesGuard());
    await runSave();

    expect(saveXosc).toHaveBeenCalledTimes(1);
    // Second save must NOT run once the first is cancelled.
    expect(saveXodr).not.toHaveBeenCalled();
    expect(saveComplete).toBe(false);
  });

  it('aborts and reports false when the second save is cancelled', async () => {
    saveXosc.mockImplementation(async () => {
      useEditorStore.getState().setDirty(false);
    });
    // Cancelled xodr save: dirty flag stays set.
    saveXodr.mockImplementation(async () => {
      // no-op — user cancelled the picker, isRoadNetworkDirty remains true
    });

    useEditorStore.getState().setDirty(true);
    useEditorStore.getState().setRoadNetworkDirty(true);

    renderHook(() => useUnsavedChangesGuard());
    await runSave();

    expect(saveXosc).toHaveBeenCalledTimes(1);
    expect(saveXodr).toHaveBeenCalledTimes(1);
    expect(saveComplete).toBe(false);
  });
});
