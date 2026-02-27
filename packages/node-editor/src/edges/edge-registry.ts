/**
 * React Flow edgeTypes registry mapping.
 */

import type { EdgeTypes } from '@xyflow/react';
import { HierarchyEdge } from './HierarchyEdge.js';
import { TriggerEdge } from './TriggerEdge.js';

export const osceEdgeTypes: EdgeTypes = {
  hierarchy: HierarchyEdge,
  trigger: TriggerEdge,
};
