/**
 * Trailing-edge debounce with a hard max-wait ceiling.
 *
 * Each call to {@link schedule} restarts the debounce timer (`debounceMs` after
 * the most recent call). To bound latency when changes keep arriving, the flush
 * is guaranteed to happen no later than `maxWaitMs` after the FIRST call of the
 * current burst — even if calls never stop coming.
 *
 * Pure scheduling logic with no I/O, so it is fully unit-testable with fake
 * timers. The supplied `flush` callback is invoked at most once per burst.
 */
export interface DebounceSchedulerOptions {
  /** Quiet period after the last change before flushing. */
  debounceMs: number;
  /** Maximum delay from the first change of a burst to the flush. */
  maxWaitMs: number;
  /** Called when a flush fires. */
  flush: () => void;
}

export class DebounceScheduler {
  private readonly debounceMs: number;
  private readonly maxWaitMs: number;
  private readonly flush: () => void;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private maxWaitTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: DebounceSchedulerOptions) {
    this.debounceMs = options.debounceMs;
    this.maxWaitMs = options.maxWaitMs;
    this.flush = options.flush;
  }

  /** Register a change. Starts/restarts the debounce; arms max-wait on first call. */
  schedule(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => this.fire(), this.debounceMs);

    // Arm the max-wait ceiling only on the first call of a burst.
    if (this.maxWaitTimer === null) {
      this.maxWaitTimer = setTimeout(() => this.fire(), this.maxWaitMs);
    }
  }

  /** Whether a flush is currently pending. */
  isPending(): boolean {
    return this.debounceTimer !== null || this.maxWaitTimer !== null;
  }

  /** Cancel any pending flush without firing it. */
  cancel(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.maxWaitTimer !== null) {
      clearTimeout(this.maxWaitTimer);
      this.maxWaitTimer = null;
    }
  }

  private fire(): void {
    this.cancel();
    this.flush();
  }
}
