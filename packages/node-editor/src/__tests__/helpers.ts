/**
 * Test helpers: creates richly populated test documents.
 */

import {
  createDefaultDocument,
  createStoryFromPartial,
  createActFromPartial,
  createManeuverGroupFromPartial,
  createManeuverFromPartial,
  createEventFromPartial,
  createActionFromPartial,
  createConditionFromPartial,
  createEntityFromPartial,
  createEntityInitActions,
  createInitPrivateAction,
  createDefaultTrigger,
  createDefaultConditionGroup,
} from '@osce/scenario-engine';
import type { ScenarioDocument, Trigger, Condition } from '@osce/shared';

export function createTestDocument(): ScenarioDocument {
  const doc = createDefaultDocument();

  // Add entities
  const ego = createEntityFromPartial({ name: 'Ego' });
  const target = createEntityFromPartial({ name: 'TargetVehicle' });
  doc.entities.push(ego, target);

  // Add init actions
  const egoInit = createEntityInitActions(ego.name);
  egoInit.privateActions.push(
    createInitPrivateAction({
      type: 'teleportAction',
      position: { type: 'lanePosition', roadId: '1', laneId: '-1', s: 0 },
    }),
    createInitPrivateAction({
      type: 'speedAction',
      dynamics: { dynamicsShape: 'step', dynamicsDimension: 'time', value: 0 },
      target: { kind: 'absolute', value: 20 },
    }),
  );
  const targetInit = createEntityInitActions(target.name);
  targetInit.privateActions.push(
    createInitPrivateAction({
      type: 'teleportAction',
      position: { type: 'lanePosition', roadId: '1', laneId: '-2', s: 50 },
    }),
    createInitPrivateAction({
      type: 'speedAction',
      dynamics: { dynamicsShape: 'step', dynamicsDimension: 'time', value: 0 },
      target: { kind: 'absolute', value: 25 },
    }),
  );
  doc.storyboard.init.entityActions.push(egoInit, targetInit);

  // Create a story with hierarchy
  const condition = createConditionFromPartial({
    name: 'DistanceTrigger',
    condition: {
      kind: 'byEntity',
      triggeringEntities: { triggeringEntitiesRule: 'any', entityRefs: [ego.name] },
      entityCondition: {
        type: 'relativeDistance',
        entityRef: target.name,
        relativeDistanceType: 'cartesianDistance',
        value: 20,
        freespace: true,
        rule: 'lessThan',
      },
    },
  });

  const triggerWithCondition = createTriggerWithCondition(condition);

  const action = createActionFromPartial({
    name: 'LaneChangeLeft',
    action: {
      type: 'laneChangeAction',
      dynamics: { dynamicsShape: 'sinusoidal', dynamicsDimension: 'time', value: 3 },
      target: { kind: 'relative', entityRef: ego.name, value: 1 },
    },
  });

  const event = createEventFromPartial({
    name: 'CutInEvent',
    priority: 'override',
    actions: [action],
    startTrigger: triggerWithCondition,
  });

  const maneuver = createManeuverFromPartial({
    name: 'CutInManeuver',
    events: [event],
  });

  const group = createManeuverGroupFromPartial({
    name: 'CutInGroup',
    actors: { selectTriggeringEntities: false, entityRefs: [target.name] },
    maneuvers: [maneuver],
  });

  const simTimeTrigger = createTriggerWithCondition(
    createConditionFromPartial({
      name: 'SimTimeTrigger',
      condition: {
        kind: 'byValue',
        valueCondition: { type: 'simulationTime', value: 0, rule: 'greaterThan' },
      },
    }),
  );

  const act = createActFromPartial({
    name: 'CutInAct',
    maneuverGroups: [group],
    startTrigger: simTimeTrigger,
  });

  const story = createStoryFromPartial({
    name: 'CutInStory',
    acts: [act],
  });

  doc.storyboard.stories.push(story);

  return doc;
}

function createTriggerWithCondition(condition: Condition): Trigger {
  const trigger = createDefaultTrigger();
  const condGroup = createDefaultConditionGroup();
  condGroup.conditions.push(condition);
  trigger.conditionGroups.push(condGroup);
  return trigger;
}

export function createEmptyDocument(): ScenarioDocument {
  return createDefaultDocument();
}
