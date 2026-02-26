/**
 * Shared test helpers and fixtures.
 */

import type { ScenarioDocument } from '@osce/shared';
import {
  createDefaultDocument,
  createStoryFromPartial,
  createActFromPartial,
  createManeuverGroupFromPartial,
  createManeuverFromPartial,
  createEventFromPartial,
  createActionFromPartial,
  createDefaultTrigger,
  createDefaultConditionGroup,
  createConditionFromPartial,
  createEntityFromPartial,
  createEntityInitActions,
  createInitPrivateAction,
} from '../store/defaults.js';

/**
 * Creates a richly populated test document for tree traversal and other tests.
 */
export function createTestDocument(): ScenarioDocument {
  const condition = createConditionFromPartial({ name: 'TestCondition' });
  const conditionGroup = createDefaultConditionGroup();
  conditionGroup.conditions.push(condition);

  const startTrigger = createDefaultTrigger();
  startTrigger.conditionGroups.push(conditionGroup);

  const action = createActionFromPartial({ name: 'TestAction' });
  const event = createEventFromPartial({
    name: 'TestEvent',
    actions: [action],
    startTrigger,
  });
  const maneuver = createManeuverFromPartial({
    name: 'TestManeuver',
    events: [event],
  });
  const maneuverGroup = createManeuverGroupFromPartial({
    name: 'TestManeuverGroup',
    maneuvers: [maneuver],
  });

  const actStartTrigger = createDefaultTrigger();
  const act = createActFromPartial({
    name: 'TestAct',
    maneuverGroups: [maneuverGroup],
    startTrigger: actStartTrigger,
  });
  const story = createStoryFromPartial({
    name: 'TestStory',
    acts: [act],
  });

  const entity = createEntityFromPartial({ name: 'Ego' });
  const entity2 = createEntityFromPartial({ name: 'Target' });

  const initActions = createEntityInitActions('Ego');
  initActions.privateActions.push(
    createInitPrivateAction({
      type: 'teleportAction',
      position: { type: 'worldPosition', x: 0, y: 0 },
    }),
  );

  const doc = createDefaultDocument();
  doc.entities = [entity, entity2];
  doc.storyboard.stories = [story];
  doc.storyboard.init.entityActions = [initActions];

  return doc;
}

/**
 * Creates mock getDoc/setDoc closures for testing commands in isolation.
 */
export function createMockGetSet(initial: ScenarioDocument) {
  let doc = initial;
  return {
    getDoc: () => doc,
    setDoc: (newDoc: ScenarioDocument) => { doc = newDoc; },
    getLatest: () => doc,
  };
}
