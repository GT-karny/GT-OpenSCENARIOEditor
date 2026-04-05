/**
 * Deep clone utility for storyboard elements.
 * Creates a structurally identical copy with all IDs regenerated.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ManeuverGroup,
  Maneuver,
  ScenarioEvent,
  ScenarioAction,
  Trigger,
  ConditionGroup,
  Condition,
  ParameterDeclaration,
} from '@osce/shared';

export type CloneableElementType = 'maneuverGroup' | 'maneuver' | 'event' | 'action';

/**
 * Deep-clone a storyboard element, regenerating all `id` fields
 * and appending '_copy' to the top-level name.
 *
 * The input is NOT mutated — `structuredClone()` is called first.
 */
export function deepCloneWithNewIds<T>(element: T, type: CloneableElementType): T {
  const clone = structuredClone(element);

  switch (type) {
    case 'maneuverGroup':
      return regenerateManeuverGroupIds(clone as unknown as ManeuverGroup) as unknown as T;
    case 'maneuver':
      return regenerateManeuverIds(clone as unknown as Maneuver) as unknown as T;
    case 'event':
      return regenerateEventIds(clone as unknown as ScenarioEvent) as unknown as T;
    case 'action':
      return regenerateActionIds(clone as unknown as ScenarioAction) as unknown as T;
  }
}

function regenerateManeuverGroupIds(group: ManeuverGroup): ManeuverGroup {
  group.id = uuidv4();
  group.name = group.name + '_copy';
  for (const m of group.maneuvers) {
    regenerateManeuverIdsInner(m);
  }
  return group;
}

function regenerateManeuverIds(maneuver: Maneuver): Maneuver {
  maneuver.name = maneuver.name + '_copy';
  regenerateManeuverIdsInner(maneuver);
  return maneuver;
}

function regenerateManeuverIdsInner(maneuver: Maneuver): void {
  maneuver.id = uuidv4();
  regenerateParameterIds(maneuver.parameterDeclarations);
  for (const event of maneuver.events) {
    regenerateEventIdsInner(event);
  }
}

function regenerateEventIds(event: ScenarioEvent): ScenarioEvent {
  event.id = uuidv4();
  event.name = event.name + '_copy';
  regenerateTriggerIds(event.startTrigger);
  for (const action of event.actions) {
    action.id = uuidv4();
  }
  return event;
}

function regenerateEventIdsInner(event: ScenarioEvent): void {
  event.id = uuidv4();
  regenerateTriggerIds(event.startTrigger);
  for (const action of event.actions) {
    action.id = uuidv4();
  }
}

function regenerateActionIds(action: ScenarioAction): ScenarioAction {
  action.id = uuidv4();
  action.name = action.name + '_copy';
  return action;
}

function regenerateTriggerIds(trigger: Trigger): void {
  trigger.id = uuidv4();
  for (const group of trigger.conditionGroups) {
    regenerateConditionGroupIds(group);
  }
}

function regenerateConditionGroupIds(group: ConditionGroup): void {
  group.id = uuidv4();
  for (const condition of group.conditions) {
    regenerateConditionIds(condition);
  }
}

function regenerateConditionIds(condition: Condition): void {
  condition.id = uuidv4();
}

function regenerateParameterIds(params: ParameterDeclaration[]): void {
  for (const param of params) {
    param.id = uuidv4();
  }
}
