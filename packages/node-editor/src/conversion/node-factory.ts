/**
 * Factory functions to create React Flow nodes from scenario document elements.
 */

import type { Node } from '@xyflow/react';
import type {
  Storyboard,
  Init,
  Story,
  Act,
  ManeuverGroup,
  Maneuver,
  ScenarioEvent,
  ScenarioAction,
  Trigger,
  Condition,
  ScenarioEntity,
  EntityInitActions,
  PrivateAction,
  GlobalAction,
} from '@osce/shared';
import type {
  StoryboardNodeData,
  InitNodeData,
  EntityNodeData,
  StoryNodeData,
  ActNodeData,
  ManeuverGroupNodeData,
  ManeuverNodeData,
  EventNodeData,
  ActionNodeData,
  TriggerNodeData,
  ConditionNodeData,
} from '../types/node-types.js';
import { getActionSummary, getActionTypeLabel } from '../utils/action-display.js';
import { getConditionSummary, getConditionTypeLabel, getTriggerSummary } from '../utils/condition-display.js';

function getEntityCategory(entity: ScenarioEntity): string {
  const def = entity.definition;
  if (def.kind === 'vehicle') return def.vehicleCategory;
  if (def.kind === 'pedestrian') return def.pedestrianCategory;
  if (def.kind === 'miscObject') return def.miscObjectCategory;
  return 'unknown';
}

function getInitActionSummary(action: PrivateAction): string {
  if (action.type === 'teleportAction') return `Teleport: ${action.position.type}`;
  if (action.type === 'speedAction') {
    const target = action.target;
    return `Speed: ${target.kind === 'absolute' ? `${target.value} m/s` : 'relative'}`;
  }
  return getActionTypeLabel(action.type);
}

export function createStoryboardNode(
  storyboard: Storyboard,
  position: { x: number; y: number },
): Node<StoryboardNodeData> {
  return {
    id: storyboard.id,
    type: 'storyboard',
    position,
    data: {
      osceType: 'storyboard',
      storyCount: storyboard.stories.length,
      hasStopTrigger: storyboard.stopTrigger.conditionGroups.length > 0,
    },
  };
}

export function createInitNode(
  init: Init,
  position: { x: number; y: number },
): Node<InitNodeData> {
  return {
    id: init.id,
    type: 'init',
    position,
    data: {
      osceType: 'init',
      entityActions: init.entityActions.map((ea: EntityInitActions) => ({
        entityRef: ea.entityRef,
        actionSummaries: ea.privateActions.map((pa) => getInitActionSummary(pa.action)),
      })),
    },
  };
}

export function createEntityNode(
  entity: ScenarioEntity,
  position: { x: number; y: number },
): Node<EntityNodeData> {
  return {
    id: entity.id,
    type: 'entity',
    position,
    data: {
      osceType: 'entity',
      name: entity.name,
      entityType: entity.type,
      category: getEntityCategory(entity),
    },
  };
}

export function createStoryNode(
  story: Story,
  position: { x: number; y: number },
  collapsed: boolean,
): Node<StoryNodeData> {
  return {
    id: story.id,
    type: 'story',
    position,
    data: {
      osceType: 'story',
      name: story.name,
      actCount: story.acts.length,
      collapsed,
    },
  };
}

export function createActNode(
  act: Act,
  position: { x: number; y: number },
  collapsed: boolean,
): Node<ActNodeData> {
  return {
    id: act.id,
    type: 'act',
    position,
    data: {
      osceType: 'act',
      name: act.name,
      maneuverGroupCount: act.maneuverGroups.length,
      hasStartTrigger: act.startTrigger.conditionGroups.length > 0,
      hasStopTrigger: act.stopTrigger != null && act.stopTrigger.conditionGroups.length > 0,
      collapsed,
    },
  };
}

export function createManeuverGroupNode(
  group: ManeuverGroup,
  position: { x: number; y: number },
  collapsed: boolean,
): Node<ManeuverGroupNodeData> {
  return {
    id: group.id,
    type: 'maneuverGroup',
    position,
    data: {
      osceType: 'maneuverGroup',
      name: group.name,
      actorRefs: group.actors.entityRefs,
      maneuverCount: group.maneuvers.length,
      collapsed,
    },
  };
}

export function createManeuverNode(
  maneuver: Maneuver,
  position: { x: number; y: number },
  collapsed: boolean,
): Node<ManeuverNodeData> {
  return {
    id: maneuver.id,
    type: 'maneuver',
    position,
    data: {
      osceType: 'maneuver',
      name: maneuver.name,
      eventCount: maneuver.events.length,
      collapsed,
    },
  };
}

export function createEventNode(
  event: ScenarioEvent,
  position: { x: number; y: number },
  collapsed: boolean,
): Node<EventNodeData> {
  return {
    id: event.id,
    type: 'event',
    position,
    data: {
      osceType: 'event',
      name: event.name,
      priority: event.priority,
      actionCount: event.actions.length,
      triggerSummary: getTriggerSummary(event.startTrigger),
      collapsed,
    },
  };
}

export function createActionNode(
  action: ScenarioAction,
  position: { x: number; y: number },
): Node<ActionNodeData> {
  const innerAction = action.action;
  return {
    id: action.id,
    type: 'action',
    position,
    data: {
      osceType: 'action',
      name: action.name,
      actionType: innerAction.type,
      summary: getActionSummary(innerAction as PrivateAction | GlobalAction | { type: 'userDefinedAction'; customCommandAction: string }),
    },
  };
}

export function createTriggerNode(
  trigger: Trigger,
  triggerKind: 'start' | 'stop',
  position: { x: number; y: number },
): Node<TriggerNodeData> {
  return {
    id: trigger.id,
    type: 'trigger',
    position,
    data: {
      osceType: 'trigger',
      triggerKind,
      conditionGroupCount: trigger.conditionGroups.length,
      summary: getTriggerSummary(trigger),
    },
  };
}

export function createConditionNode(
  condition: Condition,
  position: { x: number; y: number },
): Node<ConditionNodeData> {
  const inner = condition.condition;
  let condType: string;
  if (inner.kind === 'byValue') {
    condType = inner.valueCondition.type;
  } else {
    condType = inner.entityCondition.type;
  }
  return {
    id: condition.id,
    type: 'condition',
    position,
    data: {
      osceType: 'condition',
      name: condition.name,
      conditionType: getConditionTypeLabel(condType),
      summary: getConditionSummary(condition),
      delay: condition.delay,
      edge: condition.conditionEdge,
    },
  };
}
