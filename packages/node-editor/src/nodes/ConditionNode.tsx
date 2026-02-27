import { Position, type NodeProps, type Node } from '@xyflow/react';
import type { ConditionNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { Badge } from '../ui/badge.js';
import { NodeHandle } from '../ui/node-handle.js';

export function ConditionNode({ data, selected }: NodeProps<Node<ConditionNodeData>>) {
  return (
    <NodeCard
      nodeType="condition"
      title={data.name}
      selected={selected}
      badges={<Badge>{data.conditionType}</Badge>}
    >
      <NodeHandle type="target" position={Position.Top} />
      <div className="text-[10px] opacity-75">{data.summary}</div>
      {data.delay > 0 && <div className="text-[10px] opacity-50">Delay: {data.delay}s</div>}
    </NodeCard>
  );
}
