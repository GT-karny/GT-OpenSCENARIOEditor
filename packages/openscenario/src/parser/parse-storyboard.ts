import type {
  Storyboard,
  Story,
  Act,
  ManeuverGroup,
  Actors,
  Maneuver,
  ScenarioEvent,
  ScenarioAction,
  EventPriority,
} from '@osce/shared';
import { parsePrivateAction, parseGlobalAction, parseUserDefinedAction } from './parse-actions.js';
import { parseTrigger } from './parse-triggers.js';
import { parseParameterDeclarations } from './parse-parameters.js';
import { parseInit } from './parse-init.js';
import { ensureArray } from '../utils/ensure-array.js';
import { generateId } from '../utils/uuid.js';
import { numAttr, strAttr, boolAttr, optNumAttr } from '../utils/xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseStoryboard(raw: any): Storyboard {
  if (!raw) {
    return {
      id: generateId(),
      init: { id: generateId(), globalActions: [], entityActions: [] },
      stories: [],
      stopTrigger: { id: generateId(), conditionGroups: [] },
    };
  }

  return {
    id: generateId(),
    init: parseInit(raw.Init),
    stories: ensureArray(raw.Story).map(parseStory),
    stopTrigger: parseTrigger(raw.StopTrigger),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseStory(raw: any): Story {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    parameterDeclarations: parseParameterDeclarations(raw.ParameterDeclarations),
    acts: ensureArray(raw.Act).map(parseAct),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAct(raw: any): Act {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    maneuverGroups: ensureArray(raw.ManeuverGroup).map(parseManeuverGroup),
    startTrigger: parseTrigger(raw.StartTrigger),
    stopTrigger: raw.StopTrigger ? parseTrigger(raw.StopTrigger) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseManeuverGroup(raw: any): ManeuverGroup {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    maximumExecutionCount: numAttr(raw, 'maximumExecutionCount', 1),
    actors: parseActors(raw.Actors),
    maneuvers: ensureArray(raw.Maneuver).map(parseManeuver),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseActors(raw: any): Actors {
  if (!raw) return { selectTriggeringEntities: false, entityRefs: [] };
  return {
    selectTriggeringEntities: boolAttr(raw, 'selectTriggeringEntities'),
    entityRefs: ensureArray(raw.EntityRef).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => strAttr(e, 'entityRef'),
    ),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseManeuver(raw: any): Maneuver {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    parameterDeclarations: parseParameterDeclarations(raw.ParameterDeclarations),
    events: ensureArray(raw.Event).map(parseEvent),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEvent(raw: any): ScenarioEvent {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    priority: strAttr(raw, 'priority', 'override') as EventPriority,
    maximumExecutionCount: optNumAttr(raw, 'maximumExecutionCount'),
    actions: ensureArray(raw.Action).map(parseScenarioAction),
    startTrigger: parseTrigger(raw.StartTrigger),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseScenarioAction(raw: any): ScenarioAction {
  const name = strAttr(raw, 'name');

  if (raw.PrivateAction) {
    return {
      id: generateId(),
      name,
      action: parsePrivateAction(raw.PrivateAction),
    };
  }
  if (raw.GlobalAction) {
    return {
      id: generateId(),
      name,
      action: parseGlobalAction(raw.GlobalAction),
    };
  }
  if (raw.UserDefinedAction) {
    return {
      id: generateId(),
      name,
      action: parseUserDefinedAction(raw.UserDefinedAction),
    };
  }

  throw new Error(`Unknown Action type in Event: ${Object.keys(raw).join(', ')}`);
}
