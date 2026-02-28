/**
 * Main React Flow canvas component.
 */

import { useCallback } from 'react';
import type { Node } from '@xyflow/react';
import type { OsceNodeData } from '../types/node-types.js';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
} from '@xyflow/react';
import { osceNodeTypes } from '../nodes/node-registry.js';
import { osceEdgeTypes } from '../edges/edge-registry.js';
import { useEditorStore } from '../hooks/use-editor-store.js';
import { useNodeSelection } from '../hooks/use-node-selection.js';
import { useKeyboardShortcuts } from '../hooks/use-keyboard-shortcuts.js';
import { NodeFocusBridge } from './NodeFocusBridge.js';

export interface NodeEditorProps {
  onSelectionChange?: (ids: string[]) => void;
  onDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  onPaneContextMenu?: (event: MouseEvent | React.MouseEvent) => void;
  onNodeContextMenu?: (event: React.MouseEvent, node: Node<OsceNodeData>) => void;
  deleteKeyCode?: string | string[] | null;
  disableBuiltinShortcuts?: boolean;
  className?: string;
}

export function NodeEditor({
  onSelectionChange,
  onDrop,
  onDragOver,
  onPaneContextMenu,
  onNodeContextMenu,
  deleteKeyCode = null,
  disableBuiltinShortcuts = false,
  className,
}: NodeEditorProps) {
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const setNodes = useEditorStore((s) => s.setNodes);
  const setEdges = useEditorStore((s) => s.setEdges);
  const setViewport = useEditorStore((s) => s.setViewport);

  const { handleSelectionChange } = useNodeSelection(onSelectionChange);
  useKeyboardShortcuts(disableBuiltinShortcuts);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes(applyNodeChanges(changes, nodes) as Node<OsceNodeData>[]);
    },
    [nodes, setNodes],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges],
  );

  return (
    <div className={`w-full h-full ${className ?? ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={osceNodeTypes}
        edgeTypes={osceEdgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={handleSelectionChange}
        onMoveEnd={(_event, viewport) => setViewport(viewport)}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        deleteKeyCode={deleteKeyCode}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <NodeFocusBridge />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          maskColor="rgba(9, 6, 26, 0.80)"
        />
      </ReactFlow>
    </div>
  );
}
