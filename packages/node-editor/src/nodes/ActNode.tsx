import { Position, type NodeProps, type Node } from '@xyflow/react';
import type { ActNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { Badge } from '../ui/badge.js';
import { NodeHandle } from '../ui/node-handle.js';

export function ActNode({ data, selected }: NodeProps<Node<ActNodeData>>) {
  return (
    <NodeCard
      nodeType="act"
      title={data.name}
      selected={selected}
      collapsed={data.collapsed}
      badges={<Badge>{data.maneuverGroupCount} groups</Badge>}
    >
      <NodeHandle type="target" position={Position.Top} />
      <div className="flex gap-1 flex-wrap">
        {data.hasStartTrigger && <Badge variant="outline">start trigger</Badge>}
        {data.hasStopTrigger && <Badge variant="outline">stop trigger</Badge>}
      </div>
      <NodeHandle type="source" position={Position.Bottom} />
    </NodeCard>
  );
}
