/**
 * Hook that bridges `GtSimWsService` to the simulation store for the GT_Sim
 * execution target (WP5).
 *
 * Contrasts with `features/simulation/hooks/use-wasm-simulation.ts`:
 *  - WASM batches: all frames + StoryBoard/Condition events are delivered at
 *    once via `onComplete`/`onBatch*` once the run finishes.
 *  - GT_Sim streams: frames arrive over `/ws/osi/{jobId}` at up to ~100Hz
 *    (far above display refresh rate). Pushing each one straight into the
 *    store via `addFrame` was an O(n^2) memory churn (`[...frames, frame]`
 *    every frame) and drove `SimulationViewerBridge`'s subscribers to
 *    re-render/rebuild the 3D scene far faster than the GPU could keep up —
 *    the root cause of the `THREE.WebGLRenderer: Context Lost` freeze seen
 *    running scenarios against GT_Sim. Frames are instead buffered locally
 *    and flushed to the store in batches (see `scheduleFlush`/`flushFrameBuffer`
 *    below), mirroring the rAF-coalescing already used by the live-view
 *    `useOsiStream` hook. `SimulationViewerBridge`'s `status === 'running'`
 *    branch (which renders the latest frame) still shows them live, just at
 *    a bounded flush rate.
 *
 * GT_Sim executes a named project scenario file, not the in-editor XML — so
 * `startSimulation` here takes `{ projectId, scenarioId }` (reusing the
 * run-form's project/scenario selection) instead of serialized XML.
 *
 * StoryBoard/Condition introspection is WASM-only (C++ instrumentation,
 * migration-plan risk R3): this hook never calls `setStoryBoardEvents` /
 * `setConditionEvents`, so `activeElements` stays empty for GT_Sim runs. The
 * limitation is surfaced to the user by `TargetSwitcher`, not re-derived here.
 */
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@osce/i18n';
import { GtSimWsService } from '@osce/esmini';
import type { GtSimExecutionOverrides } from '@osce/esmini';
import type { SimulationFrame } from '@osce/shared';
import { useSimulationStore } from '@/features/simulation/stores/simulation-store';
import { useGtSimConnectionStore } from '../stores/gt-sim-connection-store';
import { getGtSimApi, getGtSimWsBaseUrl } from '../lib';

export interface GtSimSimulationTarget {
  projectId: string;
  scenarioId: string;
  paramOverrides?: Record<string, string>;
}

/**
 * Safety-net flush interval (ms) for when `requestAnimationFrame` is absent
 * (non-browser test environment) or throttled/paused (backgrounded/hidden
 * tab) — bounds how long frames can accumulate in the local buffer so it
 * never grows unbounded while the tab isn't being painted.
 */
const FLUSH_FALLBACK_MS = 250;

export function useGtSimSimulation() {
  const { t } = useTranslation('common');
  const serviceRef = useRef<GtSimWsService | null>(null);
  /** Unsubscribe for the per-run connection-loss watcher (see startSimulation). */
  const connWatchRef = useRef<(() => void) | null>(null);

  // Local frame buffer + rAF batching (see file header). `flushFrameBuffer`
  // is the single place that drains the buffer into the store; every other
  // path (rAF tick, fallback timer, teardown, completion, error) funnels
  // through it so no buffered frame is ever silently dropped.
  const frameBufferRef = useRef<SimulationFrame[]>([]);
  const rafHandleRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks "a flush is pending" independent of the rAF/timer handles above.
  // Deliberately NOT derived from `rafHandleRef.current !== null`: this flag
  // is set *before* `requestAnimationFrame` is called, so it stays correct
  // even if the callback runs synchronously (as test-mocked rAF does in this
  // repo's suites) — in that case `flushFrameBuffer` clears this flag before
  // `requestAnimationFrame` has returned a handle to assign, so gating on the
  // handle itself would (and, pre-fix, did) leave a stale non-null handle
  // that silently blocked every subsequent frame's flush from being
  // scheduled at all.
  const flushScheduledRef = useRef(false);

  const flushFrameBuffer = useCallback(() => {
    flushScheduledRef.current = false;
    if (rafHandleRef.current !== null) {
      cancelAnimationFrame(rafHandleRef.current);
      rafHandleRef.current = null;
    }
    if (fallbackTimerRef.current !== null) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (frameBufferRef.current.length === 0) return;
    const batch = frameBufferRef.current;
    frameBufferRef.current = [];
    useSimulationStore.getState().addFrames(batch);
  }, []);

  const scheduleFlush = useCallback(() => {
    // A flush is already pending (rAF and/or fallback timer armed).
    if (flushScheduledRef.current) return;
    flushScheduledRef.current = true;
    if (typeof requestAnimationFrame === 'function') {
      rafHandleRef.current = requestAnimationFrame(flushFrameBuffer);
    }
    // Always arm the fallback timer alongside rAF: a backgrounded/hidden tab
    // throttles or fully pauses rAF, which would otherwise let the buffer
    // grow unbounded until the tab is foregrounded again. Whichever fires
    // first flushes and cancels the other (see flushFrameBuffer).
    fallbackTimerRef.current = setTimeout(flushFrameBuffer, FLUSH_FALLBACK_MS);
  }, [flushFrameBuffer]);

  const teardown = useCallback(() => {
    connWatchRef.current?.();
    connWatchRef.current = null;
    // Drain any buffered frames before disposing so a run that gets torn
    // down mid-flush doesn't silently lose its last batch.
    flushFrameBuffer();
    serviceRef.current?.dispose();
    serviceRef.current = null;
  }, [flushFrameBuffer]);

  // Tear down any in-flight run on unmount (e.g. leaving execution mode).
  useEffect(() => teardown, [teardown]);

  // Single funnel for GT_Sim-side failures (transport/backend), mirroring
  // useWasmSimulation's surfaceError pattern for the WASM path.
  const surfaceError = useCallback(
    (raw: unknown) => {
      // Same rationale as teardown(): don't drop frames still sitting in the
      // local buffer when a run transitions to 'error'.
      flushFrameBuffer();
      const message = raw instanceof Error ? raw.message : String(raw);
      console.error('[useGtSimSimulation] Simulation error:', message);
      useSimulationStore.getState().setError(message);
      toast.error(t('gtSim.target.runtime.error', { message }));
    },
    [t, flushFrameBuffer],
  );

  const startSimulation = useCallback(
    async (target: GtSimSimulationTarget, execution?: GtSimExecutionOverrides) => {
      const api = getGtSimApi();
      const wsBaseUrl = getGtSimWsBaseUrl();
      if (!api || !wsBaseUrl) {
        surfaceError(t('gtSim.target.runtime.notConnected'));
        return;
      }

      // GtSimWsService's project/scenario/execution options are fixed at
      // construction — a fresh instance per run (rather than mutating one).
      teardown();
      const service = new GtSimWsService({
        api,
        wsBaseUrl,
        projectId: target.projectId,
        scenarioId: target.scenarioId,
        paramOverrides: target.paramOverrides,
        execution,
      });
      serviceRef.current = service;

      service.onFrame((frame) => {
        frameBufferRef.current.push(frame);
        scheduleFlush();
      });
      service.onComplete((result) => {
        // Drain any frames still sitting in the local buffer first — result
        // is the server's own full/authoritative frame list and overwrites
        // the store's frames wholesale via setCompleted, but flushing keeps
        // the buffer/rAF handles clean before the state transition (no
        // dangling scheduled flush racing a subsequent run).
        flushFrameBuffer();
        useSimulationStore.getState().setCompleted(result);
        // Mirrors useWasmSimulation: a "completed" run with zero frames is a
        // failure (job accepted but never produced a frame).
        if (result.frames.length === 0) {
          surfaceError(t('gtSim.target.runtime.noFrames'));
          return;
        }
        useSimulationStore.getState().play();
      });
      service.onError((err) => surfaceError(err));

      useSimulationStore.getState().reset();
      useSimulationStore.getState().setStatus('running');

      // Connection-loss fallback (review finding): if the backend leaves
      // `ready` mid-run (crashed / failed / disconnected), the REST poll and
      // WS reconnect inside GtSimWsService can keep spinning against a dead
      // endpoint — tear the run down promptly and surface the failure. The
      // running-status guard makes a late/racing push after completion a
      // no-op. `teardown()` also unsubscribes this watcher itself.
      connWatchRef.current = useGtSimConnectionStore.subscribe((s) => {
        if (s.state !== 'ready' && useSimulationStore.getState().status === 'running') {
          teardown();
          surfaceError(t('gtSim.target.runtime.connectionLost'));
        }
      });

      try {
        // GtSimWsService ignores `scenarioXml` (it runs the project scenario
        // named via `projectId`/`scenarioId` above) — the empty string
        // satisfies `IEsminiService.startSimulation`'s shape only.
        await service.startSimulation({ scenarioXml: '' });
      } catch (err) {
        // Load-phase failures also fire through onError -> surfaceError;
        // this catch only ensures the store reflects the error if that
        // dispatch raced with the throw.
        useSimulationStore.getState().setError(err instanceof Error ? err.message : String(err));
      }
    },
    [surfaceError, t, teardown, scheduleFlush, flushFrameBuffer],
  );

  const stopSimulation = useCallback(async () => {
    await serviceRef.current?.stopSimulation();
  }, []);

  /** The GT_Sim job id of the current/last run, or `null` before the first run. */
  const getJobId = useCallback(() => serviceRef.current?.jobId ?? null, []);

  return { startSimulation, stopSimulation, getJobId };
}
