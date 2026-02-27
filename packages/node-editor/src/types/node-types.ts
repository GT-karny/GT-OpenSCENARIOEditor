/**
 * Custom React Flow node data types for OpenSCENARIO elements.
 * Uses discriminated union with `osceType` field.
 *
 * NOTE: Type aliases (not interfaces) are used intentionally so that
 * they satisfy React Flow's `Record<string, unknown>` generic constraint.
 * TypeScript interfaces lack implicit index signatures.
 */

import type { EventPriority } from '@osce/shared';

export type OsceNodeType =
  | 'storyboard'
  | 'init'
  | 'entity'
  | 'story'
  | 'act'
  | 'maneuverGroup'
  | 'maneuver'
  | 'event'
  | 'action'
  | 'trigger'
  | 'condition';

export type StoryboardNodeData = {
  osceType: 'storyboard';
  storyCount: number;
  hasStopTrigger: boolean;
};

export type InitNodeData = {
  osceType: 'init';
  entityActions: Array<{
    entityRef: string;
    actionSummaries: string[];
  }>;
};

export type EntityNodeData = {
  osceType: 'entity';
  name: string;
  entityType: string;
  category: string;
};

export type StoryNodeData = {
  osceType: 'story';
  name: string;
  actCount: number;
  collapsed: boolean;
};

export type ActNodeData = {
  osceType: 'act';
  name: string;
  maneuverGroupCount: number;
  hasStartTrigger: boolean;
  hasStopTrigger: boolean;
  collapsed: boolean;
};

export type ManeuverGroupNodeData = {
  osceType: 'maneuverGroup';
  name: string;
  actorRefs: string[];
  maneuverCount: number;
  collapsed: boolean;
};

export type ManeuverNodeData = {
  osceType: 'maneuver';
  name: string;
  eventCount: number;
  collapsed: boolean;
};

export type EventNodeData = {
  osceType: 'event';
  name: string;
  priority: EventPriority;
  actionCount: number;
  triggerSummary: string;
  collapsed: boolean;
};

export type ActionNodeData = {
  osceType: 'action';
  name: string;
  actionType: string;
  summary: string;
};

export type TriggerNodeData = {
  osceType: 'trigger';
  triggerKind: 'start' | 'stop';
  conditionGroupCount: number;
  summary: string;
};

export type ConditionNodeData = {
  osceType: 'condition';
  name: string;
  conditionType: string;
  summary: string;
  delay: number;
  edge: string;
};

export type OsceNodeData =
  | StoryboardNodeData
  | InitNodeData
  | EntityNodeData
  | StoryNodeData
  | ActNodeData
  | ManeuverGroupNodeData
  | ManeuverNodeData
  | EventNodeData
  | ActionNodeData
  | TriggerNodeData
  | ConditionNodeData;
