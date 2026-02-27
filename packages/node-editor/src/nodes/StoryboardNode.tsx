import { Position, type NodeProps, type Node } from '@xyflow/react';
import type { StoryboardNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { Badge } from '../ui/badge.js';
import { NodeHandle } from '../ui/node-handle.js';

export function StoryboardNode({ data, selected }: NodeProps<Node<StoryboardNodeData>>) {
  return (
    <NodeCard nodeType="storyboard" title="Storyboard" selected={selected}>
      <div className="flex items-center gap-2">
        <Badge>{data.storyCount} stories</Badge>
        {data.hasStopTrigger && <Badge variant="outline">stop trigger</Badge>}
      </div>
      <NodeHandle type="source" position={Position.Bottom} />
    </NodeCard>
  );
}
