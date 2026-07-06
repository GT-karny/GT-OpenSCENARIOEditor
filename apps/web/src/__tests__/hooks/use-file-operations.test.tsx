import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { I18nextProvider } from '@osce/i18n';
import { initI18n, i18n } from '@osce/i18n';
import { createScenarioStore } from '@osce/scenario-engine';
import { ScenarioStoreProvider } from '../../stores/scenario-store-context';
import { TooltipProvider } from '../../components/ui/tooltip';
import { useFileOperations } from '../../hooks/use-file-operations';
import { useDistributionStore } from '../../stores/distribution-store';
import { useEditorStore } from '../../stores/editor-store';
import { useDocumentRegistry, initDocumentRegistry } from '../../stores/document-registry';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ScenarioStoreProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ScenarioStoreProvider>
    </I18nextProvider>
  );
}

beforeAll(async () => {
  await initI18n('en');
});

describe('useFileOperations', () => {
  it('should provide file operation functions', () => {
    const { result } = renderHook(() => useFileOperations(), { wrapper });

    expect(result.current.newScenario).toBeInstanceOf(Function);
    expect(result.current.openXosc).toBeInstanceOf(Function);
    expect(result.current.saveXosc).toBeInstanceOf(Function);
    expect(result.current.loadXodr).toBeInstanceOf(Function);
  });

  it('should create a new scenario', () => {
    const { result } = renderHook(() => useFileOperations(), { wrapper });

    // newScenario should not throw
    expect(() => result.current.newScenario()).not.toThrow();
  });
});

describe('useFileOperations — saveDistribution', () => {
  const distribution = () => useDistributionStore.getState();
  const registry = () => useDocumentRegistry.getState();
  let cleanupRegistry: () => void;

  beforeEach(() => {
    // Wiring the registry mirrors the distribution revision, as the app does at
    // mount, so isDirty('distribution') is meaningful here.
    cleanupRegistry = initDocumentRegistry(createScenarioStore());
    distribution().clear();
    // A clean, saved deterministic distribution with no scenarioFilepath yet.
    distribution().attachToParameter({
      mode: 'deterministic',
      parameterName: 'Speed',
      distribution: { kind: 'set', values: ['1'] },
    });
    registry().markSaved('distribution');
    useEditorStore.getState().setCurrentFileName('demo.xosc');
  });

  afterEach(() => {
    cleanupRegistry();
    delete (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    vi.restoreAllMocks();
  });

  /** Stub the File System Access save picker so writeFileToDisk resolves. */
  function mockSavePicker(): void {
    const writable = { write: vi.fn(async () => {}), close: vi.fn(async () => {}) };
    const handle = {
      createWritable: vi.fn(async () => writable),
      getFile: vi.fn(async () => ({ name: 'demo.pvd.xosc' })),
    };
    (window as unknown as { showSaveFilePicker: () => Promise<unknown> }).showSaveFilePicker =
      vi.fn(async () => handle);
  }

  /** Stub the save picker to reject like a user-cancelled dialog. */
  function mockCancelledPicker(): void {
    (window as unknown as { showSaveFilePicker: () => Promise<unknown> }).showSaveFilePicker =
      vi.fn(async () => {
        const err = new Error('The user aborted a request.');
        err.name = 'AbortError';
        throw err;
      });
  }

  it('defaults the scenarioFilepath and stays clean on a successful export', async () => {
    mockSavePicker();
    const { result } = renderHook(() => useFileOperations(), { wrapper });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.saveDistribution();
    });

    expect(ok).toBe(true);
    // The default was committed through the undoable command...
    expect(distribution().document?.scenarioFilepath).toBe('demo.xosc');
    // ...and re-baselined, so the exported distribution reads clean.
    expect(registry().isDirty('distribution')).toBe(false);
  });

  it('leaves a clean distribution untouched when the export is cancelled', async () => {
    mockCancelledPicker();
    const revBefore = distribution().getCommandHistory().getRevision();
    const { result } = renderHook(() => useFileOperations(), { wrapper });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.saveDistribution();
    });

    expect(ok).toBe(false);
    // The scenarioFilepath default was NOT applied and no command ran, so a
    // previously-clean distribution is not dirtied by the cancelled export.
    expect(distribution().document?.scenarioFilepath).toBe('');
    expect(distribution().getCommandHistory().getRevision()).toBe(revBefore);
    expect(registry().isDirty('distribution')).toBe(false);
  });
});
