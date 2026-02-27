/**
 * Custom React Flow edge type definitions.
 */

export type OsceEdgeType = 'hierarchy' | 'trigger';

export interface HierarchyEdgeData {
  osceEdgeType: 'hierarchy';
}

export interface TriggerEdgeData {
  osceEdgeType: 'trigger';
  label?: string;
}

export type OsceEdgeData = HierarchyEdgeData | TriggerEdgeData;
