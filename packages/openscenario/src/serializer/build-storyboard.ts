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
} from '@osce/shared';
import { GLOBAL_ACTION_TYPES } from '@osce/shared';
import { buildPrivateAction, buildGlobalAction, buildUserDefinedAction } from './build-actions.js';
import { buildTrigger } from './build-triggers.js';
import { buildParameterDeclarations } from './build-parameters.js';
import { buildInit } from './build-init.js';
import { buildAttrs } from '../utils/xml-helpers.js';

type AllBindings = Record<string, Record<string, string>>;

export function buildStoryboard(sb: Storyboard, allBindings: AllBindings = {}): Record<string, unknown> {
  const result: Record<string, unknown> = {
    Init: buildInit(sb.init, allBindings),
  };

  if (sb.stories.length > 0) {
    result.Story = sb.stories.map((s) => buildStory(s, allBindings));
  }

  result.StopTrigger = buildTrigger(sb.stopTrigger, allBindings);

  return result;
}

function buildStory(story: Story, allBindings: AllBindings): Record<string, unknown> {
  return {
    ...buildAttrs({ name: story.name }),
    ParameterDeclarations: buildParameterDeclarations(story.parameterDeclarations),
    Act: story.acts.map((a) => buildAct(a, allBindings)),
  };
}

function buildAct(act: Act, allBindings: AllBindings): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...buildAttrs({ name: act.name }),
    ManeuverGroup: act.maneuverGroups.map((mg) => buildManeuverGroup(mg, allBindings)),
    StartTrigger: buildTrigger(act.startTrigger, allBindings),
  };
  if (act.stopTrigger) {
    result.StopTrigger = buildTrigger(act.stopTrigger, allBindings);
  }
  return result;
}

function buildManeuverGroup(mg: ManeuverGroup, allBindings: AllBindings): Record<string, unknown> {
  const actors: Record<string, unknown> = buildAttrs({
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

export function buildManeuver(m: Maneuver, allBindings: AllBindings): Record<string, unknown> {
  return {
    ...buildAttrs({ name: m.name }),
    ParameterDeclarations: buildParameterDeclarations(m.parameterDeclarations),
    Event: m.events.map((e) => buildEvent(e, allBindings)),
  };
}

function buildEvent(e: ScenarioEvent, allBindings: AllBindings): Record<string, unknown> {
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

function buildScenarioAction(sa: ScenarioAction, allBindings: AllBindings): Record<string, unknown> {
  const result: Record<string, unknown> = buildAttrs({ name: sa.name });
  const elementBindings = allBindings[sa.id] ?? {};

  const action = sa.action;
  // Route to the XSD wrapper element by the canonical GlobalAction discriminator
  // set rather than a hand-maintained case list, so a newly added GlobalAction
  // member (e.g. setMonitorAction) is dispatched to <GlobalAction> automatically
  // instead of silently falling through to <PrivateAction>.
  if (action.type === 'userDefinedAction') {
    result.UserDefinedAction = buildUserDefinedAction(action);
  } else if ((GLOBAL_ACTION_TYPES as readonly string[]).includes(action.type)) {
    result.GlobalAction = buildGlobalAction(action as GlobalAction, elementBindings);
  } else {
    result.PrivateAction = buildPrivateAction(action as PrivateAction, elementBindings);
  }

  return result;
}
