/**
 * `useGtSimSimulation` (WP5) — the GT_Sim-target counterpart of
 * `use-wasm-simulation.ts`, wiring `GtSimWsService` to `simulation-store`.
 *
 * `GtSimWsService` itself is mocked (its own contract/WS behavior is covered
 * by `packages/esmini/src/__tests__/gt-sim-ws-service.test.ts`); this suite
 * pins the hook's wiring: `onFrame` -> local buffer -> rAF-flushed
 * `addFrames` batch (not the WASM one-shot batch pattern, and not a
 * synchronous per-frame `addFrame` either — see the hook's file header for
 * why), completion -> `setCompleted` + autoplay, zero-frame completion ->
 * error, and `onError` -> the store + a toast.
 *
 * `requestAnimationFrame`/`cancelAnimationFrame` are mocked in `beforeEach`
 * to fire synchronously (`cb(0)` immediately), so most tests can assert on
 * the store right after `emitFrame`/`act()` without caring about the flush
 * mechanism. The dedicated "buffering" tests below install a *controllable*
 * (non-auto-firing) rAF mock locally to actually observe the pre-flush
 * buffered state.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import type { SimulationFrame, SimulationResult } from '@osce/shared';
import { toast } from 'sonner';
import { useGtSimConnectionStore } from '../../../features/gt-sim/stores/gt-sim-connection-store';
import { useSimulationStore } from '../../../features/simulation/stores/simulation-store';
import { useGtSimSimulation } from '../../../features/gt-sim/target/use-gtsim-simulation';
import { initTestI18n } from '../../helpers/render-with-providers';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

// --- Fake GtSimWsService -----------------------------------------------------
//
// `vi.mock` factories are hoisted above every import in this file — including
// the static import of `use-gtsim-simulation.ts`, which itself imports
// '@osce/esmini' and so triggers this factory before this file's own
// top-level statements run. Anything the factory (or the class it installs)
// closes over must therefore live inside `vi.hoisted`, whose callback runs in
// that same hoisted position — a plain `class`/`let` declared later in this
// file's source order would still be in the temporal dead zone.
const { FakeGtSimWsService, lastHandle } = vi.hoisted(() => {
  const registry: { current: unknown } = { current: null };

  class FakeGtSimWsService {
    jobId = 'job-abc-123';
    options: unknown;
    startSimulation = vi.fn(() => Promise.resolve());
    stopSimulation = vi.fn(() => Promise.resolve());
    dispose = vi.fn();
    private frameCb: ((frame: unknown) => void) | null = null;
    private completeCb: ((result: unknown) => void) | null = null;
    private errorCb: ((err: Error) => void) | null = null;

    constructor(options: unknown) {
      this.options = options;
      registry.current = {
        options,
        emitFrame: (frame: unknown) => this.frameCb?.(frame),
        emitComplete: (result: unknown) => this.completeCb?.(result),
        emitError: (err: Error) => this.errorCb?.(err),
        stopSimulation: this.stopSimulation,
        dispose: this.dispose,
      };
    }
    onFrame(cb: (frame: unknown) => void) {
      this.frameCb = cb;
      return () => {
        this.frameCb = null;
      };
    }
    onComplete(cb: (result: unknown) => void) {
      this.completeCb = cb;
      return () => {
        this.completeCb = null;
      };
    }
    onError(cb: (err: Error) => void) {
      this.errorCb = cb;
      return () => {
        this.errorCb = null;
      };
    }
  }

  return {
    FakeGtSimWsService,
    // `.current` is reassigned per `new FakeGtSimWsService(...)`; tests read
    // `lastHandle.current` (never destructure — the reference changes).
    lastHandle: registry,
  };
});

vi.mock('@osce/esmini', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@osce/esmini')>();
  return { ...actual, GtSimWsService: FakeGtSimWsService };
});

// --- Fixtures ----------------------------------------------------------------

interface FakeServiceHandle {
  options: unknown;
  emitFrame: (frame: SimulationFrame) => void;
  emitComplete: (result: SimulationResult) => void;
  emitError: (err: Error) => void;
  stopSimulation: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}

function handle(): FakeServiceHandle {
  const h = lastHandle.current as FakeServiceHandle | null;
  if (!h) throw new Error('No FakeGtSimWsService constructed yet');
  return h;
}

const frame = (time: number): SimulationFrame => ({ time, objects: [] });

function setReady() {
  useGtSimConnectionStore.getState().applyStatus({
    state: 'ready',
    endpoints: {
      restBaseUrl: 'http://127.0.0.1:8000',
      wsBaseUrl: 'ws://127.0.0.1:8000',
      grpcPort: 50051,
    },
  });
}

beforeEach(async () => {
  await initTestI18n();
  lastHandle.current = null;
  useGtSimConnectionStore.getState().reset();
  useSimulationStore.getState().reset();
  vi.clearAllMocks();

  // Default: rAF fires synchronously so the frame buffer flushes to the
  // store within the same `act()` as `emitFrame` (see file header). Tests
  // that need to observe the pre-flush buffered state override this locally.
  //
  // Guarded against re-entrant scheduling: `onComplete` -> `setCompleted` ->
  // `play()` starts `simulation-store`'s own playback loop, whose `tick()`
  // reschedules itself via `requestAnimationFrame(tick)` on every call. A
  // naive `cb(0)` mock would invoke that reschedule synchronously from
  // within `cb(0)` itself, recursing forever (stack overflow). Callbacks
  // requested *while already draining* one are queued instead of invoked
  // immediately — this hook's own flush callback never re-requests an rAF
  // from inside itself, so this only changes behavior for that self-
  // rescheduling loop, and none of these tests assert on its advancement.
  let draining = false;
  let rafIdCounter = 0;
  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
    const id = ++rafIdCounter;
    if (draining) return id;
    draining = true;
    try {
      cb(0);
    } finally {
      draining = false;
    }
    return id;
  });
  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  // RTL auto-cleanup is off in this repo — unmount explicitly so each test's
  // hook instance tears down (disposing its service AND unsubscribing its
  // connection-loss watcher). A stale watcher from a previous test would
  // otherwise consume the store push first and skew the assertions.
  cleanup();
  vi.restoreAllMocks();
});

describe('useGtSimSimulation', () => {
  it('surfaces an error and does not construct a service when the backend is not connected', async () => {
    const { result } = renderHook(() => useGtSimSimulation());

    await act(async () => {
      await result.current.startSimulation({ projectId: 'p1', scenarioId: 's1.xosc' });
    });

    expect(lastHandle.current).toBeNull();
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(useSimulationStore.getState().status).toBe('error');
  });

  it('constructs GtSimWsService with the project/scenario/execution options and starts it', async () => {
    setReady();
    const { result } = renderHook(() => useGtSimSimulation());

    await act(async () => {
      await result.current.startSimulation(
        { projectId: 'p1', scenarioId: 's1.xosc' },
        { headless: false },
      );
    });

    expect(lastHandle.current).not.toBeNull();
    expect(handle().options).toMatchObject({
      wsBaseUrl: 'ws://127.0.0.1:8000',
      projectId: 'p1',
      scenarioId: 's1.xosc',
      execution: { headless: false },
    });
    expect(useSimulationStore.getState().status).toBe('running');
    expect(result.current.getJobId()).toBe('job-abc-123');
  });

  it('pushes streamed frames to the store via the rAF-flushed buffer (not a WASM-style one-shot batch)', async () => {
    setReady();
    const { result } = renderHook(() => useGtSimSimulation());
    await act(async () => {
      await result.current.startSimulation({ projectId: 'p1', scenarioId: 's1.xosc' });
    });

    // rAF is mocked to fire synchronously (see beforeEach), so each emitted
    // frame's scheduled flush resolves within the same `act()`.
    act(() => handle().emitFrame(frame(0)));
    expect(useSimulationStore.getState().frames).toHaveLength(1);

    act(() => handle().emitFrame(frame(0.1)));
    expect(useSimulationStore.getState().frames).toHaveLength(2);
    expect(useSimulationStore.getState().status).toBe('running');
  });

  it('buffers a burst of frames and delivers them as a single batch on the rAF flush, with none lost', async () => {
    // Controllable (non-auto-firing) rAF for this test only, so the
    // pre-flush buffered state is observable.
    let rafCallback: FrameRequestCallback | null = null;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    setReady();
    const { result } = renderHook(() => useGtSimSimulation());
    await act(async () => {
      await result.current.startSimulation({ projectId: 'p1', scenarioId: 's1.xosc' });
    });

    const FRAME_COUNT = 50;
    act(() => {
      for (let i = 0; i < FRAME_COUNT; i++) {
        handle().emitFrame(frame(i * 0.01));
      }
    });

    // Nothing reaches the store until the (single) scheduled flush runs.
    expect(useSimulationStore.getState().frames).toHaveLength(0);
    expect(rafCallback).not.toBeNull();

    act(() => rafCallback?.(0));

    // Every buffered frame arrives in one batch -- none dropped.
    expect(useSimulationStore.getState().frames).toHaveLength(FRAME_COUNT);
    expect(useSimulationStore.getState().status).toBe('running');
  });

  it('flushes any buffered frames on teardown (unmount) so none are lost', async () => {
    let rafCallback: FrameRequestCallback | null = null;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    setReady();
    const { result, unmount } = renderHook(() => useGtSimSimulation());
    await act(async () => {
      await result.current.startSimulation({ projectId: 'p1', scenarioId: 's1.xosc' });
    });

    act(() => {
      handle().emitFrame(frame(0));
      handle().emitFrame(frame(0.1));
      handle().emitFrame(frame(0.2));
    });

    // Buffered, not yet in the store -- the rAF flush hasn't run.
    expect(useSimulationStore.getState().frames).toHaveLength(0);
    expect(rafCallback).not.toBeNull();

    // Unmount tears the hook down (its `useEffect` cleanup) before any rAF
    // flush fires -- the buffer must still be drained into the store.
    act(() => unmount());

    expect(useSimulationStore.getState().frames).toHaveLength(3);
  });

  it('onComplete with frames sets the store to completed and autoplays', async () => {
    setReady();
    const { result } = renderHook(() => useGtSimSimulation());
    await act(async () => {
      await result.current.startSimulation({ projectId: 'p1', scenarioId: 's1.xosc' });
    });

    act(() =>
      handle().emitComplete({ status: 'completed', frames: [frame(0), frame(0.1)], duration: 0.1 }),
    );

    const s = useSimulationStore.getState();
    expect(s.status).toBe('completed');
    expect(s.frames).toHaveLength(2);
    expect(s.isPlaying).toBe(true);
  });

  it('onComplete with zero frames surfaces a noFrames error', async () => {
    setReady();
    const { result } = renderHook(() => useGtSimSimulation());
    await act(async () => {
      await result.current.startSimulation({ projectId: 'p1', scenarioId: 's1.xosc' });
    });

    act(() => handle().emitComplete({ status: 'completed', frames: [], duration: 0 }));

    expect(useSimulationStore.getState().status).toBe('error');
    expect(toast.error).toHaveBeenCalled();
  });

  it('onError surfaces the failure to the store and a toast', async () => {
    setReady();
    const { result } = renderHook(() => useGtSimSimulation());
    await act(async () => {
      await result.current.startSimulation({ projectId: 'p1', scenarioId: 's1.xosc' });
    });

    act(() => handle().emitError(new Error('backend unreachable')));

    expect(useSimulationStore.getState().status).toBe('error');
    expect(useSimulationStore.getState().error).toBe('backend unreachable');
    expect(toast.error).toHaveBeenCalled();
  });

  it('stopSimulation delegates to the underlying service', async () => {
    setReady();
    const { result } = renderHook(() => useGtSimSimulation());
    await act(async () => {
      await result.current.startSimulation({ projectId: 'p1', scenarioId: 's1.xosc' });
    });

    await act(async () => {
      await result.current.stopSimulation();
    });

    expect(handle().stopSimulation).toHaveBeenCalledTimes(1);
  });

  it('a second startSimulation call disposes the previous service instance', async () => {
    setReady();
    const { result } = renderHook(() => useGtSimSimulation());
    await act(async () => {
      await result.current.startSimulation({ projectId: 'p1', scenarioId: 's1.xosc' });
    });
    const firstHandle = handle();

    await act(async () => {
      await result.current.startSimulation({ projectId: 'p1', scenarioId: 's2.xosc' });
    });

    expect(firstHandle.dispose).toHaveBeenCalledTimes(1);
    expect(handle().options).toMatchObject({ scenarioId: 's2.xosc' });
  });

  it('tears down and errors when the backend connection is lost mid-run (review fix)', async () => {
    setReady();
    const { result } = renderHook(() => useGtSimSimulation());
    await act(async () => {
      await result.current.startSimulation({ projectId: 'p1', scenarioId: 's1.xosc' });
    });
    expect(useSimulationStore.getState().status).toBe('running');
    const runHandle = handle();

    // Backend crashes mid-run: the connection store leaves `ready`.
    act(() => {
      useGtSimConnectionStore.getState().applyStatus({ state: 'crashed', message: 'boom' });
    });

    expect(runHandle.dispose).toHaveBeenCalledTimes(1);
    expect(useSimulationStore.getState().status).toBe('error');
    expect(toast.error).toHaveBeenCalled();
  });

  it('a connection-state change after completion does NOT overwrite the completed result', async () => {
    setReady();
    const { result } = renderHook(() => useGtSimSimulation());
    await act(async () => {
      await result.current.startSimulation({ projectId: 'p1', scenarioId: 's1.xosc' });
    });
    act(() =>
      handle().emitComplete({ status: 'completed', frames: [frame(0), frame(0.1)], duration: 0.1 }),
    );
    expect(useSimulationStore.getState().status).toBe('completed');

    act(() => {
      useGtSimConnectionStore.getState().applyStatus({ state: 'crashed', message: 'late crash' });
    });

    // Guarded on status === 'running' — the finished run keeps its result.
    expect(useSimulationStore.getState().status).toBe('completed');
  });
});
