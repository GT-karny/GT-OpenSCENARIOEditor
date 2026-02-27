import { type NodeProps, type Node } from '@xyflow/react';
import type { EntityNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { Badge } from '../ui/badge.js';

export function EntityNode({ data, selected }: NodeProps<Node<EntityNodeData>>) {
  return (
    <NodeCard nodeType="entity" title={data.name} subtitle={data.entityType} selected={selected}>
      <Badge>{data.category}</Badge>
    </NodeCard>
  );
}
