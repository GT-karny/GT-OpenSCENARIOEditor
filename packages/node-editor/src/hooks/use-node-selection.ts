/**
 * Hook for managing node selection synchronization.
 */

import { useCallback, useContext } from 'react';
import type { OnSelectionChangeFunc } from '@xyflow/react';
import { EditorStoreContext } from '../components/NodeEditorProvider.js';

export function useNodeSelection(
  onSelectionChange?: (ids: string[]) => void,
): { handleSelectionChange: OnSelectionChangeFunc } {
  const store = useContext(EditorStoreContext);

  const handleSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes }) => {
      const ids = nodes.map((n) => n.id);
      if (store) {
        store.getState().setSelectedElementIds(ids);
      }
      onSelectionChange?.(ids);
    },
    [store, onSelectionChange],
  );

  return { handleSelectionChange };
}
