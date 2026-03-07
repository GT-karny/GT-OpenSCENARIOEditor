import type {
  Storyboard,
  Story,
  Act,
  ManeuverGroup,
  Maneuver,
  ScenarioEvent,
  ScenarioAction,
  PrivateAction,
  GlobalAction,
  UserDefinedAction,
} from '@osce/shared';
import { buildPrivateAction, buildGlobalAction, buildUserDefinedAction } from './build-actions.js';
import { buildTrigger } from './build-triggers.js';
import { buildParameterDeclarations } from './build-parameters.js';
import { buildInit } from './build-init.js';
import { buildAttrs } from '../utils/xml-helpers.js';

type AllBindings = Record<string, Record<string, string>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildStoryboard(sb: Storyboard, allBindings: AllBindings = {}): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {
    Init: buildInit(sb.init, allBindings),
  };

  if (sb.stories.length > 0) {
    result.Story = sb.stories.map((s) => buildStory(s, allBindings));
  }

  result.StopTrigger = buildTrigger(sb.stopTrigger, allBindings);

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStory(story: Story, allBindings: AllBindings): any {
  return {
    ...buildAttrs({ name: story.name }),
    ParameterDeclarations: buildParameterDeclarations(story.parameterDeclarations),
    Act: story.acts.map((a) => buildAct(a, allBindings)),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAct(act: Act, allBindings: AllBindings): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {
    ...buildAttrs({ name: act.name }),
    ManeuverGroup: act.maneuverGroups.map((mg) => buildManeuverGroup(mg, allBindings)),
    StartTrigger: buildTrigger(act.startTrigger, allBindings),
  };
  if (act.stopTrigger) {
    result.StopTrigger = buildTrigger(act.stopTrigger, allBindings);
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildManeuverGroup(mg: ManeuverGroup, allBindings: AllBindings): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actors: any = buildAttrs({
    selectTriggeringEntities: mg.actors.selectTriggeringEntities,
  });
  if (mg.actors.entityRefs.length > 0) {
    actors.EntityRef = mg.actors.entityRefs.map((ref) => buildAttrs({ entityRef: ref }));
  }

  return {
    ...buildAttrs({
      maximumExecutionCount: mg.maximumExecutionCount,
      name: mg.name,
    }),
    Actors: actors,
    Maneuver: mg.maneuvers.map((m) => buildManeuver(m, allBindings)),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildManeuver(m: Maneuver, allBindings: AllBindings): any {
  return {
    ...buildAttrs({ name: m.name }),
    ParameterDeclarations: buildParameterDeclarations(m.parameterDeclarations),
    Event: m.events.map((e) => buildEvent(e, allBindings)),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildEvent(e: ScenarioEvent, allBindings: AllBindings): any {
  return {
    ...buildAttrs({
      priority: e.priority,
      maximumExecutionCount: e.maximumExecutionCount,
      name: e.name,
    }),
    Action: e.actions.map((sa) => buildScenarioAction(sa, allBindings)),
    StartTrigger: buildTrigger(e.startTrigger, allBindings),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildScenarioAction(sa: ScenarioAction, allBindings: AllBindings): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = buildAttrs({ name: sa.name });
  const elementBindings = allBindings[sa.id] ?? {};

  const action = sa.action;
  switch (action.type) {
    case 'userDefinedAction':
      result.UserDefinedAction = buildUserDefinedAction(action as UserDefinedAction);
      break;
    case 'environmentAction':
    case 'entityAction':
    case 'parameterAction':
    case 'variableAction':
    case 'infrastructureAction':
    case 'trafficAction':
      result.GlobalAction = buildGlobalAction(action as GlobalAction, elementBindings);
      break;
    default:
      result.PrivateAction = buildPrivateAction(action as PrivateAction, elementBindings);
      break;
  }

  return result;
}
