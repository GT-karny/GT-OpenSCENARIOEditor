import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DebounceScheduler } from '../../lib/autosave/debounce-scheduler';

describe('DebounceScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('flushes once after the debounce quiet period', () => {
    const flush = vi.fn();
    const scheduler = new DebounceScheduler({ debounceMs: 2000, maxWaitMs: 30000, flush });

    scheduler.schedule();
    expect(flush).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1999);
    expect(flush).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('restarts the debounce timer on each schedule call', () => {
    const flush = vi.fn();
    const scheduler = new DebounceScheduler({ debounceMs: 2000, maxWaitMs: 30000, flush });

    scheduler.schedule();
    vi.advanceTimersByTime(1500);
    scheduler.schedule(); // resets the 2s debounce
    vi.advanceTimersByTime(1500);
    expect(flush).not.toHaveBeenCalled(); // 3s elapsed total, but last quiet was only 1.5s

    vi.advanceTimersByTime(500);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('flushes at the max-wait ceiling during continuous editing', () => {
    const flush = vi.fn();
    const scheduler = new DebounceScheduler({ debounceMs: 2000, maxWaitMs: 30000, flush });

    // Schedule every 1s so the 2s debounce never settles on its own.
    for (let i = 0; i < 35; i++) {
      scheduler.schedule();
      vi.advanceTimersByTime(1000);
    }

    // Max-wait fires at 30s from the first schedule, regardless of ongoing edits.
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('re-arms max-wait only after a flush, for the next burst', () => {
    const flush = vi.fn();
    const scheduler = new DebounceScheduler({ debounceMs: 2000, maxWaitMs: 30000, flush });

    scheduler.schedule();
    vi.advanceTimersByTime(2000); // first burst flushes via debounce
    expect(flush).toHaveBeenCalledTimes(1);

    // New burst: max-wait ceiling is fresh again.
    for (let i = 0; i < 35; i++) {
      scheduler.schedule();
      vi.advanceTimersByTime(1000);
    }
    expect(flush).toHaveBeenCalledTimes(2);
  });

  it('cancel() prevents a pending flush from firing', () => {
    const flush = vi.fn();
    const scheduler = new DebounceScheduler({ debounceMs: 2000, maxWaitMs: 30000, flush });

    scheduler.schedule();
    expect(scheduler.isPending()).toBe(true);
    scheduler.cancel();
    expect(scheduler.isPending()).toBe(false);

    vi.advanceTimersByTime(60000);
    expect(flush).not.toHaveBeenCalled();
  });

  it('reports pending state across the debounce window', () => {
    const flush = vi.fn();
    const scheduler = new DebounceScheduler({ debounceMs: 2000, maxWaitMs: 30000, flush });

    expect(scheduler.isPending()).toBe(false);
    scheduler.schedule();
    expect(scheduler.isPending()).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(scheduler.isPending()).toBe(false);
  });
});
