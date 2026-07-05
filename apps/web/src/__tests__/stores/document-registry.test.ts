/**
 * DocumentRegistry — derived-dirty semantics (S1-2, semantics table 1-B).
 *
 * Drives a real scenario engine store through the registry to prove that dirty
 * is derived from the command-history revision, not a hand-set flag: editing
 * makes it dirty, undoing back to the save point makes it clean again, and
 * save/load capture a fresh clean baseline.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createScenarioStore } from '@osce/scenario-engine';
import type { StoreApi } from 'zustand/vanilla';
import type { ScenarioStore } from '@osce/scenario-engine';
import { useDocumentRegistry, initDocumentRegistry } from '../../stores/document-registry';

let scenarioApi: StoreApi<ScenarioStore>;
let cleanup: () => void;

const registry = () => useDocumentRegistry.getState();

beforeEach(() => {
  scenarioApi = createScenarioStore();
  cleanup = initDocumentRegistry(scenarioApi);
});

afterEach(() => cleanup());

describe('DocumentRegistry derived dirty', () => {
  it('a freshly initialized document is clean', () => {
    // File load / File>New land here: revision 0 == savedRevision 0.
    expect(registry().isDirty('scenario')).toBe(false);
    expect(registry().anyDirty()).toBe(false);
  });

  it('markLoaded keeps a just-loaded document clean', () => {
    registry().markLoaded('scenario');
    expect(registry().isDirty('scenario')).toBe(false);
  });

  it('an edit makes the document dirty', () => {
    registry().markLoaded('scenario');
    scenarioApi.getState().addEntity({ name: 'ego' });
    expect(registry().isDirty('scenario')).toBe(true);
    expect(registry().dirtyKinds()).toContain('scenario');
  });

  it('undoing back to the save point restores clean (core revision value)', () => {
    registry().markLoaded('scenario');
    scenarioApi.getState().addEntity({ name: 'ego' });
    expect(registry().isDirty('scenario')).toBe(true);

    scenarioApi.getState().undo();
    expect(registry().isDirty('scenario')).toBe(false);
  });

  it('markSaved captures a new clean baseline mid-history', () => {
    registry().markLoaded('scenario');
    scenarioApi.getState().addEntity({ name: 'a' });
    // Save at this position: dirty clears without any undo.
    registry().markSaved('scenario');
    expect(registry().isDirty('scenario')).toBe(false);

    // A further edit is dirty again; undoing to the save point clears it.
    scenarioApi.getState().addEntity({ name: 'b' });
    expect(registry().isDirty('scenario')).toBe(true);
    scenarioApi.getState().undo();
    expect(registry().isDirty('scenario')).toBe(false);
  });

  it('markRestoredDirty forces dirty until the next save (autosave recovery)', () => {
    registry().markLoaded('scenario');
    registry().markRestoredDirty('scenario');
    expect(registry().isDirty('scenario')).toBe(true);
    // A save clears the recovery-dirty sentinel.
    registry().markSaved('scenario');
    expect(registry().isDirty('scenario')).toBe(false);
  });
});
