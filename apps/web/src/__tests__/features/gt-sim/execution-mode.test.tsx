import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, cleanup, renderHook } from '@testing-library/react';
import {
  useDocumentRegistry,
  getFocusedDocumentKind,
} from '../../../stores/document-registry';
import { useAppLifecycle } from '../../../hooks/use-app-lifecycle';
import {
  registerExecutionPanel,
  unregisterExecutionPanel,
  getExecutionPanels,
} from '../../../features/gt-sim/panel-registry';
import ExecutionLayout from '../../../features/gt-sim/ExecutionLayout';
import { initTestI18n } from '../../helpers/render-with-providers';

// `ExecutionLayout` pulls in `../../../features/gt-sim/panels`, which
// registers every landed cluster's real panels into the (module-global)
// panel-registry as a load-time side effect. This suite exercises
// `ExecutionLayout`'s empty-state/slot-sorting behaviour in isolation from
// whichever real panels happen to be registered elsewhere in the app, so the
// side-effect module is stubbed out here (vi.mock calls are hoisted above
// imports) — the registry-emptiness/order assertions below stay a pure
// unit-level check ("when nothing is registered / only these ids are
// registered..."), not a claim about the real app's panel set.
vi.mock('../../../features/gt-sim/panels', () => ({}));

beforeAll(async () => {
  await initTestI18n();
});

describe('execution editor mode — WP3', () => {
  afterEach(() => {
    // Restore the default mode so other suites are unaffected.
    act(() => {
      useDocumentRegistry.getState().setFocusedBase('scenario');
    });
  });

  it('switchEditorMode enters and leaves the execution mode', () => {
    const { result } = renderHook(() => useAppLifecycle());

    act(() => result.current.switchEditorMode('execution'));
    expect(useDocumentRegistry.getState().focusedBase).toBe('execution');

    act(() => result.current.switchEditorMode('scenario'));
    expect(useDocumentRegistry.getState().focusedBase).toBe('scenario');
  });

  it('execution mode owns no document: getFocusedDocumentKind returns null', () => {
    act(() => useDocumentRegistry.getState().setFocusedBase('execution'));
    // Never falls back to a document — callers must no-op on null.
    expect(getFocusedDocumentKind()).toBeNull();
    // A catalog/distribution override still wins even in execution mode.
    act(() => useDocumentRegistry.getState().setFocusedOverride('catalog'));
    expect(getFocusedDocumentKind()).toBe('catalog');
    act(() => useDocumentRegistry.getState().setFocusedOverride(null));
    expect(getFocusedDocumentKind()).toBeNull();
  });
});

describe('ExecutionLayout — panel-registry driven rendering', () => {
  beforeEach(() => {
    unregisterExecutionPanel('test-main');
    unregisterExecutionPanel('test-side');
  });
  afterEach(() => {
    // RTL auto-cleanup is off in this repo (no vitest globals); unmount
    // explicitly so a previous render's DOM does not leak into the next test.
    cleanup();
    unregisterExecutionPanel('test-main');
    unregisterExecutionPanel('test-side');
  });

  it('shows the empty state when no panels are registered', () => {
    render(<ExecutionLayout />);
    expect(screen.getByText('No execution panels registered')).toBeInTheDocument();
  });

  it('renders panels registered into their slots', () => {
    registerExecutionPanel('test-main', {
      title: 'Main',
      placement: 'main',
      component: () => <div>MAIN PANEL</div>,
    });
    registerExecutionPanel('test-side', {
      title: 'Side',
      placement: 'side',
      component: () => <div>SIDE PANEL</div>,
    });

    render(<ExecutionLayout />);

    expect(screen.getByText('MAIN PANEL')).toBeInTheDocument();
    expect(screen.getByText('SIDE PANEL')).toBeInTheDocument();
    expect(screen.queryByText('No execution panels registered')).not.toBeInTheDocument();
  });

  it('getExecutionPanels sorts by order then id within a slot', () => {
    registerExecutionPanel('test-side', {
      title: 'B',
      placement: 'side',
      component: () => null,
      order: 2,
    });
    registerExecutionPanel('test-main', {
      title: 'A',
      placement: 'side',
      component: () => null,
      order: 1,
    });
    const ids = getExecutionPanels('side').map((p) => p.id);
    expect(ids).toEqual(['test-main', 'test-side']);
  });
});
