import { Position, type NodeProps, type Node } from '@xyflow/react';
import type { ManeuverNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { Badge } from '../ui/badge.js';
import { NodeHandle } from '../ui/node-handle.js';
import { useEditorStore } from '../hooks/use-editor-store.js';

export function ManeuverNode({ id, data, selected }: NodeProps<Node<ManeuverNodeData>>) {
  const isRunning = useEditorStore((s) => s.activeNodeIds.includes(id));
  return (
    <NodeCard
      nodeType="maneuver"
      title={data.name}
      selected={selected}
      running={isRunning}
      collapsed={data.collapsed}
      badges={<Badge>{data.eventCount} events</Badge>}
    >
      <NodeHandle type="target" position={Position.Top} />
      <NodeHandle type="source" position={Position.Bottom} />
    </NodeCard>
  );
}
