import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppLifecycle } from '../../hooks/use-app-lifecycle';
import { getOpenDriveStoreApi } from '../../hooks/use-opendrive-store';

describe('useAppLifecycle — OpenDRIVE engine reset (S0-4)', () => {
  it('resetForNewFile clears the engine document AND undo history', () => {
    const api = getOpenDriveStoreApi();

    // Arrange: edit a road so the singleton engine store is dirty and
    // has undoable history (danger sequence #1 precondition).
    act(() => {
      api.getState().addRoad({ name: 'R1' });
    });
    expect(api.getState().document.roads.length).toBeGreaterThan(0);
    expect(api.getState().canUndo()).toBe(true);

    // Act: start a new file.
    const { result } = renderHook(() => useAppLifecycle());
    act(() => {
      result.current.resetForNewFile();
    });

    // Assert: previously-edited road does not leak into the next scenario,
    // and the CommandHistory is cleared too.
    expect(api.getState().document.roads).toEqual([]);
    expect(api.getState().canUndo()).toBe(false);
    expect(api.getState().canRedo()).toBe(false);
  });
});
