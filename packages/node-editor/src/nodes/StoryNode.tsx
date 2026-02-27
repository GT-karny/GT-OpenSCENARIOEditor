import { Position, type NodeProps, type Node } from '@xyflow/react';
import type { StoryNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { Badge } from '../ui/badge.js';
import { NodeHandle } from '../ui/node-handle.js';

export function StoryNode({ data, selected }: NodeProps<Node<StoryNodeData>>) {
  return (
    <NodeCard
      nodeType="story"
      title={data.name}
      selected={selected}
      collapsed={data.collapsed}
      badges={<Badge>{data.actCount} acts</Badge>}
    >
      <NodeHandle type="target" position={Position.Top} />
      <NodeHandle type="source" position={Position.Bottom} />
    </NodeCard>
  );
}
