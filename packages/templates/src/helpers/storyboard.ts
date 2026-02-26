import type {
  Story,
  Act,
  ManeuverGroup,
  Maneuver,
  ScenarioEvent,
  ScenarioAction,
  Trigger,
  PrivateAction,
  EventPriority,
} from '@osce/shared';
import { generateId } from './id.js';
import { createSimulationTimeTrigger } from './triggers.js';

export function createScenarioAction(name: string, action: PrivateAction): ScenarioAction {
  return { id: generateId(), name, action };
}

export function createEvent(
  name: string,
  actions: ScenarioAction[],
  startTrigger: Trigger,
  priority: EventPriority = 'override',
): ScenarioEvent {
  return {
    id: generateId(),
    name,
    priority,
    maximumExecutionCount: 1,
    actions,
    startTrigger,
  };
}

export function createManeuver(name: string, events: ScenarioEvent[]): Maneuver {
  return {
    id: generateId(),
    name,
    parameterDeclarations: [],
    events,
  };
}

export function createManeuverGroup(
  name: string,
  actorEntityRefs: string[],
  maneuvers: Maneuver[],
): ManeuverGroup {
  return {
    id: generateId(),
    name,
    maximumExecutionCount: 1,
    actors: {
      selectTriggeringEntities: false,
      entityRefs: actorEntityRefs,
    },
    maneuvers,
  };
}

export function createAct(
  name: string,
  maneuverGroups: ManeuverGroup[],
  startTrigger?: Trigger,
): Act {
  return {
    id: generateId(),
    name,
    maneuverGroups,
    startTrigger: startTrigger ?? createSimulationTimeTrigger(0),
  };
}

export function createStory(name: string, acts: Act[]): Partial<Story> {
  return {
    id: generateId(),
    name,
    parameterDeclarations: [],
    acts,
  };
}
