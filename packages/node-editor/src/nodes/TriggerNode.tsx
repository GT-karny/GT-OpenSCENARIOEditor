import { Position, type NodeProps, type Node } from '@xyflow/react';
import type { TriggerNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { Badge } from '../ui/badge.js';
import { NodeHandle } from '../ui/node-handle.js';
import { useEditorStore } from '../hooks/use-editor-store.js';

export function TriggerNode({ id, data, selected }: NodeProps<Node<TriggerNodeData>>) {
  const isRunning = useEditorStore((s) => s.activeNodeIds.includes(id));
  return (
    <NodeCard
      nodeType="trigger"
      title={`${data.triggerKind === 'start' ? 'Start' : 'Stop'} Trigger`}
      selected={selected}
      running={isRunning}
      badges={<Badge>{data.conditionGroupCount} groups</Badge>}
    >
      <NodeHandle type="target" position={Position.Top} />
      <div className="text-[10px] opacity-75">{data.summary}</div>
      <NodeHandle type="source" position={Position.Bottom} />
    </NodeCard>
  );
}
