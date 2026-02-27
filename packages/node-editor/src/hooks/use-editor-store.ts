/**
 * Typed hook for accessing the editor store from React context.
 */

import { useContext } from 'react';
import { useStore } from 'zustand';
import type { NodeEditorState } from '../store/editor-store.js';
import { EditorStoreContext } from '../components/NodeEditorProvider.js';

export function useEditorStore<T>(selector: (state: NodeEditorState) => T): T {
  const store = useContext(EditorStoreContext);
  if (!store) {
    throw new Error('useEditorStore must be used within a NodeEditorProvider');
  }
  return useStore(store, selector);
}
