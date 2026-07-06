import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// ---- Mocks ---------------------------------------------------------------
// Imperative store APIs are mocked so we can assert which store receives the
// undo/redo call for each editor mode. The document registry (which owns
// focusedBase) is left real and driven via setFocusedBase.

const scenarioUndo = vi.fn();
const scenarioRedo = vi.fn();
const odrUndo = vi.fn();
const odrRedo = vi.fn();

vi.mock('../../stores/use-scenario-store', () => ({
  useScenarioStoreApi: () => ({
    getState: () => ({ undo: scenarioUndo, redo: scenarioRedo }),
  }),
}));

vi.mock('../../hooks/use-opendrive-store', () => ({
  getOpenDriveStoreApi: () => ({
    getState: () => ({ undo: odrUndo, redo: odrRedo }),
  }),
}));

// File operations are irrelevant to undo/redo routing — stub them out.
vi.mock('../../hooks/use-file-operations', () => ({
  useFileOperations: () => ({
    newScenario: vi.fn(),
    openXosc: vi.fn(),
    saveXosc: vi.fn(),
    saveAsXosc: vi.fn(),
    saveXodr: vi.fn(),
    saveAsXodr: vi.fn(),
    loadXoscFromRead: vi.fn(),
    loadXodrFromRead: vi.fn(),
  }),
}));

import { useElectronMenu } from '../../hooks/use-electron-menu';
import { useDocumentRegistry } from '../../stores/document-registry';

type MenuActionHandler = (action: string) => void;

let menuHandler: MenuActionHandler | null = null;

beforeEach(() => {
  scenarioUndo.mockClear();
  scenarioRedo.mockClear();
  odrUndo.mockClear();
  odrRedo.mockClear();
  menuHandler = null;

  // Minimal electronAPI stub: capture the registered menu-action callback.
  (window as unknown as { electronAPI: unknown }).electronAPI = {
    isElectron: true,
    onMenuAction: (cb: MenuActionHandler) => {
      menuHandler = cb;
      return () => {
        menuHandler = null;
      };
    },
  };
});

afterEach(() => {
  delete (window as unknown as { electronAPI?: unknown }).electronAPI;
  useDocumentRegistry.getState().setFocusedBase('scenario');
});

describe('useElectronMenu — undo/redo routing (S0-1)', () => {
  it('routes undo/redo to the scenario store in scenario mode', () => {
    useDocumentRegistry.getState().setFocusedBase('scenario');
    renderHook(() => useElectronMenu());
    expect(menuHandler).toBeTypeOf('function');

    menuHandler!('undo');
    expect(scenarioUndo).toHaveBeenCalledTimes(1);
    expect(odrUndo).not.toHaveBeenCalled();

    menuHandler!('redo');
    expect(scenarioRedo).toHaveBeenCalledTimes(1);
    expect(odrRedo).not.toHaveBeenCalled();
  });

  it('routes undo/redo to the OpenDRIVE store in road-network mode', () => {
    useDocumentRegistry.getState().setFocusedBase('roadNetwork');
    renderHook(() => useElectronMenu());
    expect(menuHandler).toBeTypeOf('function');

    menuHandler!('undo');
    expect(odrUndo).toHaveBeenCalledTimes(1);
    expect(scenarioUndo).not.toHaveBeenCalled();

    menuHandler!('redo');
    expect(odrRedo).toHaveBeenCalledTimes(1);
    expect(scenarioRedo).not.toHaveBeenCalled();
  });
});
