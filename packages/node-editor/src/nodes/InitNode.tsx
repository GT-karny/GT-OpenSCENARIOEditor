import { Position, type NodeProps, type Node } from '@xyflow/react';
import type { InitNodeData } from '../types/node-types.js';
import { NodeCard } from '../ui/node-card.js';
import { NodeHandle } from '../ui/node-handle.js';
import { useEditorStore } from '../hooks/use-editor-store.js';

export function InitNode({ id, data, selected }: NodeProps<Node<InitNodeData>>) {
  const isRunning = useEditorStore((s) => s.activeNodeIds.has(id));
  return (
    <NodeCard nodeType="init" title="Init" selected={selected} running={isRunning}>
      <NodeHandle type="target" position={Position.Top} />
      {data.entityActions.length === 0 ? (
        <div className="text-gray-400 italic">No init actions</div>
      ) : (
        <div className="space-y-1">
          {data.entityActions.map((ea, i) => (
            <div key={i} className="border-l-2 border-emerald-300 pl-2">
              <div className="font-medium">{ea.entityRef}</div>
              {ea.actionSummaries.map((s, j) => (
                <div key={j} className="text-[10px] opacity-75">{s}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </NodeCard>
  );
}
