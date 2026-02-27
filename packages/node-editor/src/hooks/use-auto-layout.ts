/**
 * Hook to trigger dagre auto-layout on demand.
 */

import { useCallback, useContext } from 'react';
import { EditorStoreContext } from '../components/NodeEditorProvider.js';
import { applyDagreLayout } from '../conversion/layout.js';
import type { LayoutOptions } from '../conversion/layout.js';

export function useAutoLayout() {
  const store = useContext(EditorStoreContext);

  const runLayout = useCallback(
    (options?: Partial<LayoutOptions>) => {
      if (!store) return;
      const { nodes, edges } = store.getState();
      const layoutedNodes = applyDagreLayout(nodes, edges, options);
      store.getState().setNodes(layoutedNodes);
    },
    [store],
  );

  return { runLayout };
}
