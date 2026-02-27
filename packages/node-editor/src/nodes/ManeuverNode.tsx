import { Position, type NodeProps, type Node } from '@xyflow/react';
import type { ManeuverNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { Badge } from '../ui/badge.js';
import { NodeHandle } from '../ui/node-handle.js';

export function ManeuverNode({ data, selected }: NodeProps<Node<ManeuverNodeData>>) {
  return (
    <NodeCard
      nodeType="maneuver"
      title={data.name}
      selected={selected}
      collapsed={data.collapsed}
      badges={<Badge>{data.eventCount} events</Badge>}
    >
      <NodeHandle type="target" position={Position.Top} />
      <NodeHandle type="source" position={Position.Bottom} />
    </NodeCard>
  );
}
