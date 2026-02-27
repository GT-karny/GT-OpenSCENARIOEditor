import { Position, type NodeProps, type Node } from '@xyflow/react';
import type { TriggerNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { Badge } from '../ui/badge.js';
import { NodeHandle } from '../ui/node-handle.js';

export function TriggerNode({ data, selected }: NodeProps<Node<TriggerNodeData>>) {
  return (
    <NodeCard
      nodeType="trigger"
      title={`${data.triggerKind === 'start' ? 'Start' : 'Stop'} Trigger`}
      selected={selected}
      badges={<Badge>{data.conditionGroupCount} groups</Badge>}
    >
      <NodeHandle type="target" position={Position.Top} />
      <div className="text-[10px] opacity-75">{data.summary}</div>
      <NodeHandle type="source" position={Position.Bottom} />
    </NodeCard>
  );
}
