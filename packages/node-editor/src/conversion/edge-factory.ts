/**
 * Factory functions to create React Flow edges.
 */

import type { Edge } from '@xyflow/react';

let edgeCounter = 0;

export function resetEdgeCounter(): void {
  edgeCounter = 0;
}

export function createHierarchyEdge(sourceId: string, targetId: string): Edge {
  return {
    id: `h-${sourceId}-${targetId}-${edgeCounter++}`,
    source: sourceId,
    target: targetId,
    type: 'hierarchy',
    data: { osceEdgeType: 'hierarchy' as const },
  };
}

export function createTriggerEdge(sourceId: string, targetId: string, label?: string): Edge {
  return {
    id: `t-${sourceId}-${targetId}-${edgeCounter++}`,
    source: sourceId,
    target: targetId,
    type: 'trigger',
    animated: true,
    style: { strokeDasharray: '5 5' },
    data: { osceEdgeType: 'trigger' as const, label },
  };
}
