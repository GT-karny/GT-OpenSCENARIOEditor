/**
 * Hook that bridges `GtSimWsService` to the simulation store for the GT_Sim
 * execution target (WP5).
 *
 * Contrasts with `features/simulation/hooks/use-wasm-simulation.ts`:
 *  - WASM batches: all frames + StoryBoard/Condition events are delivered at
 *    once via `onComplete`/`onBatch*` once the run finishes.
 *  - GT_Sim streams: frames arrive one at a time over `/ws/osi/{jobId}` and
 *    are pushed to the store immediately via `addFrame`, so
 *    `SimulationViewerBridge`'s `status === 'running'` branch (which renders
 *    `frames[frames.length - 1]`) shows them live as they arrive.
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
import { useSimulationStore } from '@/features/simulation/stores/simulation-store';
import { useGtSimConnectionStore } from '../stores/gt-sim-connection-store';
import { getGtSimApi, getGtSimWsBaseUrl } from '../lib';

export interface GtSimSimulationTarget {
  projectId: string;
  scenarioId: string;
  paramOverrides?: Record<string, string>;
}

export function useGtSimSimulation() {
  const { t } = useTranslation('common');
  const serviceRef = useRef<GtSimWsService | null>(null);
  /** Unsubscribe for the per-run connection-loss watcher (see startSimulation). */
  const connWatchRef = useRef<(() => void) | null>(null);

  const teardown = useCallback(() => {
    connWatchRef.current?.();
    connWatchRef.current = null;
    serviceRef.current?.dispose();
    serviceRef.current = null;
  }, []);

  // Tear down any in-flight run on unmount (e.g. leaving execution mode).
  useEffect(() => teardown, [teardown]);

  // Single funnel for GT_Sim-side failures (transport/backend), mirroring
  // useWasmSimulation's surfaceError pattern for the WASM path.
  const surfaceError = useCallback(
    (raw: unknown) => {
      const message = raw instanceof Error ? raw.message : String(raw);
      console.error('[useGtSimSimulation] Simulation error:', message);
      useSimulationStore.getState().setError(message);
      toast.error(t('gtSim.target.runtime.error', { message }));
    },
    [t],
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
        useSimulationStore.getState().addFrame(frame);
      });
      service.onComplete((result) => {
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
    [surfaceError, t, teardown],
  );

  const stopSimulation = useCallback(async () => {
    await serviceRef.current?.stopSimulation();
  }, []);

  /** The GT_Sim job id of the current/last run, or `null` before the first run. */
  const getJobId = useCallback(() => serviceRef.current?.jobId ?? null, []);

  return { startSimulation, stopSimulation, getJobId };
}
