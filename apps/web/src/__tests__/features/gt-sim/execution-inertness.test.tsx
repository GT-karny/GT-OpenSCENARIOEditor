/**
 * Regression tests: the execution mode owns no document, so shared-shell
 * document operations (keyboard shortcuts, native menu, undo/redo buttons)
 * must be inert — they may never mutate a background scenario/road document.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, renderHook, fireEvent } from '@testing-library/react';

// ---- Mocks ---------------------------------------------------------------
// Imperative store APIs and file operations are mocked so we can assert what
// gets called per mode. The document registry (owner of focusedBase) is real.

const scenarioUndo = vi.fn();
const scenarioRedo = vi.fn();
const odrUndo = vi.fn();
const odrRedo = vi.fn();

const emptyHistory = () => ({
  getRevision: () => 0,
  canUndo: () => false,
  canRedo: () => false,
});

vi.mock('../../../stores/use-scenario-store', () => ({
  useScenarioStoreApi: () => ({
    getState: () => ({ undo: scenarioUndo, redo: scenarioRedo }),
  }),
  // UndoRedoButtons reads availability flags; report "available" so a disabled
  // button in execution mode is provably the mode guard, not lack of history.
  useScenarioStore: (selector: (s: unknown) => unknown) =>
    selector({ undoAvailable: true, redoAvailable: true }),
}));

vi.mock('../../../hooks/use-opendrive-store', () => ({
  getOpenDriveStoreApi: () => ({
    getState: () => ({ undo: odrUndo, redo: odrRedo, getCommandHistory: emptyHistory }),
  }),
  useOpenDriveStoreApi: () => ({
    getState: () => ({ undo: odrUndo, redo: odrRedo }),
  }),
  useOpenDriveStore: (selector: (s: unknown) => unknown) =>
    selector({ undoAvailable: false, redoAvailable: false }),
}));

const fileOps = {
  newScenario: vi.fn(),
  openXosc: vi.fn(),
  saveXosc: vi.fn(),
  saveAsXosc: vi.fn(),
  newOpenDrive: vi.fn(),
  loadXodr: vi.fn(),
  saveXodr: vi.fn(),
  saveAsXodr: vi.fn(),
  loadXoscFromRead: vi.fn(),
  loadXodrFromRead: vi.fn(),
};
vi.mock('../../../hooks/use-file-operations', () => ({
  useFileOperations: () => fileOps,
}));

const deleteSelected = vi.fn();
vi.mock('../../../hooks/use-element-delete', () => ({
  useElementDelete: () => ({ deleteSelected }),
}));

vi.mock('../../../hooks/use-clipboard', () => ({
  useCopyPaste: () => ({
    copyElements: vi.fn(),
    pasteAtSelection: vi.fn(),
    duplicateElements: vi.fn(),
  }),
}));

import { useKeyboardShortcuts } from '../../../hooks/use-keyboard-shortcuts';
import { useElectronMenu } from '../../../hooks/use-electron-menu';
import { UndoRedoButtons } from '../../../components/toolbar/UndoRedoButtons';
import { TooltipProvider } from '../../../components/ui/tooltip';
import { useDocumentRegistry } from '../../../stores/document-registry';
import { initTestI18n } from '../../helpers/render-with-providers';

beforeAll(async () => {
  await initTestI18n();
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  useDocumentRegistry.getState().setFocusedBase('scenario');
});

function pressKey(init: KeyboardEventInit) {
  fireEvent.keyDown(window, init);
}

describe('useKeyboardShortcuts — inert in execution mode', () => {
  it('Ctrl+S / Ctrl+Shift+S / Ctrl+O / Ctrl+Z / Ctrl+Y do nothing in execution mode', () => {
    useDocumentRegistry.getState().setFocusedBase('execution');
    renderHook(() => useKeyboardShortcuts());

    pressKey({ key: 's', ctrlKey: true });
    pressKey({ key: 'S', ctrlKey: true, shiftKey: true });
    pressKey({ key: 'o', ctrlKey: true });
    pressKey({ key: 'z', ctrlKey: true });
    pressKey({ key: 'y', ctrlKey: true });
    pressKey({ key: 'Delete' });

    expect(fileOps.saveXosc).not.toHaveBeenCalled();
    expect(fileOps.saveAsXosc).not.toHaveBeenCalled();
    expect(fileOps.saveXodr).not.toHaveBeenCalled();
    expect(fileOps.saveAsXodr).not.toHaveBeenCalled();
    expect(fileOps.openXosc).not.toHaveBeenCalled();
    expect(fileOps.loadXodr).not.toHaveBeenCalled();
    expect(scenarioUndo).not.toHaveBeenCalled();
    expect(scenarioRedo).not.toHaveBeenCalled();
    expect(odrUndo).not.toHaveBeenCalled();
    expect(deleteSelected).not.toHaveBeenCalled();
  });

  it('sanity: the same shortcuts still work in scenario mode', () => {
    useDocumentRegistry.getState().setFocusedBase('scenario');
    renderHook(() => useKeyboardShortcuts());

    pressKey({ key: 's', ctrlKey: true });
    expect(fileOps.saveXosc).toHaveBeenCalledTimes(1);

    pressKey({ key: 'z', ctrlKey: true });
    expect(scenarioUndo).toHaveBeenCalledTimes(1);
  });
});

describe('useElectronMenu — inert in execution mode', () => {
  type MenuActionHandler = (action: string) => void;
  let menuHandler: MenuActionHandler | null = null;

  beforeEach(() => {
    menuHandler = null;
    (window as unknown as { electronAPI: unknown }).electronAPI = {
      isElectron: true,
      onMenuAction: (cb: MenuActionHandler) => {
        menuHandler = cb;
        return () => {
          menuHandler = null;
        };
      },
      readFile: vi.fn(),
    };
  });

  afterEach(() => {
    delete (window as unknown as { electronAPI?: unknown }).electronAPI;
  });

  it('ignores new/open/save/saveAs/undo/redo/open-recent in execution mode', () => {
    useDocumentRegistry.getState().setFocusedBase('execution');
    renderHook(() => useElectronMenu());
    expect(menuHandler).toBeTypeOf('function');

    for (const action of [
      'new',
      'open',
      'save',
      'saveAs',
      'undo',
      'redo',
      'open-recent:C:/tmp/foo.xosc',
    ]) {
      menuHandler!(action);
    }

    expect(fileOps.newScenario).not.toHaveBeenCalled();
    expect(fileOps.openXosc).not.toHaveBeenCalled();
    expect(fileOps.saveXosc).not.toHaveBeenCalled();
    expect(fileOps.saveAsXosc).not.toHaveBeenCalled();
    expect(fileOps.loadXoscFromRead).not.toHaveBeenCalled();
    expect(scenarioUndo).not.toHaveBeenCalled();
    expect(scenarioRedo).not.toHaveBeenCalled();
    expect(odrUndo).not.toHaveBeenCalled();
    expect(odrRedo).not.toHaveBeenCalled();
  });

  it('sanity: save routes to the scenario document in scenario mode', () => {
    useDocumentRegistry.getState().setFocusedBase('scenario');
    renderHook(() => useElectronMenu());

    menuHandler!('save');
    expect(fileOps.saveXosc).toHaveBeenCalledTimes(1);

    menuHandler!('undo');
    expect(scenarioUndo).toHaveBeenCalledTimes(1);
  });
});

describe('UndoRedoButtons — disabled in execution mode', () => {
  function renderButtons() {
    return render(
      <TooltipProvider>
        <UndoRedoButtons />
      </TooltipProvider>,
    );
  }

  it('disables both buttons in execution mode even when scenario history exists', () => {
    useDocumentRegistry.getState().setFocusedBase('execution');
    renderButtons();

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
  });

  it('sanity: buttons are enabled in scenario mode (mocked history available)', () => {
    useDocumentRegistry.getState().setFocusedBase('scenario');
    renderButtons();

    const buttons = screen.getAllByRole('button');
    for (const button of buttons) {
      expect(button).toBeEnabled();
    }

    fireEvent.click(buttons[0]);
    expect(scenarioUndo).toHaveBeenCalledTimes(1);
  });
});
