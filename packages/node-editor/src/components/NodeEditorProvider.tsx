/**
 * Provider component that sets up the editor store and scenario sync.
 * Wrap NodeEditor, TimelineView, and PropertyPanel within this provider.
 */

import type React from 'react';
import { createContext, useEffect, useMemo, useRef } from 'react';
import type { StoreApi } from 'zustand';
import type { ScenarioStore } from '@osce/scenario-engine';
import { createEditorStore, type EditorStoreApi } from '../store/editor-store.js';
import { useScenarioSync } from '../store/use-scenario-sync.js';

export const EditorStoreContext = createContext<EditorStoreApi | null>(null);
export const ScenarioStoreContext = createContext<StoreApi<ScenarioStore> | null>(null);

export interface NodeEditorProviderProps {
  scenarioStore: StoreApi<ScenarioStore>;
  selectedElementIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  focusNodeId?: string | null;
  onFocusComplete?: () => void;
  children: React.ReactNode;
}

function SyncBridge({
  scenarioStore,
  editorStore,
  selectedElementIds,
  onSelectionChange,
  focusNodeId,
  onFocusComplete,
}: {
  scenarioStore: StoreApi<ScenarioStore>;
  editorStore: EditorStoreApi;
  selectedElementIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  focusNodeId?: string | null;
  onFocusComplete?: () => void;
}) {
  useScenarioSync(scenarioStore, editorStore);

  // Sync external selection into editor store
  useEffect(() => {
    if (selectedElementIds) {
      editorStore.getState().setSelectedElementIds(selectedElementIds);
    }
  }, [selectedElementIds, editorStore]);

  // Sync external focusNodeId into editor store
  useEffect(() => {
    if (focusNodeId) {
      editorStore.getState().setFocusNodeId(focusNodeId);
    }
  }, [focusNodeId, editorStore]);

  // Report selection changes to parent
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  // Report focus completion to parent
  const onFocusCompleteRef = useRef(onFocusComplete);
  onFocusCompleteRef.current = onFocusComplete;

  useEffect(() => {
    const unsub = editorStore.subscribe((state, prevState) => {
      if (state.selectedElementIds !== prevState.selectedElementIds) {
        onSelectionChangeRef.current?.(state.selectedElementIds);
      }
      if (prevState.focusNodeId && !state.focusNodeId) {
        onFocusCompleteRef.current?.();
      }
    });
    return unsub;
  }, [editorStore]);

  return null;
}

export function NodeEditorProvider({
  scenarioStore,
  selectedElementIds,
  onSelectionChange,
  focusNodeId,
  onFocusComplete,
  children,
}: NodeEditorProviderProps) {
  const editorStore = useMemo(() => createEditorStore(), []);

  return (
    <ScenarioStoreContext.Provider value={scenarioStore}>
      <EditorStoreContext.Provider value={editorStore}>
        <SyncBridge
          scenarioStore={scenarioStore}
          editorStore={editorStore}
          selectedElementIds={selectedElementIds}
          onSelectionChange={onSelectionChange}
          focusNodeId={focusNodeId}
          onFocusComplete={onFocusComplete}
        />
        {children}
      </EditorStoreContext.Provider>
    </ScenarioStoreContext.Provider>
  );
}
