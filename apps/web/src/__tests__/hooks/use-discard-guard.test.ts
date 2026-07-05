import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDocumentRegistry } from '../../stores/document-registry';
import {
  confirmDiscardIfDirty,
  resolveDiscardGuard,
  getDiscardGuardOpen,
  hasUnsavedChanges,
  runUnsavedGuard,
} from '../../hooks/use-discard-guard';

// The guard self-mounts a React dialog into document.body on first dirty use.
// That path is browser wiring, not the logic under test — stub out the dynamic
// mount so the controller's promise behaviour can be asserted in isolation.
vi.mock('react-dom/client', () => ({ createRoot: () => ({ render: () => {} }) }));

// Derived dirty is driven through the registry: markRestoredDirty forces a
// document dirty (savedRevision sentinel), markLoaded/markSaved make it clean.
const registry = () => useDocumentRegistry.getState();
function markScenarioDirty() {
  registry().markRestoredDirty('scenario');
}
function markRoadDirty() {
  registry().markRestoredDirty('roadNetwork');
}
function setClean() {
  registry().markLoaded('scenario');
  registry().markLoaded('roadNetwork');
}

describe('confirmDiscardIfDirty', () => {
  beforeEach(() => {
    setClean();
    // Drain any pending guard left open by a previous assertion.
    if (getDiscardGuardOpen()) resolveDiscardGuard('cancel');
  });

  it('resolves immediately as "discard" when the document is clean', async () => {
    setClean();
    await expect(confirmDiscardIfDirty()).resolves.toBe('discard');
    // Clean path never opens the dialog.
    expect(getDiscardGuardOpen()).toBe(false);
  });

  it('reflects dirty state via hasUnsavedChanges (scenario or road network)', () => {
    setClean();
    expect(hasUnsavedChanges()).toBe(false);
    markScenarioDirty();
    expect(hasUnsavedChanges()).toBe(true);
    setClean();
    markRoadDirty();
    expect(hasUnsavedChanges()).toBe(true);
  });

  it('opens the dialog when dirty and resolves "cancel"', async () => {
    markScenarioDirty();
    const promise = confirmDiscardIfDirty();
    expect(getDiscardGuardOpen()).toBe(true);

    resolveDiscardGuard('cancel');
    await expect(promise).resolves.toBe('cancel');
    expect(getDiscardGuardOpen()).toBe(false);
  });

  it('opens the dialog when dirty and resolves "discard"', async () => {
    markScenarioDirty();
    const promise = confirmDiscardIfDirty();
    expect(getDiscardGuardOpen()).toBe(true);

    resolveDiscardGuard('discard');
    await expect(promise).resolves.toBe('discard');
    expect(getDiscardGuardOpen()).toBe(false);
  });

  it('opens the dialog when dirty and resolves "save"', async () => {
    markRoadDirty();
    const promise = confirmDiscardIfDirty();
    expect(getDiscardGuardOpen()).toBe(true);

    resolveDiscardGuard('save');
    await expect(promise).resolves.toBe('save');
    expect(getDiscardGuardOpen()).toBe(false);
  });
});

// Verify the caller-facing gate semantics that every open path relies on:
// map a choice + save outcome to "proceed?" via the shared runUnsavedGuard.
describe('runUnsavedGuard gate semantics', () => {
  beforeEach(() => {
    setClean();
    if (getDiscardGuardOpen()) resolveDiscardGuard('cancel');
  });

  // Both save flows share one spy so existing assertions on call count still hold.
  function runGate(save: () => Promise<void>): Promise<boolean> {
    return runUnsavedGuard({ saveXosc: save, saveXodr: save });
  }

  it('clean document proceeds without prompting', async () => {
    const save = vi.fn(async () => {});
    await expect(runGate(save)).resolves.toBe(true);
    expect(save).not.toHaveBeenCalled();
  });

  it('cancel aborts the replace', async () => {
    markScenarioDirty();
    const save = vi.fn(async () => {});
    const gate = runGate(save);
    resolveDiscardGuard('cancel');
    await expect(gate).resolves.toBe(false);
    expect(save).not.toHaveBeenCalled();
  });

  it('discard proceeds without saving', async () => {
    markScenarioDirty();
    const save = vi.fn(async () => {});
    const gate = runGate(save);
    resolveDiscardGuard('discard');
    await expect(gate).resolves.toBe(true);
    expect(save).not.toHaveBeenCalled();
  });

  it('save that succeeds (clears dirty) proceeds', async () => {
    markScenarioDirty();
    const save = vi.fn(async () => {
      registry().markLoaded('scenario');
    });
    const gate = runGate(save);
    resolveDiscardGuard('save');
    await expect(gate).resolves.toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('save that is cancelled (stays dirty) aborts the replace', async () => {
    markScenarioDirty();
    const save = vi.fn(async () => {
      // Simulate a cancelled save-picker: dirty flag remains set.
    });
    const gate = runGate(save);
    resolveDiscardGuard('save');
    await expect(gate).resolves.toBe(false);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
