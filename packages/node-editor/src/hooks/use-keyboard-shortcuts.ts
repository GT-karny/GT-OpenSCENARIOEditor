/**
 * Hook for keyboard shortcuts in the node editor.
 */

import { useEffect, useContext } from 'react';
import type { StoreApi } from 'zustand';
import type { ScenarioStore } from '@osce/scenario-engine';
import { ScenarioStoreContext } from '../components/NodeEditorProvider.js';

export function useKeyboardShortcuts(disabled = false) {
  const scenarioStore = useContext(ScenarioStoreContext);

  useEffect(() => {
    if (!scenarioStore || disabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const store = scenarioStore as StoreApi<ScenarioStore>;
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.getState().undo();
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        store.getState().redo();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [scenarioStore, disabled]);
}
