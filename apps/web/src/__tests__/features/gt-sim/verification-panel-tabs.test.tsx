/**
 * High-priority review regression guard: switching the VD verification
 * panel's internal tabs must NOT unmount the views. ReplayView holds the
 * running-job state (mode/runningJobId/...) and the embedded LiveVdPanel
 * holds live WS subscriptions; the fork's separate live window survived
 * navigation, so unmount-on-tab-switch would be a regression. The panel uses
 * Radix `forceMount` + CSS hiding — these tests pin that behavior.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VdVerificationPanel } from '../../../features/gt-sim/verification/VdVerificationPanel';
import { useVdViewStore } from '../../../features/gt-sim/verification/store/vd-view-store';
import { initTestI18n } from '../../helpers/render-with-providers';

beforeAll(async () => {
  await initTestI18n();
});

beforeEach(() => {
  // The view store is module-global; pin the starting tab per test.
  useVdViewStore.setState({ activeTab: 'replay' });
});

afterEach(() => {
  cleanup();
});

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <VdVerificationPanel />
    </QueryClientProvider>,
  );
}

/** Activate a Radix tab trigger (Radix switches on mousedown). */
function switchTab(name: string) {
  const tab = screen.getByRole('tab', { name });
  fireEvent.mouseDown(tab, { button: 0 });
  fireEvent.click(tab);
}

describe('VdVerificationPanel tab persistence', () => {
  it('keeps all three tab contents mounted while switching tabs', () => {
    renderPanel();

    // Replay view content is present (mode toggle buttons).
    expect(screen.getByText('Run a scenario')).toBeInTheDocument();

    switchTab('Live');
    expect(useVdViewStore.getState().activeTab).toBe('live');

    // Live view content is present AND the replay view stayed mounted
    // (hidden via CSS, still in the DOM).
    expect(screen.getByText('VirtualDriver Live')).toBeInTheDocument();
    expect(screen.getByText('Run a scenario')).toBeInTheDocument();

    switchTab('Annotate');
    expect(useVdViewStore.getState().activeTab).toBe('annotate');
    expect(screen.getByText('Run a scenario')).toBeInTheDocument();
    expect(screen.getByText('VirtualDriver Live')).toBeInTheDocument();
  });

  it('preserves ReplayView local state (mode) across a tab round-trip', () => {
    renderPanel();

    // Enter "run a scenario" mode — ReplayView-local useState. The launcher
    // ("Run & Watch") appears only in that mode.
    fireEvent.click(screen.getByText('Run a scenario'));
    expect(screen.getByText('Run & Watch ▶')).toBeInTheDocument();

    // Round-trip through the Live tab.
    switchTab('Live');
    switchTab('Replay');

    // Still in "run" mode: the local state survived because the view was
    // never unmounted. (A remount would reset mode to 'replay' and show the
    // run <select> instead.)
    expect(screen.getByText('Run & Watch ▶')).toBeInTheDocument();
  });

  it('hides inactive tab contents via data-state instead of unmounting', () => {
    const { container } = renderPanel();
    switchTab('Live');

    const contents = container.querySelectorAll('[role="tabpanel"]');
    expect(contents.length).toBe(3);
    const states = [...contents].map((el) => el.getAttribute('data-state'));
    expect(states.filter((s) => s === 'active')).toHaveLength(1);
    expect(states.filter((s) => s === 'inactive')).toHaveLength(2);
  });
});
