/**
 * Framework-agnostic state machine that decides when a lost WebGL context
 * should be treated as unrecoverable and forces a full canvas remount.
 *
 * Browsers are supposed to fire `webglcontextrestored` automatically after a
 * `webglcontextlost` event, once the driver/GPU is ready again. On some
 * Windows/TDR-heavy configurations that event never arrives, so the renderer
 * stays paused forever with no way for the app to recover. This controller
 * gives the browser a bounded window to restore the *original* context and,
 * failing that, tells the caller to recreate the Canvas (and therefore the
 * whole WebGLRenderer) from scratch. If that keeps failing back-to-back, it
 * gives up so a persistent driver-level problem doesn't spin the app in an
 * infinite remount loop.
 *
 * Kept independent of React/R3F so it can be unit tested without a DOM or a
 * WebGL context.
 */

export interface ContextRecoveryOptions {
  /** Time to wait for a natural `webglcontextrestored` before forcing a remount. Default 3000ms. */
  timeoutMs?: number;
  /** Time a freshly (re)created context must run without loss before the failure streak resets. Default 3000ms. */
  stableMs?: number;
  /** Consecutive lost-without-recovery cycles allowed before giving up permanently. Default 3. */
  maxConsecutiveFailures?: number;
  /** Invoked when the timeout elapses without a restore — the caller should force-remount the canvas. */
  onRemount: () => void;
  /** Invoked once maxConsecutiveFailures is reached — the caller should stop retrying. */
  onGiveUp: () => void;
  /** Injectable timer scheduling, primarily for deterministic tests. Defaults to setTimeout. */
  setTimer?: (callback: () => void, delayMs: number) => number;
  /** Injectable timer cancellation, primarily for deterministic tests. Defaults to clearTimeout. */
  clearTimer?: (id: number) => void;
}

export interface ContextRecoveryController {
  /** Call from the `webglcontextlost` handler. */
  handleContextLost: () => void;
  /** Call from the `webglcontextrestored` handler. */
  handleContextRestored: () => void;
  /** Call once a (re)created canvas has produced a fresh WebGL context (e.g. R3F's `onCreated`). */
  handleContextCreated: () => void;
  /** Clear any pending timers — call on unmount. */
  dispose: () => void;
}

export const DEFAULT_RECOVERY_TIMEOUT_MS = 3000;
export const DEFAULT_RECOVERY_STABLE_MS = 3000;
export const DEFAULT_MAX_CONSECUTIVE_FAILURES = 3;

export function createContextRecoveryController(
  options: ContextRecoveryOptions,
): ContextRecoveryController {
  const {
    timeoutMs = DEFAULT_RECOVERY_TIMEOUT_MS,
    stableMs = DEFAULT_RECOVERY_STABLE_MS,
    maxConsecutiveFailures = DEFAULT_MAX_CONSECUTIVE_FAILURES,
    onRemount,
    onGiveUp,
    setTimer = (callback, delayMs) => setTimeout(callback, delayMs) as unknown as number,
    clearTimer = (id) => clearTimeout(id),
  } = options;

  let failureStreak = 0;
  let givenUp = false;
  let restoreTimerId: number | null = null;
  let stableTimerId: number | null = null;

  function clearRestoreTimer(): void {
    if (restoreTimerId !== null) {
      clearTimer(restoreTimerId);
      restoreTimerId = null;
    }
  }

  function clearStableTimer(): void {
    if (stableTimerId !== null) {
      clearTimer(stableTimerId);
      stableTimerId = null;
    }
  }

  function handleContextLost(): void {
    if (givenUp) return;
    // A loss before the previous remount was confirmed stable means it did
    // not actually fix anything — cancel the stability check so it can't
    // erase this failure streak later.
    clearStableTimer();
    if (restoreTimerId !== null) return; // already waiting on a previous loss
    restoreTimerId = setTimer(() => {
      restoreTimerId = null;
      failureStreak += 1;
      if (failureStreak >= maxConsecutiveFailures) {
        givenUp = true;
        onGiveUp();
        return;
      }
      onRemount();
    }, timeoutMs);
  }

  function handleContextRestored(): void {
    // The original context recovered on its own — the clearest possible
    // signal that things are healthy again.
    clearRestoreTimer();
    failureStreak = 0;
  }

  function handleContextCreated(): void {
    if (givenUp) return;
    // A fresh context, likely from a forced remount (or the initial mount).
    // Only treat it as a real recovery once it survives `stableMs` without
    // losing context again.
    clearStableTimer();
    stableTimerId = setTimer(() => {
      stableTimerId = null;
      failureStreak = 0;
    }, stableMs);
  }

  function dispose(): void {
    clearRestoreTimer();
    clearStableTimer();
  }

  return { handleContextLost, handleContextRestored, handleContextCreated, dispose };
}
