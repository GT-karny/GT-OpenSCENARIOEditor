import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { I18nextProvider, initI18n, i18n } from '@osce/i18n';
import type { ReactNode } from 'react';
import { ScenarioStoreProvider } from '../../stores/scenario-store-context';
import { useEditorStore } from '../../stores/editor-store';
import { useProjectStore } from '../../stores/project-store';
import {
  getDiscardGuardOpen,
  resolveDiscardGuard,
} from '../../hooks/use-discard-guard';

// The guard self-mounts a React dialog into document.body on first dirty use.
// That path is browser wiring, not the logic under test — stub the dynamic mount.
vi.mock('react-dom/client', () => ({ createRoot: () => ({ render: () => {} }) }));

// Keep the heavy save graph out of the test: the project hook only needs the two
// save flows to hand to the shared guard, which we never exercise here.
vi.mock('../../hooks/use-file-operations', () => ({
  useFileOperations: () => ({ saveXosc: vi.fn(), saveXodr: vi.fn() }),
}));

// The only file-IO side effect after the guard passes. Reject so the discard path
// proves the read was attempted without mutating any store (open then bails).
const readProjectFile = vi.fn<(id: string, path: string) => Promise<string>>();
vi.mock('../../lib/project-api', () => ({
  readProjectFile: (id: string, path: string) => readProjectFile(id, path),
}));

import { useProjectFileOperations } from '../../hooks/use-project-file-operations';

function wrapper({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ScenarioStoreProvider>{children}</ScenarioStoreProvider>
    </I18nextProvider>
  );
}

beforeAll(async () => {
  await initI18n('en');
});

beforeEach(() => {
  readProjectFile.mockReset();
  readProjectFile.mockRejectedValue(new Error('io'));
  useEditorStore.getState().setDirty(false);
  useEditorStore.getState().setRoadNetworkDirty(false);
  if (getDiscardGuardOpen()) resolveDiscardGuard('cancel');
  useProjectStore.setState({
    currentProject: {
      meta: { id: 'p1', name: 'p1' },
      files: [],
    },
  } as never);
});

describe('useProjectFileOperations unsaved-changes guard', () => {
  it('aborts a dirty tree open when the user cancels (no replace)', async () => {
    useEditorStore.getState().setDirty(true);
    const { result } = renderHook(() => useProjectFileOperations(), { wrapper });

    const open = result.current.openXoscFromProject('scenarios/a.xosc');
    // Dirty document opens the confirmation dialog instead of replacing.
    expect(getDiscardGuardOpen()).toBe(true);

    resolveDiscardGuard('cancel');
    await open;
    // Cancelled: the file was never read, so the document was not replaced.
    expect(readProjectFile).not.toHaveBeenCalled();
  });

  it('proceeds with a dirty tree open when the user discards', async () => {
    useEditorStore.getState().setDirty(true);
    const { result } = renderHook(() => useProjectFileOperations(), { wrapper });

    const open = result.current.openXoscFromProject('scenarios/a.xosc');
    expect(getDiscardGuardOpen()).toBe(true);

    resolveDiscardGuard('discard');
    await open;
    // Discarded: the open proceeded to read the target file.
    expect(readProjectFile).toHaveBeenCalledWith('p1', 'scenarios/a.xosc');
  });

  it('opens a road file without prompting when the document is clean', async () => {
    const { result } = renderHook(() => useProjectFileOperations(), { wrapper });

    const open = result.current.openXodrFromProject('xodr/a.xodr');
    // Clean document never opens the dialog.
    expect(getDiscardGuardOpen()).toBe(false);
    await open;
    expect(readProjectFile).toHaveBeenCalledWith('p1', 'xodr/a.xodr');
  });

  it('skips the guard for programmatic road opens (skipGuard)', async () => {
    useEditorStore.getState().setRoadNetworkDirty(true);
    const { result } = renderHook(() => useProjectFileOperations(), { wrapper });

    const open = result.current.openXodrFromProject('xodr/a.xodr', { skipGuard: true });
    // skipGuard bypasses the dialog even while dirty (property-panel reference change).
    expect(getDiscardGuardOpen()).toBe(false);
    await open;
    expect(readProjectFile).toHaveBeenCalledWith('p1', 'xodr/a.xodr');
  });
});
