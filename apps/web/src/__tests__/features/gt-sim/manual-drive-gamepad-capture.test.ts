import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGamepadButtonCapture } from '../../../features/gt-sim/manual-drive/hooks/useGamepadButtonCapture';

/** Minimal fake matching the subset of the Gamepad interface the hook reads. */
function makeGamepad(pressed: boolean[]): Gamepad {
  return {
    buttons: pressed.map((p) => ({ pressed: p }) as GamepadButton),
  } as unknown as Gamepad;
}

describe('useGamepadButtonCapture', () => {
  let gamepads: (Gamepad | null)[];

  beforeEach(() => {
    gamepads = [];
    // Vitest's fake timers (via @sinonjs/fake-timers) fake
    // requestAnimationFrame/cancelAnimationFrame too — needed because jsdom
    // has no native rAF implementation, so the hook's poll loop would throw
    // synchronously on `startCapture()` without it.
    vi.useFakeTimers();
    vi.stubGlobal('navigator', {
      ...navigator,
      getGamepads: () => gamepads,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  /** Advance to and run exactly the next pending timer/frame (one rAF tick). */
  function flushNextFrame() {
    act(() => {
      vi.advanceTimersToNextTimer();
    });
  }

  it('starts not capturing', () => {
    const onCapture = vi.fn();
    const { result } = renderHook(() => useGamepadButtonCapture(onCapture));
    expect(result.current.capturing).toBe(false);
  });

  it('startCapture snapshots the baseline and sets capturing=true', () => {
    gamepads = [makeGamepad([false, true, false])];
    const onCapture = vi.fn();
    const { result } = renderHook(() => useGamepadButtonCapture(onCapture));

    act(() => {
      result.current.startCapture();
    });

    expect(result.current.capturing).toBe(true);
  });

  it('ignores a button that was already pressed at capture start (baseline)', () => {
    gamepads = [makeGamepad([false, true, false])];
    const onCapture = vi.fn();
    const { result } = renderHook(() => useGamepadButtonCapture(onCapture));

    act(() => {
      result.current.startCapture();
    });
    // Button 1 stays pressed (was already true in baseline) — no new press.
    flushNextFrame();

    expect(onCapture).not.toHaveBeenCalled();
    expect(result.current.capturing).toBe(true);
  });

  it('calls onCapture with the index of a newly pressed button and stops capturing', () => {
    gamepads = [makeGamepad([false, false, false])];
    const onCapture = vi.fn();
    const { result } = renderHook(() => useGamepadButtonCapture(onCapture));

    act(() => {
      result.current.startCapture();
    });

    // Button 2 transitions from unpressed to pressed before the next poll.
    gamepads = [makeGamepad([false, false, true])];
    flushNextFrame();

    expect(onCapture).toHaveBeenCalledTimes(1);
    expect(onCapture).toHaveBeenCalledWith(2);
    expect(result.current.capturing).toBe(false);
  });

  it('keeps polling (re-queues a frame) while no new press is detected', () => {
    gamepads = [makeGamepad([false, false])];
    const onCapture = vi.fn();
    const { result } = renderHook(() => useGamepadButtonCapture(onCapture));

    act(() => {
      result.current.startCapture();
    });
    flushNextFrame();
    flushNextFrame();
    flushNextFrame();

    expect(onCapture).not.toHaveBeenCalled();
    expect(result.current.capturing).toBe(true);
  });

  it('auto-cancels after the timeout without calling onCapture', () => {
    gamepads = [makeGamepad([false])];
    const onCapture = vi.fn();
    const { result } = renderHook(() => useGamepadButtonCapture(onCapture, 1000));

    act(() => {
      result.current.startCapture();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.capturing).toBe(false);
    expect(onCapture).not.toHaveBeenCalled();
  });

  it('cancel() stops capturing without calling onCapture', () => {
    gamepads = [makeGamepad([false])];
    const onCapture = vi.fn();
    const { result } = renderHook(() => useGamepadButtonCapture(onCapture));

    act(() => {
      result.current.startCapture();
    });
    act(() => {
      result.current.cancel();
    });

    expect(result.current.capturing).toBe(false);
    expect(onCapture).not.toHaveBeenCalled();

    // A stray press after cancel must not retroactively fire onCapture —
    // the poll loop was torn down, so there is no pending frame to flush.
    gamepads = [makeGamepad([true])];
    expect(vi.getTimerCount()).toBe(0);
    expect(onCapture).not.toHaveBeenCalled();
  });

  it('handles no connected gamepad gracefully (empty baseline, keeps polling)', () => {
    gamepads = [null];
    const onCapture = vi.fn();
    const { result } = renderHook(() => useGamepadButtonCapture(onCapture));

    act(() => {
      result.current.startCapture();
    });
    flushNextFrame();

    expect(onCapture).not.toHaveBeenCalled();
    expect(result.current.capturing).toBe(true);
  });
});
