/**
 * `TargetSwitcher` (WP5): the WASM/GT_Sim execution-target dropdown rendered
 * next to `SimulationButtons`. Pins: GT_Sim is only selectable once the
 * backend is `ready`, the native-window toggle only applies to GT_Sim, and
 * the StoryBoard/Condition-events notice only shows for the GT_Sim target
 * (migration-plan risk R3).
 *
 * jsdom (this suite's environment) has no native `PointerEvent`, and React's
 * DOM event system decides whether to attach real `pointerdown` listeners
 * once, at module-init time, based on `typeof PointerEvent`. A minimal
 * polyfill is installed here — before any other import — so Radix's
 * `DropdownMenuTrigger` (which opens on `onPointerDown`, see
 * `@radix-ui/react-dropdown-menu`) actually receives the simulated event.
 * Scoped to this file only; not a shared test-setup change.
 */
if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    isPrimary: boolean;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
      this.pointerType = params.pointerType ?? 'mouse';
      this.isPrimary = params.isPrimary ?? true;
    }
  }
  // @ts-expect-error — deliberate minimal polyfill, not a full PointerEvent.
  globalThis.PointerEvent = PointerEventPolyfill;
}

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { useGtSimConnectionStore } from '../../../features/gt-sim/stores/gt-sim-connection-store';
import { useSimulationStore } from '../../../features/simulation/stores/simulation-store';
import { useExecutionTargetStore } from '../../../features/gt-sim/target/store';
import { TargetSwitcher } from '../../../features/gt-sim/target/TargetSwitcher';
import { initTestI18n } from '../../helpers/render-with-providers';

beforeAll(async () => {
  await initTestI18n();
});

beforeEach(() => {
  useGtSimConnectionStore.getState().reset();
  useSimulationStore.getState().reset();
  useExecutionTargetStore.setState({ target: 'wasm', nativeWindow: false, runningTarget: null });
});

afterEach(() => {
  cleanup();
});

function renderSwitcher() {
  return render(<TargetSwitcher />);
}

/**
 * Radix `DropdownMenuTrigger` opens on pointerdown (not click), gated on
 * `event.button === 0 && event.ctrlKey === false` — both must be set
 * explicitly, since a bare `Event`'s `ctrlKey` is `undefined` (which fails
 * the `=== false` check).
 */
function openMenu() {
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Execution target' }), {
    button: 0,
    ctrlKey: false,
  });
}

describe('TargetSwitcher', () => {
  it('shows WASM as the initial target', () => {
    renderSwitcher();
    expect(screen.getByRole('button', { name: 'Execution target' })).toHaveTextContent('WASM');
  });

  it('disables the GT_Sim option while the backend is not ready', () => {
    renderSwitcher();
    openMenu();

    const gtSimItem = screen.getByText('GT_Sim').closest('[role="menuitem"]');
    expect(gtSimItem).toHaveAttribute('data-disabled');
  });

  it('selecting GT_Sim once ready switches the active target', () => {
    useGtSimConnectionStore.getState().applyStatus({
      state: 'ready',
      endpoints: { restBaseUrl: 'http://127.0.0.1:8000', wsBaseUrl: 'ws://127.0.0.1:8000', grpcPort: 1 },
    });
    renderSwitcher();
    openMenu();

    fireEvent.click(screen.getByText('GT_Sim'));
    expect(useExecutionTargetStore.getState().target).toBe('gt-sim');
  });

  it('the native-window toggle is disabled while the target is wasm', () => {
    renderSwitcher();
    openMenu();

    const toggleItem = screen.getByText('Native 3D window').closest('[role="menuitem"]');
    expect(toggleItem).toHaveAttribute('data-disabled');
  });

  it('is disabled while a simulation is running (review fix: mid-run target switches break Stop)', () => {
    useSimulationStore.getState().setStatus('running');
    renderSwitcher();

    const trigger = screen.getByRole('button', { name: 'Execution target' });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute(
      'title',
      expect.stringContaining('cannot be changed while a simulation is running'),
    );

    // Even a direct pointerdown must not open the menu.
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('re-enables once the simulation leaves the running state', () => {
    useSimulationStore.getState().setStatus('running');
    renderSwitcher();
    expect(screen.getByRole('button', { name: 'Execution target' })).toBeDisabled();

    act(() => {
      useSimulationStore.getState().setCompleted({ status: 'completed', frames: [], duration: 0 });
    });

    expect(screen.getByRole('button', { name: 'Execution target' })).toBeEnabled();
  });

  it('shows the StoryBoard/Condition-events notice only for the gt-sim target', () => {
    useGtSimConnectionStore.getState().applyStatus({
      state: 'ready',
      endpoints: { restBaseUrl: 'http://127.0.0.1:8000', wsBaseUrl: 'ws://127.0.0.1:8000', grpcPort: 1 },
    });
    useExecutionTargetStore.setState({ target: 'wasm' });
    renderSwitcher();
    openMenu();
    expect(screen.queryByText(/StoryBoard\/Condition events/i)).not.toBeInTheDocument();
    cleanup();

    useExecutionTargetStore.setState({ target: 'gt-sim' });
    renderSwitcher();
    openMenu();
    expect(screen.getByText(/StoryBoard\/Condition events/i)).toBeInTheDocument();
  });
});
