import { describe, it, expect } from 'vitest';
import {
  createStoryboardNode,
  createInitNode,
  createEntityNode,
  createStoryNode,
  createActNode,
  createEventNode,
  createActionNode,
  createTriggerNode,
  createConditionNode,
} from '../conversion/node-factory.js';
import { createTestDocument } from './helpers.js';

describe('node-factory', () => {
  const doc = createTestDocument();
  const pos = { x: 0, y: 0 };

  describe('createStoryboardNode', () => {
    it('should create storyboard node with correct data', () => {
      const node = createStoryboardNode(doc.storyboard, pos);
      expect(node.type).toBe('storyboard');
      expect(node.data.osceType).toBe('storyboard');
      expect(node.data.storyCount).toBe(doc.storyboard.stories.length);
      expect(node.id).toBe(doc.storyboard.id);
    });
  });

  describe('createInitNode', () => {
    it('should create init node with entity action summaries', () => {
      const node = createInitNode(doc.storyboard.init, pos);
      expect(node.type).toBe('init');
      expect(node.data.osceType).toBe('init');
      expect(node.data.entityActions).toHaveLength(2);
      expect(node.data.entityActions[0].entityRef).toBe('Ego');
      expect(node.data.entityActions[0].actionSummaries.length).toBeGreaterThan(0);
    });
  });

  describe('createEntityNode', () => {
    it('should create entity node with correct type info', () => {
      const entity = doc.entities[0];
      const node = createEntityNode(entity, pos);
      expect(node.type).toBe('entity');
      expect(node.data.osceType).toBe('entity');
      expect(node.data.name).toBe('Ego');
      expect(node.data.entityType).toBe('vehicle');
    });
  });

  describe('createStoryNode', () => {
    it('should create story node with collapsed state', () => {
      const story = doc.storyboard.stories[0];
      const node = createStoryNode(story, pos, false);
      expect(node.data.osceType).toBe('story');
      expect(node.data.name).toBe('CutInStory');
      expect(node.data.actCount).toBe(1);
      expect(node.data.collapsed).toBe(false);
    });
  });

  describe('createActNode', () => {
    it('should create act node with trigger info', () => {
      const act = doc.storyboard.stories[0].acts[0];
      const node = createActNode(act, pos, false);
      expect(node.data.osceType).toBe('act');
      expect(node.data.name).toBe('CutInAct');
      expect(node.data.hasStartTrigger).toBe(true);
    });
  });

  describe('createEventNode', () => {
    it('should create event node with trigger summary', () => {
      const event = doc.storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0];
      const node = createEventNode(event, pos, false);
      expect(node.data.osceType).toBe('event');
      expect(node.data.name).toBe('CutInEvent');
      expect(node.data.priority).toBe('override');
      expect(node.data.actionCount).toBe(1);
      expect(node.data.triggerSummary.length).toBeGreaterThan(0);
    });
  });

  describe('createActionNode', () => {
    it('should create action node with summary', () => {
      const action = doc.storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0].actions[0];
      const node = createActionNode(action, pos);
      expect(node.data.osceType).toBe('action');
      expect(node.data.actionType).toBe('laneChangeAction');
      expect(node.data.summary).toContain('Lane Change');
    });
  });

  describe('createTriggerNode', () => {
    it('should create trigger node', () => {
      const trigger = doc.storyboard.stories[0].acts[0].startTrigger;
      const node = createTriggerNode(trigger, 'start', pos);
      expect(node.data.osceType).toBe('trigger');
      expect(node.data.triggerKind).toBe('start');
      expect(node.data.conditionGroupCount).toBe(1);
    });
  });

  describe('createConditionNode', () => {
    it('should create condition node with summary', () => {
      const condition = doc.storyboard.stories[0].acts[0].startTrigger.conditionGroups[0].conditions[0];
      const node = createConditionNode(condition, pos);
      expect(node.data.osceType).toBe('condition');
      expect(node.data.conditionType).toBe('Simulation Time');
    });
  });
});
