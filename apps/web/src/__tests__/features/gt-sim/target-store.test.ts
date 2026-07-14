import { describe, it, expect, beforeEach } from 'vitest';
import { useExecutionTargetStore } from '../../../features/gt-sim/target/store';

describe('execution-target store (WP5)', () => {
  beforeEach(() => {
    useExecutionTargetStore.setState({ target: 'wasm', nativeWindow: false, runningTarget: null });
  });

  it('defaults to the wasm target with the native window off and no running target', () => {
    const s = useExecutionTargetStore.getState();
    expect(s.target).toBe('wasm');
    expect(s.nativeWindow).toBe(false);
    expect(s.runningTarget).toBeNull();
  });

  it('setRunningTarget records the started backend independently of the selection', () => {
    useExecutionTargetStore.getState().setRunningTarget('wasm');
    // Selection changes must not clobber what is actually running (Stop
    // routes through runningTarget — see SimulationButtons).
    useExecutionTargetStore.getState().setTarget('gt-sim');
    expect(useExecutionTargetStore.getState().runningTarget).toBe('wasm');
    expect(useExecutionTargetStore.getState().target).toBe('gt-sim');
  });

  it('setTarget switches the active execution target', () => {
    useExecutionTargetStore.getState().setTarget('gt-sim');
    expect(useExecutionTargetStore.getState().target).toBe('gt-sim');
    useExecutionTargetStore.getState().setTarget('wasm');
    expect(useExecutionTargetStore.getState().target).toBe('wasm');
  });

  it('setNativeWindow toggles independently of the target', () => {
    useExecutionTargetStore.getState().setNativeWindow(true);
    expect(useExecutionTargetStore.getState().nativeWindow).toBe(true);
    // Switching target back to wasm does not implicitly reset the toggle —
    // the switcher UI is responsible for disabling it when not gt-sim.
    useExecutionTargetStore.getState().setTarget('wasm');
    expect(useExecutionTargetStore.getState().nativeWindow).toBe(true);
  });
});
