import { createContext, useContext, useRef, type ReactNode } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { ScenarioStore } from '@osce/scenario-engine';
import { createScenarioStore } from '@osce/scenario-engine';

const ScenarioStoreContext = createContext<StoreApi<ScenarioStore> | null>(null);

export function ScenarioStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<StoreApi<ScenarioStore> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createScenarioStore();
  }
  return (
    <ScenarioStoreContext.Provider value={storeRef.current}>{children}</ScenarioStoreContext.Provider>
  );
}

export function useScenarioStoreContext(): StoreApi<ScenarioStore> {
  const store = useContext(ScenarioStoreContext);
  if (!store) {
    throw new Error('useScenarioStoreContext must be used within ScenarioStoreProvider');
  }
  return store;
}
