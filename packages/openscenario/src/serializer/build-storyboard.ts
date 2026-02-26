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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildStoryboard(sb: Storyboard): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {
    Init: buildInit(sb.init),
  };

  if (sb.stories.length > 0) {
    result.Story = sb.stories.map(buildStory);
  }

  result.StopTrigger = buildTrigger(sb.stopTrigger);

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStory(story: Story): any {
  return {
    ...buildAttrs({ name: story.name }),
    ParameterDeclarations: buildParameterDeclarations(story.parameterDeclarations),
    Act: story.acts.map(buildAct),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAct(act: Act): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {
    ...buildAttrs({ name: act.name }),
    ManeuverGroup: act.maneuverGroups.map(buildManeuverGroup),
    StartTrigger: buildTrigger(act.startTrigger),
  };
  if (act.stopTrigger) {
    result.StopTrigger = buildTrigger(act.stopTrigger);
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildManeuverGroup(mg: ManeuverGroup): any {
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
    Maneuver: mg.maneuvers.map(buildManeuver),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildManeuver(m: Maneuver): any {
  return {
    ...buildAttrs({ name: m.name }),
    ParameterDeclarations: buildParameterDeclarations(m.parameterDeclarations),
    Event: m.events.map(buildEvent),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildEvent(e: ScenarioEvent): any {
  return {
    ...buildAttrs({
      priority: e.priority,
      maximumExecutionCount: e.maximumExecutionCount,
      name: e.name,
    }),
    Action: e.actions.map(buildScenarioAction),
    StartTrigger: buildTrigger(e.startTrigger),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildScenarioAction(sa: ScenarioAction): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = buildAttrs({ name: sa.name });

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
      result.GlobalAction = buildGlobalAction(action as GlobalAction);
      break;
    default:
      result.PrivateAction = buildPrivateAction(action as PrivateAction);
      break;
  }

  return result;
}
