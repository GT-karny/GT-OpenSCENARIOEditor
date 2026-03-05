/**
 * Hook that bridges EsminiWasmService to the simulation store.
 * Creates a singleton WASM service instance and registers callbacks
 * that feed frames, events, and completion into the Zustand store.
 */

import { useRef, useEffect, useCallback } from 'react';
import { EsminiWasmService } from '../lib/wasm/index.js';
import { useSimulationStore } from '../stores/simulation-store.js';

export function useWasmSimulation() {
  const serviceRef = useRef<EsminiWasmService | null>(null);

  // Lazily create the service (not during render)
  const getService = useCallback(() => {
    if (!serviceRef.current) {
      serviceRef.current = new EsminiWasmService();
    }
    return serviceRef.current;
  }, []);

  // Register store callbacks on mount.
  // Batch mode: frames and events are collected in the service/worker
  // and delivered all at once via onComplete / onBatch* callbacks.
  useEffect(() => {
    const service = getService();
    const store = useSimulationStore.getState;

    const unsubComplete = service.onComplete((result) => {
      console.warn(
        `[useWasmSimulation] onComplete: ${result.frames.length} frames, ` +
          `duration: ${result.duration.toFixed(2)}s`,
      );
      store().setCompleted(result);
      // Auto-play after batch completion
      store().play();
    });

    // Use batch callbacks instead of per-event callbacks
    const unsubSB = service.onBatchStoryBoardEvents((events) => {
      console.warn(`[useWasmSimulation] Batch storyboard events: ${events.length}`);
      store().setStoryBoardEvents(events);
    });
    const unsubCond = service.onBatchConditionEvents((events) => {
      console.warn(`[useWasmSimulation] Batch condition events: ${events.length}`);
      store().setConditionEvents(events);
    });
    const unsubError = service.onError((errorMessage) => {
      console.error('[useWasmSimulation] Simulation error:', errorMessage);
      store().setError(errorMessage);
    });

    return () => {
      unsubComplete();
      unsubSB();
      unsubCond();
      unsubError();
      service.dispose();
      serviceRef.current = null;
    };
  }, [getService]);

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
        const message = err instanceof Error ? err.message : String(err);
        useSimulationStore.getState().setError(message);
        throw err; // Re-throw so SimulationButtons catch can show toast
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
