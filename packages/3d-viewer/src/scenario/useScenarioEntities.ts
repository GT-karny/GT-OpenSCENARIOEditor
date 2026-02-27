/**
 * Hook to subscribe to scenario-engine store and extract entities.
 */

import { useStore } from 'zustand';
import type { ScenarioEntity } from '@osce/shared';

/**
 * Subscribe to the scenario store and return the current entities array.
 * Re-renders only when the entities array changes.
 */
export function useScenarioEntities(
  store: ReturnType<typeof import('@osce/scenario-engine').createScenarioStore>,
): ScenarioEntity[] {
  return useStore(store, (state: { document: { entities: ScenarioEntity[] } }) => state.document.entities);
}
