import { Position, type NodeProps, type Node } from '@xyflow/react';
import type { ManeuverGroupNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { Badge } from '../ui/badge.js';
import { NodeHandle } from '../ui/node-handle.js';
import { useEditorStore } from '../hooks/use-editor-store.js';

export function ManeuverGroupNode({ id, data, selected }: NodeProps<Node<ManeuverGroupNodeData>>) {
  const isRunning = useEditorStore((s) => s.activeNodeIds.includes(id));
  return (
    <NodeCard
      nodeType="maneuverGroup"
      title={data.name}
      selected={selected}
      running={isRunning}
      collapsed={data.collapsed}
      badges={<Badge>{data.maneuverCount} maneuvers</Badge>}
    >
      <NodeHandle type="target" position={Position.Top} />
      {data.actorRefs.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {data.actorRefs.map((ref) => (
            <Badge key={ref} variant="outline">{ref}</Badge>
          ))}
        </div>
      )}
      <NodeHandle type="source" position={Position.Bottom} />
    </NodeCard>
  );
}
