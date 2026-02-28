import { describe, it, expect, beforeEach } from 'vitest';
import { createScenarioStore } from '@osce/scenario-engine';
import { storyboardTools } from '../tools/storyboard-tools.js';
import type { ScenarioStoreInstance } from '../tools/tool-registry.js';

function callTool(name: string, args: Record<string, unknown>, store: ScenarioStoreInstance) {
  const tool = storyboardTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool.handler(args, store);
}

describe('storyboard-tools', () => {
  let store: ScenarioStoreInstance;

  beforeEach(() => {
    store = createScenarioStore();
    store.getState().createScenario();
    store.getState().addEntity({ name: 'Ego', type: 'vehicle' });
  });

  describe('add_story', () => {
    it('should add a story', () => {
      const result = callTool('add_story', {}, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['storyId']).toBeDefined();
      expect(store.getState().getScenario().storyboard.stories).toHaveLength(1);
    });

    it('should add a story with custom name', () => {
      const result = callTool('add_story', { name: 'CutInStory' }, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['name']).toBe('CutInStory');
    });
  });

  describe('add_act', () => {
    it('should add an act to a story', () => {
      const storyResult = callTool('add_story', {}, store);
      const storyId = (storyResult.data as Record<string, unknown>)['storyId'] as string;

      const result = callTool('add_act', { storyId }, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['actId']).toBeDefined();
      expect(data['startTriggerId']).toBeDefined();
    });

    it('should fail without storyId', () => {
      const result = callTool('add_act', {}, store);
      expect(result.success).toBe(false);
    });
  });

  describe('add_maneuver_group', () => {
    it('should add a maneuver group with auto-created maneuver', () => {
      const storyResult = callTool('add_story', {}, store);
      const storyId = (storyResult.data as Record<string, unknown>)['storyId'] as string;
      const actResult = callTool('add_act', { storyId }, store);
      const actId = (actResult.data as Record<string, unknown>)['actId'] as string;

      const result = callTool('add_maneuver_group', { actId, actors: ['Ego'] }, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['maneuverGroupId']).toBeDefined();
      expect(data['maneuverId']).toBeDefined();
      expect(data['actors']).toEqual(['Ego']);
    });

    it('should fail without actors', () => {
      const result = callTool('add_maneuver_group', { actId: 'something' }, store);
      expect(result.success).toBe(false);
    });
  });

  describe('add_event', () => {
    it('should add an event to a maneuver', () => {
      const storyResult = callTool('add_story', {}, store);
      const storyId = (storyResult.data as Record<string, unknown>)['storyId'] as string;
      const actResult = callTool('add_act', { storyId }, store);
      const actId = (actResult.data as Record<string, unknown>)['actId'] as string;
      const mgResult = callTool('add_maneuver_group', { actId, actors: ['Ego'] }, store);
      const maneuverId = (mgResult.data as Record<string, unknown>)['maneuverId'] as string;

      const result = callTool('add_event', { maneuverId }, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['eventId']).toBeDefined();
      expect(data['startTriggerId']).toBeDefined();
    });

    it('should add event with custom priority', () => {
      const storyResult = callTool('add_story', {}, store);
      const storyId = (storyResult.data as Record<string, unknown>)['storyId'] as string;
      const actResult = callTool('add_act', { storyId }, store);
      const actId = (actResult.data as Record<string, unknown>)['actId'] as string;
      const mgResult = callTool('add_maneuver_group', { actId, actors: ['Ego'] }, store);
      const maneuverId = (mgResult.data as Record<string, unknown>)['maneuverId'] as string;

      const result = callTool('add_event', { maneuverId, priority: 'parallel' }, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['priority']).toBe('parallel');
    });
  });
});
