import { Position, type NodeProps, type Node } from '@xyflow/react';
import type { EventNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { Badge } from '../ui/badge.js';
import { NodeHandle } from '../ui/node-handle.js';
import { useEditorStore } from '../hooks/use-editor-store.js';

export function EventNode({ id, data, selected }: NodeProps<Node<EventNodeData>>) {
  const isRunning = useEditorStore((s) => s.activeNodeIds.includes(id));
  return (
    <NodeCard
      nodeType="event"
      title={data.name}
      subtitle={`Priority: ${data.priority}`}
      selected={selected}
      running={isRunning}
      collapsed={data.collapsed}
      badges={<Badge>{data.actionCount} actions</Badge>}
    >
      <NodeHandle type="target" position={Position.Top} />
      <div className="text-[10px] opacity-75">Trigger: {data.triggerSummary}</div>
      <NodeHandle type="source" position={Position.Bottom} />
    </NodeCard>
  );
}
