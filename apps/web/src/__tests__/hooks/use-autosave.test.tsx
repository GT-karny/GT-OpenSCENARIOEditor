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
import { renderHook, act } from '@testing-library/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CatalogDocument, ParameterValueDistributionDocument } from '@osce/shared';
import { createDefaultDocument } from '@osce/opendrive-engine';
import { createDefaultDocument as createScenarioDoc } from '@osce/scenario-engine';
import { ScenarioStoreProvider } from '../../stores/scenario-store-context';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { useCatalogStore } from '../../stores/catalog-store';
import { useDistributionStore } from '../../stores/distribution-store';
import { useDocumentRegistry, initDocumentRegistry } from '../../stores/document-registry';
import type { AutosaveSnapshot } from '../../lib/autosave';

// Mock only the IndexedDB side effects; keep the debounce scheduler + snapshot
// mapping real so the trigger/lifecycle logic is exercised end-to-end.
// vi.mock is hoisted, so the spies must be created via vi.hoisted.
const { writeSnapshot, deleteSnapshot, readSnapshot } = vi.hoisted(() => ({
  writeSnapshot: vi.fn(async (_snapshot: unknown) => {}),
  deleteSnapshot: vi.fn(async () => {}),
  readSnapshot: vi.fn(async () => null),
}));

function catalogDocument(name: string): CatalogDocument {
  return {
    id: name,
    fileHeader: { revMajor: 1, revMinor: 3, date: '2026-01-01', description: '', author: '' },
    catalogName: name,
    catalogType: 'vehicle',
    entries: [],
  };
}

function distributionDocument(): ParameterValueDistributionDocument {
  return {
    id: 'd',
    fileHeader: { revMajor: 1, revMinor: 3, date: '2026-01-01', description: '', author: '' },
    scenarioFilepath: 'base.xosc',
    distribution: { kind: 'deterministic', entries: [] },
  };
}
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

// Variant that exposes the useAutosave result (recoverySnapshot / restore).
function useRestoreHarness() {
  const api = useScenarioStoreApi();
  useEffect(() => initDocumentRegistry(api), [api]);
  return useAutosave();
}

const registry = () => useDocumentRegistry.getState();

beforeEach(() => {
  vi.useFakeTimers();
  writeSnapshot.mockClear();
  deleteSnapshot.mockClear();
  readSnapshot.mockClear();
  // Reset every document kind to a clean, empty baseline.
  useCatalogStore.getState().resetAll();
  useDistributionStore.getState().clear();
  registry().markLoaded('scenario');
  registry().markLoaded('roadNetwork');
  registry().markLoaded('catalog');
  registry().markLoaded('distribution');
  useEditorStore.getState().setRoadNetwork(null);
  useEditorStore.getState().setRoadNetworkRawXml(null);
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
    useEditorStore.getState().setRoadNetwork(createDefaultDocument());

    // Flush the debounce window.
    vi.advanceTimersByTime(2_500);
    expect(writeSnapshot).toHaveBeenCalled();
  });

  it('writes a snapshot for a catalog-only dirty session', () => {
    renderHook(() => useHarness(), { wrapper });

    // Simulate a catalog-only edit: the kind becomes dirty and the catalog store
    // notifies (as a Wave D command would), routing through the shared scheduler.
    registry().markRestoredDirty('catalog');
    useCatalogStore.setState((s) => ({ editLog: [...s.editLog] }));

    vi.advanceTimersByTime(2_500);
    expect(writeSnapshot).toHaveBeenCalled();
  });

  it('captures catalogs and distribution in the snapshot payload (v2)', () => {
    renderHook(() => useHarness(), { wrapper });

    // Populate the catalog + distribution stores, then force a dirty write.
    useCatalogStore.setState({ catalogs: new Map([['Cat', catalogDocument('Cat')]]) });
    useDistributionStore.getState().loadDocument(distributionDocument());
    registry().markRestoredDirty('scenario');
    useDistributionStore.setState((s) => ({ document: s.document })); // nudge the scheduler

    vi.advanceTimersByTime(2_500);
    expect(writeSnapshot).toHaveBeenCalled();

    const snapshot = writeSnapshot.mock.calls.at(-1)![0] as AutosaveSnapshot;
    expect(snapshot.version).toBe(2);
    expect(snapshot.catalogs.map((c) => c.name)).toContain('Cat');
    expect(snapshot.distribution).not.toBeNull();
  });

  it('deletes the snapshot only when every document (of four) is clean', () => {
    renderHook(() => useHarness(), { wrapper });

    // All four documents dirty.
    registry().markRestoredDirty('scenario');
    registry().markRestoredDirty('roadNetwork');
    registry().markRestoredDirty('catalog');
    registry().markRestoredDirty('distribution');

    deleteSnapshot.mockClear();
    registry().markSaved('scenario');
    expect(deleteSnapshot).not.toHaveBeenCalled();
    registry().markSaved('roadNetwork');
    expect(deleteSnapshot).not.toHaveBeenCalled();
    registry().markSaved('catalog');
    expect(deleteSnapshot).not.toHaveBeenCalled();

    // Only when the last dirty kind is saved does the snapshot get deleted.
    registry().markSaved('distribution');
    expect(deleteSnapshot).toHaveBeenCalled();
  });
});

describe('useAutosave recovery restore', () => {
  /** Render the restore harness and flush the mount-time recovery read. */
  async function renderWithSnapshot(snapshot: AutosaveSnapshot) {
    readSnapshot.mockResolvedValueOnce(snapshot as unknown as null);
    const view = renderHook(() => useRestoreHarness(), { wrapper });
    // Flush the microtask that resolves readSnapshot().then(setRecoverySnapshot).
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    return view;
  }

  function snapshotWith(overrides: Partial<AutosaveSnapshot>): AutosaveSnapshot {
    return {
      version: 2,
      savedAt: 1,
      scenario: createScenarioDoc(),
      opendrive: null,
      catalogs: [],
      distribution: null,
      fileName: 'demo.xosc',
      ...overrides,
    };
  }

  it('marks catalog and distribution restored-dirty when the snapshot carries them', async () => {
    const { result } = await renderWithSnapshot(
      snapshotWith({
        catalogs: [{ name: 'Cat', doc: catalogDocument('Cat'), sourcePath: 'Cat.xosc' }],
        distribution: distributionDocument(),
      }),
    );
    expect(result.current.recoverySnapshot).not.toBeNull();

    act(() => result.current.restore());

    // Documents are loaded back and their kinds read dirty.
    expect(useCatalogStore.getState().catalogs.has('Cat')).toBe(true);
    expect(useCatalogStore.getState().dirtyCatalogNames()).toContain('Cat');
    expect(useDistributionStore.getState().document).not.toBeNull();
    expect(registry().isDirty('catalog')).toBe(true);
    expect(registry().isDirty('distribution')).toBe(true);
  });

  it('leaves catalog and distribution clean when the snapshot omits them', async () => {
    const { result } = await renderWithSnapshot(snapshotWith({ catalogs: [], distribution: null }));

    act(() => result.current.restore());

    // Scenario is always restored-dirty; the empty side-documents stay clean.
    expect(registry().isDirty('scenario')).toBe(true);
    expect(registry().isDirty('catalog')).toBe(false);
    expect(registry().isDirty('distribution')).toBe(false);
    expect(useDistributionStore.getState().document).toBeNull();
  });
});
