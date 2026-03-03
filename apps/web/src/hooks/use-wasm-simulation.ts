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

  // Register store callbacks on mount
  useEffect(() => {
    const service = getService();
    const store = useSimulationStore.getState;

    const unsubFrame = service.onFrame((frame) => {
      store().addFrame(frame);
    });
    const unsubComplete = service.onComplete((result) => {
      store().setCompleted(result);
    });
    const unsubSB = service.onStoryBoardEvent((event) => {
      store().addStoryBoardEvent(event);
    });
    const unsubCond = service.onConditionEvent((event) => {
      store().addConditionEvent(event);
    });

    return () => {
      unsubFrame();
      unsubComplete();
      unsubSB();
      unsubCond();
      service.dispose();
      serviceRef.current = null;
    };
  }, [getService]);

  const startSimulation = useCallback(
    async (xml: string, xodrData?: string, catalogXmls?: Record<string, string>) => {
      const service = getService();
      useSimulationStore.getState().reset();
      useSimulationStore.getState().setStatus('running');

      await service.startSimulation({
        scenarioXml: xml,
        xodrXml: xodrData,
        catalogXmls,
      });
    },
    [getService],
  );

  const stopSimulation = useCallback(async () => {
    const service = getService();
    await service.stopSimulation();
  }, [getService]);

  return { startSimulation, stopSimulation };
}
