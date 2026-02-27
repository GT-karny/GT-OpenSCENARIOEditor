import { useStore } from 'zustand';
import type { ScenarioStore } from '@osce/scenario-engine';
import { useScenarioStoreContext } from './scenario-store-context';

/**
 * React hook to subscribe to the vanilla ScenarioStore with a selector.
 * Re-renders the component when the selected slice changes.
 */
export function useScenarioStore<T>(selector: (state: ScenarioStore) => T): T {
  const store = useScenarioStoreContext();
  return useStore(store, selector);
}

/**
 * Returns the raw StoreApi for imperative access (e.g., in event handlers).
 * Does NOT cause re-renders.
 */
export function useScenarioStoreApi() {
  return useScenarioStoreContext();
}
