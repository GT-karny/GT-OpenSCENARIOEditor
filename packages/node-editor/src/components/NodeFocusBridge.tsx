/**
 * Internal bridge component rendered inside <ReactFlow> to handle
 * programmatic viewport focus on a specific node.
 * Must be a child of ReactFlow to access useReactFlow().
 */

import { useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useEditorStore } from '../hooks/use-editor-store.js';

export function NodeFocusBridge() {
  const focusNodeId = useEditorStore((s) => s.focusNodeId);
  const setFocusNodeId = useEditorStore((s) => s.setFocusNodeId);
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!focusNodeId) return;

    fitView({
      nodes: [{ id: focusNodeId }],
      duration: 300,
      padding: 0.5,
    });

    setFocusNodeId(null);
  }, [focusNodeId, fitView, setFocusNodeId]);

  return null;
}
