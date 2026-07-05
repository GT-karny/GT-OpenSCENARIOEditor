/**
 * useAutosave — registry-driven trigger + snapshot lifecycle (S1-3, danger #7).
 *
 * Verifies the two behaviours the registry migration fixed:
 *  - a road-only editing session still writes a recovery snapshot (fire on
 *    anyDirty, not just scenario dirty);
 *  - the snapshot is deleted only when EVERY document is clean, so saving the
 *    scenario does not discard a still-dirty road network's snapshot.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createDefaultDocument } from '@osce/opendrive-engine';
import { ScenarioStoreProvider } from '../../stores/scenario-store-context';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { useDocumentRegistry, initDocumentRegistry } from '../../stores/document-registry';

// Mock only the IndexedDB side effects; keep the debounce scheduler + snapshot
// mapping real so the trigger/lifecycle logic is exercised end-to-end.
// vi.mock is hoisted, so the spies must be created via vi.hoisted.
const { writeSnapshot, deleteSnapshot, readSnapshot } = vi.hoisted(() => ({
  writeSnapshot: vi.fn(async () => {}),
  deleteSnapshot: vi.fn(async () => {}),
  readSnapshot: vi.fn(async () => null),
}));
vi.mock('../../lib/autosave', async (importActual) => {
  const actual = await importActual<typeof import('../../lib/autosave')>();
  return { ...actual, writeSnapshot, deleteSnapshot, readSnapshot };
});

import { useAutosave } from '../../hooks/use-autosave';

function wrapper({ children }: { children: ReactNode }) {
  return <ScenarioStoreProvider>{children}</ScenarioStoreProvider>;
}

// Render useAutosave while also wiring the registry to the provider's scenario
// store, and expose that store api to the test.
function useHarness() {
  const api = useScenarioStoreApi();
  useEffect(() => initDocumentRegistry(api), [api]);
  useAutosave();
  return api;
}

const registry = () => useDocumentRegistry.getState();

beforeEach(() => {
  vi.useFakeTimers();
  writeSnapshot.mockClear();
  deleteSnapshot.mockClear();
  readSnapshot.mockClear();
  registry().markLoaded('scenario');
  registry().markLoaded('roadNetwork');
  useEditorStore.getState().setRoadNetwork(null, null);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAutosave registry-driven lifecycle', () => {
  it('writes a snapshot for a road-only dirty session (danger #7)', () => {
    renderHook(() => useHarness(), { wrapper });

    // Simulate a road-only edit: the road network becomes dirty and the editor
    // store's roadNetwork mirror updates (as RoadNetworkEditorLayout would).
    registry().markRestoredDirty('roadNetwork');
    useEditorStore.getState().setRoadNetwork(createDefaultDocument(), null);

    // Flush the debounce window.
    vi.advanceTimersByTime(2_500);
    expect(writeSnapshot).toHaveBeenCalled();
  });

  it('deletes the snapshot only when every document is clean', () => {
    renderHook(() => useHarness(), { wrapper });

    // Both documents dirty.
    registry().markRestoredDirty('scenario');
    registry().markRestoredDirty('roadNetwork');

    // Saving the scenario alone leaves the road dirty → snapshot must survive.
    deleteSnapshot.mockClear();
    registry().markSaved('scenario');
    expect(deleteSnapshot).not.toHaveBeenCalled();

    // Saving the road too → all clean → snapshot deleted.
    registry().markSaved('roadNetwork');
    expect(deleteSnapshot).toHaveBeenCalled();
  });
});
