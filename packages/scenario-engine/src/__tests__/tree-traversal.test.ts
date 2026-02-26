import { describe, it, expect } from 'vitest';
import { getElementById, getParentOf } from '../operations/tree-traversal.js';
import { createTestDocument } from './helpers.js';
import type { ScenarioEntity, Story, Act, ManeuverGroup, Maneuver, ScenarioEvent, ScenarioAction, Trigger, ConditionGroup, Condition, EntityInitActions, InitPrivateAction } from '@osce/shared';

describe('tree-traversal', () => {
  describe('getElementById', () => {
    it('finds the document itself', () => {
      const doc = createTestDocument();
      const found = getElementById(doc, doc.id);
      expect(found).toBe(doc);
    });

    it('finds an entity', () => {
      const doc = createTestDocument();
      const entity = doc.entities[0];
      const found = getElementById(doc, entity.id) as ScenarioEntity;
      expect(found).toBeDefined();
      expect(found.name).toBe('Ego');
    });

    it('finds the storyboard', () => {
      const doc = createTestDocument();
      const found = getElementById(doc, doc.storyboard.id);
      expect(found).toBe(doc.storyboard);
    });

    it('finds a story', () => {
      const doc = createTestDocument();
      const story = doc.storyboard.stories[0];
      const found = getElementById(doc, story.id) as Story;
      expect(found).toBeDefined();
      expect(found.name).toBe('TestStory');
    });

    it('finds an act', () => {
      const doc = createTestDocument();
      const act = doc.storyboard.stories[0].acts[0];
      const found = getElementById(doc, act.id) as Act;
      expect(found).toBeDefined();
      expect(found.name).toBe('TestAct');
    });

    it('finds a maneuver group', () => {
      const doc = createTestDocument();
      const group = doc.storyboard.stories[0].acts[0].maneuverGroups[0];
      const found = getElementById(doc, group.id) as ManeuverGroup;
      expect(found).toBeDefined();
      expect(found.name).toBe('TestManeuverGroup');
    });

    it('finds a maneuver', () => {
      const doc = createTestDocument();
      const maneuver = doc.storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0];
      const found = getElementById(doc, maneuver.id) as Maneuver;
      expect(found).toBeDefined();
      expect(found.name).toBe('TestManeuver');
    });

    it('finds an event', () => {
      const doc = createTestDocument();
      const event = doc.storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0];
      const found = getElementById(doc, event.id) as ScenarioEvent;
      expect(found).toBeDefined();
      expect(found.name).toBe('TestEvent');
    });

    it('finds an action', () => {
      const doc = createTestDocument();
      const action = doc.storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0].actions[0];
      const found = getElementById(doc, action.id) as ScenarioAction;
      expect(found).toBeDefined();
      expect(found.name).toBe('TestAction');
    });

    it('finds a trigger', () => {
      const doc = createTestDocument();
      const trigger = doc.storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0].startTrigger;
      const found = getElementById(doc, trigger.id) as Trigger;
      expect(found).toBeDefined();
      expect(found.conditionGroups.length).toBeGreaterThan(0);
    });

    it('finds a condition group', () => {
      const doc = createTestDocument();
      const group = doc.storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0].startTrigger.conditionGroups[0];
      const found = getElementById(doc, group.id) as ConditionGroup;
      expect(found).toBeDefined();
      expect(found.conditions.length).toBeGreaterThan(0);
    });

    it('finds a condition', () => {
      const doc = createTestDocument();
      const condition = doc.storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0].startTrigger.conditionGroups[0].conditions[0];
      const found = getElementById(doc, condition.id) as Condition;
      expect(found).toBeDefined();
      expect(found.name).toBe('TestCondition');
    });

    it('finds init entity actions', () => {
      const doc = createTestDocument();
      const ea = doc.storyboard.init.entityActions[0];
      const found = getElementById(doc, ea.id) as EntityInitActions;
      expect(found).toBeDefined();
      expect(found.entityRef).toBe('Ego');
    });

    it('finds init private action', () => {
      const doc = createTestDocument();
      const pa = doc.storyboard.init.entityActions[0].privateActions[0];
      const found = getElementById(doc, pa.id) as InitPrivateAction;
      expect(found).toBeDefined();
      expect(found.action.type).toBe('teleportAction');
    });

    it('finds the storyboard stop trigger', () => {
      const doc = createTestDocument();
      const found = getElementById(doc, doc.storyboard.stopTrigger.id);
      expect(found).toBe(doc.storyboard.stopTrigger);
    });

    it('returns undefined for nonexistent id', () => {
      const doc = createTestDocument();
      expect(getElementById(doc, 'nonexistent')).toBeUndefined();
    });
  });

  describe('getParentOf', () => {
    it('finds parent of an entity', () => {
      const doc = createTestDocument();
      const entity = doc.entities[0];
      const result = getParentOf(doc, entity.id);
      expect(result).toBeDefined();
      expect(result!.parent).toBe(doc);
      expect(result!.field).toBe('entities');
    });

    it('finds parent of a story', () => {
      const doc = createTestDocument();
      const story = doc.storyboard.stories[0];
      const result = getParentOf(doc, story.id);
      expect(result).toBeDefined();
      expect(result!.field).toBe('stories');
    });

    it('finds parent of an act', () => {
      const doc = createTestDocument();
      const act = doc.storyboard.stories[0].acts[0];
      const result = getParentOf(doc, act.id);
      expect(result).toBeDefined();
      expect(result!.field).toBe('acts');
    });

    it('finds parent of a maneuver group', () => {
      const doc = createTestDocument();
      const group = doc.storyboard.stories[0].acts[0].maneuverGroups[0];
      const result = getParentOf(doc, group.id);
      expect(result).toBeDefined();
      expect(result!.field).toBe('maneuverGroups');
    });

    it('finds parent of a condition', () => {
      const doc = createTestDocument();
      const condition = doc.storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0].startTrigger.conditionGroups[0].conditions[0];
      const result = getParentOf(doc, condition.id);
      expect(result).toBeDefined();
      expect(result!.field).toBe('conditions');
    });

    it('finds parent of storyboard (single child)', () => {
      const doc = createTestDocument();
      const result = getParentOf(doc, doc.storyboard.id);
      expect(result).toBeDefined();
      expect(result!.parent).toBe(doc);
      expect(result!.field).toBe('storyboard');
    });

    it('finds parent of init', () => {
      const doc = createTestDocument();
      const result = getParentOf(doc, doc.storyboard.init.id);
      expect(result).toBeDefined();
      expect(result!.field).toBe('init');
    });

    it('returns undefined for the root document id', () => {
      const doc = createTestDocument();
      // The document itself has no parent in the document tree
      expect(getParentOf(doc, doc.id)).toBeUndefined();
    });

    it('returns undefined for nonexistent id', () => {
      const doc = createTestDocument();
      expect(getParentOf(doc, 'nonexistent')).toBeUndefined();
    });
  });
});
