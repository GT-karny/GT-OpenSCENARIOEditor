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
import type { RawXml } from '../utils/xml-helpers.js';
import { parsePrivateAction, parseGlobalAction, parseUserDefinedAction } from './parse-actions.js';
import { parseTrigger } from './parse-triggers.js';
import { parseParameterDeclarations } from './parse-parameters.js';
import { parseInit } from './parse-init.js';
import { generateId } from '@osce/shared';
import {
  numAttr,
  strAttr,
  boolAttr,
  optNumAttr,
  setBindingElementId,
  child,
  children,
  rawKeys,
} from '../utils/xml-helpers.js';

export function parseStoryboard(raw: RawXml | undefined): Storyboard {
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
    init: parseInit(child(raw, 'Init')),
    stories: children(raw, 'Story').map(parseStory),
    stopTrigger: parseTrigger(child(raw, 'StopTrigger')),
  };
}

function parseStory(raw: RawXml): Story {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    parameterDeclarations: parseParameterDeclarations(child(raw, 'ParameterDeclarations')),
    acts: children(raw, 'Act').map(parseAct),
  };
}

function parseAct(raw: RawXml): Act {
  const stopTrigger = child(raw, 'StopTrigger');
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    maneuverGroups: children(raw, 'ManeuverGroup').map(parseManeuverGroup),
    startTrigger: parseTrigger(child(raw, 'StartTrigger')),
    stopTrigger: stopTrigger ? parseTrigger(stopTrigger) : undefined,
  };
}

function parseManeuverGroup(raw: RawXml): ManeuverGroup {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    maximumExecutionCount: numAttr(raw, 'maximumExecutionCount', 1),
    actors: parseActors(child(raw, 'Actors')),
    maneuvers: children(raw, 'Maneuver').map(parseManeuver),
  };
}

function parseActors(raw: RawXml | undefined): Actors {
  if (!raw) return { selectTriggeringEntities: false, entityRefs: [] };
  return {
    selectTriggeringEntities: boolAttr(raw, 'selectTriggeringEntities'),
    entityRefs: children(raw, 'EntityRef').map((e) => strAttr(e, 'entityRef')),
  };
}

export function parseManeuver(raw: RawXml): Maneuver {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    parameterDeclarations: parseParameterDeclarations(child(raw, 'ParameterDeclarations')),
    events: children(raw, 'Event').map(parseEvent),
  };
}

function parseEvent(raw: RawXml): ScenarioEvent {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    priority: strAttr(raw, 'priority', 'override') as EventPriority,
    maximumExecutionCount: optNumAttr(raw, 'maximumExecutionCount'),
    actions: children(raw, 'Action').map(parseScenarioAction),
    startTrigger: parseTrigger(child(raw, 'StartTrigger')),
  };
}

function parseScenarioAction(raw: RawXml): ScenarioAction {
  const name = strAttr(raw, 'name');
  const id = generateId();
  setBindingElementId(id);

  const privateAction = child(raw, 'PrivateAction');
  if (privateAction) {
    return { id, name, action: parsePrivateAction(privateAction) };
  }
  const globalAction = child(raw, 'GlobalAction');
  if (globalAction) {
    return { id, name, action: parseGlobalAction(globalAction) };
  }
  const userDefinedAction = child(raw, 'UserDefinedAction');
  if (userDefinedAction) {
    return { id, name, action: parseUserDefinedAction(userDefinedAction) };
  }

  throw new Error(`Unknown Action type in Event: ${rawKeys(raw).join(', ')}`);
}
