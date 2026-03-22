import { type NodeProps, type Node } from '@xyflow/react';
import type { EntityNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { Badge } from '../ui/badge.js';
import { useEditorStore } from '../hooks/use-editor-store.js';

export function EntityNode({ id, data, selected }: NodeProps<Node<EntityNodeData>>) {
  const isRunning = useEditorStore((s) => s.activeNodeIds.has(id));
  return (
    <NodeCard nodeType="entity" title={data.name} subtitle={data.entityType} selected={selected} running={isRunning}>
      <Badge>{data.category}</Badge>
    </NodeCard>
  );
}
