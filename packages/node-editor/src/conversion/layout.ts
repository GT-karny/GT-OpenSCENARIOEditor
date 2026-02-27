/**
 * Dagre-based automatic layout for React Flow nodes.
 */

import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';
import type { OsceNodeData } from '../types/node-types.js';
import { getNodeDimensions } from '../utils/node-dimensions.js';

export interface LayoutOptions {
  direction: 'TB' | 'LR';
  nodeSeparation: number;
  rankSeparation: number;
  edgeSeparation: number;
}

const DEFAULT_LAYOUT: LayoutOptions = {
  direction: 'TB',
  nodeSeparation: 50,
  rankSeparation: 80,
  edgeSeparation: 20,
};

export function applyDagreLayout(
  nodes: Node<OsceNodeData>[],
  edges: Edge[],
  options?: Partial<LayoutOptions>,
): Node<OsceNodeData>[] {
  if (nodes.length === 0) return nodes;

  const opts = { ...DEFAULT_LAYOUT, ...options };
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodeSeparation,
    ranksep: opts.rankSeparation,
    edgesep: opts.edgeSeparation,
  });

  for (const node of nodes) {
    const dims = getNodeDimensions(node.type ?? 'storyboard');
    g.setNode(node.id, { width: dims.width, height: dims.height });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;
    const dims = getNodeDimensions(node.type ?? 'storyboard');
    return {
      ...node,
      position: {
        x: dagreNode.x - dims.width / 2,
        y: dagreNode.y - dims.height / 2,
      },
    };
  });
}
