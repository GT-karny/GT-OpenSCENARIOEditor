import { Position, type NodeProps, type Node } from '@xyflow/react';
import type { ActionNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { Badge } from '../ui/badge.js';
import { NodeHandle } from '../ui/node-handle.js';
import { getActionTypeLabel } from '../utils/action-display.js';
import { useEditorStore } from '../hooks/use-editor-store.js';

export function ActionNode({ id, data, selected }: NodeProps<Node<ActionNodeData>>) {
  const isRunning = useEditorStore((s) => s.activeNodeIds.has(id));
  return (
    <NodeCard
      nodeType="action"
      title={data.name}
      selected={selected}
      running={isRunning}
      badges={<Badge>{getActionTypeLabel(data.actionType)}</Badge>}
    >
      <NodeHandle type="target" position={Position.Top} />
      <div className="text-[10px] opacity-75">{data.summary}</div>
    </NodeCard>
  );
}
