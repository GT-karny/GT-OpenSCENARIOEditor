import { Position, type NodeProps, type Node } from '@xyflow/react';
import type { ActionNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { Badge } from '../ui/badge.js';
import { NodeHandle } from '../ui/node-handle.js';
import { getActionTypeLabel } from '../utils/action-display.js';

export function ActionNode({ data, selected }: NodeProps<Node<ActionNodeData>>) {
  return (
    <NodeCard
      nodeType="action"
      title={data.name}
      selected={selected}
      badges={<Badge>{getActionTypeLabel(data.actionType)}</Badge>}
    >
      <NodeHandle type="target" position={Position.Top} />
      <div className="text-[10px] opacity-75">{data.summary}</div>
    </NodeCard>
  );
}
