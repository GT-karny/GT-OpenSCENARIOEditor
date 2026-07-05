/**
 * Hook that bridges EsminiWasmService to the simulation store.
 * Creates a singleton WASM service instance and registers callbacks
 * that feed frames, events, and completion into the Zustand store.
 */

import { useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@osce/i18n';
import { EsminiWasmService, classifySimError, toErrorMessage } from '../lib/wasm/index.js';
import { useSimulationStore } from '../stores/simulation-store.js';

export function useWasmSimulation() {
  const { t } = useTranslation('common');
  const serviceRef = useRef<EsminiWasmService | null>(null);

  // Lazily create the service (not during render)
  const getService = useCallback(() => {
    if (!serviceRef.current) {
      serviceRef.current = new EsminiWasmService();
    }
    return serviceRef.current;
  }, []);

  // Surface a worker/runtime error to the user as a toast + store error state.
  // This is the single funnel for ALL simulation failures (load, init, runtime,
  // timeout, worker crash) so nothing is left as a console-only message.
  const surfaceError = useCallback(
    (raw: unknown) => {
      const { key, message } = classifySimError(raw);
      console.error('[useWasmSimulation] Simulation error:', message);
      useSimulationStore.getState().setError(message);
      // The include-unsupported message is fully self-contained and actionable,
      // so it is toasted verbatim (no i18n template) — same pattern as other
      // literal, non-templated toasts in the app.
      if (key === 'simulation.includeUnsupported') {
        toast.error(message);
        return;
      }
      toast.error(t(key, { message }));
    },
    [t],
  );

  // Register store callbacks on mount.
  // Batch mode: frames and events are collected in the service/worker
  // and delivered all at once via onComplete / onBatch* callbacks.
  useEffect(() => {
    const service = getService();
    const store = useSimulationStore.getState;

    const unsubComplete = service.onComplete((result) => {
      store().setCompleted(result);
      // A "completed" run that produced no frames is effectively a failure
      // (esmini initialized but the scenario was empty/invalid).
      if (result.frames.length === 0) {
        surfaceError(t('simulation.noFrames'));
        return;
      }
      // Auto-play after batch completion
      store().play();
    });

    // Use batch callbacks instead of per-event callbacks
    const unsubSB = service.onBatchStoryBoardEvents((events) => {
      store().setStoryBoardEvents(events);
    });
    const unsubCond = service.onBatchConditionEvents((events) => {
      store().setConditionEvents(events);
    });
    const unsubError = service.onError((errorMessage) => {
      surfaceError(errorMessage);
    });

    return () => {
      unsubComplete();
      unsubSB();
      unsubCond();
      unsubError();
      service.dispose();
      serviceRef.current = null;
    };
  }, [getService, surfaceError, t]);

  const startSimulation = useCallback(
    async (xml: string, xodrData?: string, catalogXmls?: Record<string, string>) => {
      const service = getService();
      useSimulationStore.getState().reset();
      useSimulationStore.getState().setStatus('running');

      try {
        await service.startSimulation({
          scenarioXml: xml,
          xodrXml: xodrData,
          catalogXmls,
        });
      } catch (err) {
        // Load-phase failures (init error / timeout) reject here. They are ALSO
        // dispatched through onError → surfaceError, so toasting again would
        // duplicate. Just ensure the store reflects the error and swallow.
        useSimulationStore.getState().setError(toErrorMessage(err));
      }
    },
    [getService],
  );

  const stopSimulation = useCallback(async () => {
    const service = getService();
    await service.stopSimulation();
  }, [getService]);

  return { startSimulation, stopSimulation };
}
