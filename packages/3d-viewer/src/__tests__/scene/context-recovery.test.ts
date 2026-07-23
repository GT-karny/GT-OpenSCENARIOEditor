import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createContextRecoveryController,
  DEFAULT_RECOVERY_TIMEOUT_MS,
  DEFAULT_RECOVERY_STABLE_MS,
} from '../../scene/context-recovery.js';

describe('createContextRecoveryController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('forces a remount when no restore arrives before the timeout', () => {
    const onRemount = vi.fn();
    const onGiveUp = vi.fn();
    const controller = createContextRecoveryController({ onRemount, onGiveUp });

    controller.handleContextLost();
    expect(onRemount).not.toHaveBeenCalled();

    vi.advanceTimersByTime(DEFAULT_RECOVERY_TIMEOUT_MS);

    expect(onRemount).toHaveBeenCalledTimes(1);
    expect(onGiveUp).not.toHaveBeenCalled();
  });

  it('does not remount when the context restores before the timeout', () => {
    const onRemount = vi.fn();
    const onGiveUp = vi.fn();
    const controller = createContextRecoveryController({ onRemount, onGiveUp });

    controller.handleContextLost();
    vi.advanceTimersByTime(DEFAULT_RECOVERY_TIMEOUT_MS / 2);
    controller.handleContextRestored();

    // Advance well past the original timeout — the pending timer must have
    // been cancelled by the restore, so no remount should ever fire.
    vi.advanceTimersByTime(DEFAULT_RECOVERY_TIMEOUT_MS * 2);

    expect(onRemount).not.toHaveBeenCalled();
    expect(onGiveUp).not.toHaveBeenCalled();
  });

  it('gives up and stops after maxConsecutiveFailures consecutive losses', () => {
    const onRemount = vi.fn();
    const onGiveUp = vi.fn();
    const controller = createContextRecoveryController({
      onRemount,
      onGiveUp,
      maxConsecutiveFailures: 3,
    });

    // Cycle 1: lost -> timeout -> remount (failure 1/3).
    controller.handleContextLost();
    vi.advanceTimersByTime(DEFAULT_RECOVERY_TIMEOUT_MS);
    expect(onRemount).toHaveBeenCalledTimes(1);

    // Simulate the caller remounting and a fresh context being created, but
    // it is lost again immediately — before the stability window elapses —
    // so the previous failure is not forgiven.
    controller.handleContextCreated();
    controller.handleContextLost();
    vi.advanceTimersByTime(DEFAULT_RECOVERY_TIMEOUT_MS);
    expect(onRemount).toHaveBeenCalledTimes(2); // failure 2/3

    controller.handleContextCreated();
    controller.handleContextLost();
    vi.advanceTimersByTime(DEFAULT_RECOVERY_TIMEOUT_MS);

    // Third consecutive failure hits the cap: give up instead of remounting again.
    expect(onGiveUp).toHaveBeenCalledTimes(1);
    expect(onRemount).toHaveBeenCalledTimes(2);

    // Further loss events after giving up must be ignored entirely — no
    // infinite remount loop.
    controller.handleContextLost();
    vi.advanceTimersByTime(DEFAULT_RECOVERY_TIMEOUT_MS * 2);
    expect(onRemount).toHaveBeenCalledTimes(2);
    expect(onGiveUp).toHaveBeenCalledTimes(1);
  });

  it('resets the failure streak once a remounted context stays stable', () => {
    const onRemount = vi.fn();
    const onGiveUp = vi.fn();
    const controller = createContextRecoveryController({
      onRemount,
      onGiveUp,
      maxConsecutiveFailures: 2,
    });

    // Failure 1/2.
    controller.handleContextLost();
    vi.advanceTimersByTime(DEFAULT_RECOVERY_TIMEOUT_MS);
    expect(onRemount).toHaveBeenCalledTimes(1);

    // This time the remounted context survives past the stability window —
    // the streak should reset to 0.
    controller.handleContextCreated();
    vi.advanceTimersByTime(DEFAULT_RECOVERY_STABLE_MS);

    // Two more isolated losses, each recovering, should not trigger give-up
    // since the earlier streak was cleared by the stable period.
    controller.handleContextLost();
    vi.advanceTimersByTime(DEFAULT_RECOVERY_TIMEOUT_MS);
    expect(onRemount).toHaveBeenCalledTimes(2);
    expect(onGiveUp).not.toHaveBeenCalled();
  });

  it('cleans up pending timers on dispose without firing callbacks', () => {
    const onRemount = vi.fn();
    const onGiveUp = vi.fn();
    const controller = createContextRecoveryController({ onRemount, onGiveUp });

    controller.handleContextLost();
    controller.dispose();

    vi.advanceTimersByTime(DEFAULT_RECOVERY_TIMEOUT_MS * 2);

    expect(onRemount).not.toHaveBeenCalled();
    expect(onGiveUp).not.toHaveBeenCalled();
  });
});
