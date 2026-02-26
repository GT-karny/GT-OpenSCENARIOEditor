import { describe, it, expect, beforeEach } from 'vitest';
import { createScenarioStore } from '../store/scenario-store.js';
import type { ScenarioStore } from '../store/scenario-store.js';
import type { StoreApi } from 'zustand/vanilla';

describe('ScenarioStore', () => {
  let store: StoreApi<ScenarioStore>;
  let s: ScenarioStore;

  beforeEach(() => {
    store = createScenarioStore();
    s = store.getState();
  });

  describe('createScenario', () => {
    it('creates a valid default document', () => {
      const doc = s.createScenario();
      expect(doc.id).toBeDefined();
      expect(doc.entities).toEqual([]);
      expect(doc.storyboard).toBeDefined();
      // Store state is updated
      expect(store.getState().document.id).toBe(doc.id);
    });

    it('clears undo/redo history', () => {
      s.addEntity({ name: 'X' });
      expect(s.canUndo()).toBe(true);
      s.createScenario();
      s = store.getState();
      expect(s.canUndo()).toBe(false);
    });
  });

  describe('entity operations', () => {
    it('addEntity and getEntity', () => {
      const entity = s.addEntity({ name: 'Ego' });
      s = store.getState();
      expect(s.getEntity(entity.id)).toBeDefined();
      expect(s.getEntity(entity.id)!.name).toBe('Ego');
    });

    it('removeEntity', () => {
      const entity = s.addEntity({ name: 'Ego' });
      s = store.getState();
      s.removeEntity(entity.id);
      s = store.getState();
      expect(s.getEntity(entity.id)).toBeUndefined();
    });

    it('updateEntity', () => {
      const entity = s.addEntity({ name: 'Ego' });
      s = store.getState();
      s.updateEntity(entity.id, { name: 'EgoUpdated' });
      s = store.getState();
      expect(s.getEntity(entity.id)!.name).toBe('EgoUpdated');
    });
  });

  describe('storyboard operations', () => {
    it('addStory and removeStory', () => {
      const story = s.addStory({ name: 'MyStory' });
      s = store.getState();
      expect(s.getScenario().storyboard.stories).toHaveLength(1);

      s.removeStory(story.id);
      s = store.getState();
      expect(s.getScenario().storyboard.stories).toHaveLength(0);
    });

    it('addAct and removeAct', () => {
      const story = s.addStory({ name: 'S' });
      s = store.getState();
      const act = s.addAct(story.id, { name: 'A' });
      s = store.getState();
      expect(s.getScenario().storyboard.stories[0].acts).toHaveLength(1);

      s.removeAct(act.id);
      s = store.getState();
      expect(s.getScenario().storyboard.stories[0].acts).toHaveLength(0);
    });

    it('full storyboard hierarchy', () => {
      const story = s.addStory({ name: 'S' });
      s = store.getState();
      const act = s.addAct(story.id, { name: 'A' });
      s = store.getState();
      const group = s.addManeuverGroup(act.id, { name: 'MG' });
      s = store.getState();
      const maneuver = s.addManeuver(group.id, { name: 'M' });
      s = store.getState();
      const event = s.addEvent(maneuver.id, { name: 'E' });
      s = store.getState();
      s.addAction(event.id, { name: 'Act' });
      s = store.getState();

      const events = s.getScenario().storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events;
      expect(events).toHaveLength(1);
      expect(events[0].actions).toHaveLength(1);
    });
  });

  describe('trigger operations', () => {
    it('addConditionGroup and addCondition', () => {
      const story = s.addStory({ name: 'S' });
      s = store.getState();
      s.addAct(story.id, { name: 'A' });
      s = store.getState();
      const triggerId = s.getScenario().storyboard.stories[0].acts[0].startTrigger.id;

      const group = s.addConditionGroup(triggerId);
      s = store.getState();
      expect(s.getScenario().storyboard.stories[0].acts[0].startTrigger.conditionGroups).toHaveLength(1);

      s.addCondition(group.id, { name: 'SimTime' });
      s = store.getState();
      expect(s.getScenario().storyboard.stories[0].acts[0].startTrigger.conditionGroups[0].conditions).toHaveLength(1);
    });
  });

  describe('init operations', () => {
    it('setInitPosition and setInitSpeed', () => {
      s.addEntity({ name: 'Ego' });
      s = store.getState();
      s.setInitPosition('Ego', { type: 'worldPosition', x: 10, y: 20 });
      s = store.getState();
      s.setInitSpeed('Ego', 30);
      s = store.getState();

      const ea = s.getScenario().storyboard.init.entityActions;
      expect(ea).toHaveLength(1);
      expect(ea[0].entityRef).toBe('Ego');
      expect(ea[0].privateActions.length).toBeGreaterThanOrEqual(2);
    });

    it('addInitAction and removeInitAction', () => {
      s.addInitAction('Ego', {
        type: 'teleportAction',
        position: { type: 'worldPosition', x: 0, y: 0 },
      });
      s = store.getState();
      expect(s.getScenario().storyboard.init.entityActions).toHaveLength(1);

      const actionId = s.getScenario().storyboard.init.entityActions[0].privateActions[0].id;
      s.removeInitAction(actionId);
      s = store.getState();
      expect(s.getScenario().storyboard.init.entityActions[0].privateActions).toHaveLength(0);
    });
  });

  describe('query operations', () => {
    it('getElementById finds elements', () => {
      const entity = s.addEntity({ name: 'Ego' });
      s = store.getState();
      const found = s.getElementById(entity.id);
      expect(found).toBeDefined();
    });

    it('getParentOf finds parent', () => {
      const entity = s.addEntity({ name: 'Ego' });
      s = store.getState();
      const result = s.getParentOf(entity.id);
      expect(result).toBeDefined();
      expect(result!.field).toBe('entities');
    });
  });

  describe('undo/redo', () => {
    it('canUndo and canRedo reflect state', () => {
      expect(s.canUndo()).toBe(false);
      expect(s.canRedo()).toBe(false);

      s.addEntity({ name: 'Ego' });
      s = store.getState();
      expect(s.canUndo()).toBe(true);
      expect(s.canRedo()).toBe(false);
    });

    it('undo reverses addEntity', () => {
      s.addEntity({ name: 'Ego' });
      s = store.getState();
      expect(s.getScenario().entities).toHaveLength(1);

      s.undo();
      s = store.getState();
      expect(s.getScenario().entities).toHaveLength(0);
      expect(s.canRedo()).toBe(true);
    });

    it('redo restores undone operation', () => {
      s.addEntity({ name: 'Ego' });
      s = store.getState();
      s.undo();
      s = store.getState();
      s.redo();
      s = store.getState();
      expect(s.getScenario().entities).toHaveLength(1);
    });

    it('undoAvailable/redoAvailable reactive state', () => {
      expect(store.getState().undoAvailable).toBe(false);
      expect(store.getState().redoAvailable).toBe(false);

      s.addEntity({ name: 'Ego' });
      expect(store.getState().undoAvailable).toBe(true);

      store.getState().undo();
      expect(store.getState().undoAvailable).toBe(false);
      expect(store.getState().redoAvailable).toBe(true);
    });

    it('multiple operations undo/redo cycle', () => {
      s.addEntity({ name: 'A' });
      s = store.getState();
      s.addEntity({ name: 'B' });
      s = store.getState();
      s.addEntity({ name: 'C' });
      s = store.getState();
      expect(s.getScenario().entities).toHaveLength(3);

      s.undo();
      s = store.getState();
      expect(s.getScenario().entities).toHaveLength(2);

      s.undo();
      s = store.getState();
      expect(s.getScenario().entities).toHaveLength(1);

      s.redo();
      s = store.getState();
      expect(s.getScenario().entities).toHaveLength(2);

      // New operation clears redo stack
      s.addEntity({ name: 'D' });
      s = store.getState();
      expect(s.canRedo()).toBe(false);
      expect(s.getScenario().entities).toHaveLength(3);
    });

    it('undo/redo across storyboard operations', () => {
      const story = s.addStory({ name: 'S' });
      s = store.getState();
      s.addAct(story.id, { name: 'A' });
      s = store.getState();
      expect(s.getScenario().storyboard.stories[0].acts).toHaveLength(1);

      s.undo(); // undo addAct
      s = store.getState();
      expect(s.getScenario().storyboard.stories[0].acts).toHaveLength(0);

      s.undo(); // undo addStory
      s = store.getState();
      expect(s.getScenario().storyboard.stories).toHaveLength(0);

      s.redo(); // redo addStory
      s = store.getState();
      expect(s.getScenario().storyboard.stories).toHaveLength(1);

      s.redo(); // redo addAct
      s = store.getState();
      expect(s.getScenario().storyboard.stories[0].acts).toHaveLength(1);
    });
  });
});
