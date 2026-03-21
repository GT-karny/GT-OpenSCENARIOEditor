/**
 * Hook that returns the set of ScenarioDocument element IDs
 * currently in "running" state during simulation playback.
 */

import { useMemo } from 'react';
import { useSimulationStore } from '../stores/simulation-store';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { buildFullPathToIdMap } from '../lib/fullpath-mapping';

const EMPTY_SET = new Set<string>();

export function useActiveSimulationIds(): Set<string> {
  const activeElements = useSimulationStore((s) => s.activeElements);
  const scenarioStoreApi = useScenarioStoreApi();

  return useMemo(() => {
    if (activeElements.length === 0) return EMPTY_SET;
    const doc = scenarioStoreApi.getState().document;
    const map = buildFullPathToIdMap(doc);
    const ids = new Set<string>();
    for (const path of activeElements) {
      const id = map.get(path);
      if (id) ids.add(id);
    }
    return ids;
  }, [activeElements, scenarioStoreApi]);
}
