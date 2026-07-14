/**
 * `ExecutionLayout`'s `main` slot (WP5): a single registered panel renders
 * directly (no tab chrome); two or more render as Radix tabs (`apex-tab`,
 * `forceMount` + CSS-hide) so panels with live WS subscriptions / local state
 * (e.g. Live Monitor + VD Verification, WP4 clusters E/F) survive a tab
 * switch — same pattern pinned for `verification/VdVerificationPanel.tsx`'s
 * internal tab strip in `verification-panel-tabs.test.tsx`.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import {
  registerExecutionPanel,
  unregisterExecutionPanel,
} from '../../../features/gt-sim/panel-registry';
import { useMainPanelStore } from '../../../features/gt-sim/stores/main-panel-store';
import ExecutionLayout from '../../../features/gt-sim/ExecutionLayout';
import { initTestI18n } from '../../helpers/render-with-providers';

// Same rationale as execution-mode.test.tsx: stub out the real panel
// registrations so this suite only sees the panels it registers itself.
vi.mock('../../../features/gt-sim/panels', () => ({}));

beforeAll(async () => {
  await initTestI18n();
});

beforeEach(() => {
  useMainPanelStore.setState({ activePanelId: null });
});

afterEach(() => {
  cleanup();
  unregisterExecutionPanel('test-main-a');
  unregisterExecutionPanel('test-main-b');
});

/** Activate a Radix tab trigger (Radix switches on mousedown). */
function switchTab(name: string) {
  const tab = screen.getByRole('tab', { name });
  fireEvent.mouseDown(tab, { button: 0 });
  fireEvent.click(tab);
}

describe('ExecutionLayout main slot — single panel', () => {
  it('renders the lone main panel directly with no tab chrome', () => {
    registerExecutionPanel('test-main-a', {
      title: 'Panel A',
      placement: 'main',
      component: () => <div>PANEL A CONTENT</div>,
    });

    render(<ExecutionLayout />);

    expect(screen.getByText('PANEL A CONTENT')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });
});

describe('ExecutionLayout main slot — multiple panels', () => {
  function registerTwo() {
    registerExecutionPanel('test-main-a', {
      title: 'Panel A',
      placement: 'main',
      component: () => <div>PANEL A CONTENT</div>,
      order: 1,
    });
    registerExecutionPanel('test-main-b', {
      title: 'Panel B',
      placement: 'main',
      component: () => <div>PANEL B CONTENT</div>,
      order: 2,
    });
  }

  it('renders a tab per panel, defaulting to the first by order', () => {
    registerTwo();
    render(<ExecutionLayout />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Panel A' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Panel B' })).toBeInTheDocument();
    expect(screen.getByText('PANEL A CONTENT')).toBeInTheDocument();
  });

  it('keeps both panel contents mounted (forceMount) while switching tabs', () => {
    registerTwo();
    const { container } = render(<ExecutionLayout />);

    switchTab('Panel B');
    expect(useMainPanelStore.getState().activePanelId).toBe('test-main-b');

    // Both stay in the DOM; only the active one is data-state="active".
    expect(screen.getByText('PANEL A CONTENT')).toBeInTheDocument();
    expect(screen.getByText('PANEL B CONTENT')).toBeInTheDocument();

    const panels = container.querySelectorAll('[role="tabpanel"]');
    expect(panels).toHaveLength(2);
    const states = [...panels].map((el) => el.getAttribute('data-state'));
    expect(states.filter((s) => s === 'active')).toHaveLength(1);
    expect(states.filter((s) => s === 'inactive')).toHaveLength(1);
  });

  it('an out-of-registry activePanelId (e.g. stale from a prior session) falls back to the first panel', () => {
    useMainPanelStore.setState({ activePanelId: 'does-not-exist' });
    registerTwo();
    render(<ExecutionLayout />);

    expect(screen.getByRole('tab', { name: 'Panel A' })).toHaveAttribute('data-state', 'active');
  });
});
