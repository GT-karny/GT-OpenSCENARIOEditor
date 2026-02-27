/**
 * Default dimensions for each node type.
 * Used by dagre layout algorithm.
 */

import type { OsceNodeType } from '../types/node-types.js';

export interface NodeDimension {
  width: number;
  height: number;
}

const dimensions: Record<OsceNodeType, NodeDimension> = {
  storyboard: { width: 200, height: 60 },
  init: { width: 240, height: 80 },
  entity: { width: 180, height: 70 },
  story: { width: 200, height: 60 },
  act: { width: 200, height: 60 },
  maneuverGroup: { width: 220, height: 70 },
  maneuver: { width: 200, height: 60 },
  event: { width: 220, height: 80 },
  action: { width: 220, height: 70 },
  trigger: { width: 200, height: 60 },
  condition: { width: 220, height: 70 },
};

export function getNodeDimensions(nodeType: string): NodeDimension {
  return dimensions[nodeType as OsceNodeType] ?? { width: 200, height: 60 };
}
