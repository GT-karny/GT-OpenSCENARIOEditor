import { describe, it, expect, beforeEach } from 'vitest';
import { createScenarioStore } from '@osce/scenario-engine';
import { actionTools } from '../tools/action-tools.js';
import { storyboardTools } from '../tools/storyboard-tools.js';
import type { ScenarioStoreInstance } from '../tools/tool-registry.js';

function callTool(name: string, args: Record<string, unknown>, store: ScenarioStoreInstance) {
  const tool = [...actionTools, ...storyboardTools].find((t) => t.name === name);
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool.handler(args, store);
}

function setupStoryboard(store: ScenarioStoreInstance): string {
  const story = callTool('add_story', {}, store);
  const storyId = (story.data as Record<string, unknown>)['storyId'] as string;
  const act = callTool('add_act', { storyId }, store);
  const actId = (act.data as Record<string, unknown>)['actId'] as string;
  const mg = callTool('add_maneuver_group', { actId, actors: ['Ego'] }, store);
  const maneuverId = (mg.data as Record<string, unknown>)['maneuverId'] as string;
  const event = callTool('add_event', { maneuverId }, store);
  return (event.data as Record<string, unknown>)['eventId'] as string;
}

describe('action-tools', () => {
  let store: ScenarioStoreInstance;
  let eventId: string;

  beforeEach(() => {
    store = createScenarioStore();
    store.getState().createScenario();
    store.getState().addEntity({ name: 'Ego', type: 'vehicle' });
    eventId = setupStoryboard(store);
  });

  describe('add_speed_action', () => {
    it('should add a speed action with defaults', () => {
      const result = callTool('add_speed_action', { eventId, targetSpeed: 20 }, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['actionId']).toBeDefined();
    });

    it('should add speed action with custom dynamics', () => {
      const result = callTool('add_speed_action', {
        eventId,
        targetSpeed: 30,
        transitionDynamics: { shape: 'sinusoidal', value: 5, dimension: 'time' },
      }, store);
      expect(result.success).toBe(true);
    });

    it('should fail without eventId', () => {
      const result = callTool('add_speed_action', { targetSpeed: 10 }, store);
      expect(result.success).toBe(false);
    });

    it('should fail without targetSpeed', () => {
      const result = callTool('add_speed_action', { eventId }, store);
      expect(result.success).toBe(false);
    });
  });

  describe('add_lane_change_action', () => {
    it('should add an absolute lane change action (default)', () => {
      const result = callTool('add_lane_change_action', { eventId, targetLane: -2 }, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['actionId']).toBeDefined();
      const action = data['action'] as Record<string, unknown>;
      const target = action['target'] as Record<string, unknown>;
      expect(target['kind']).toBe('absolute');
      expect(target['value']).toBe(-2);
    });

    it('should add an absolute lane change action when targetType is explicit', () => {
      const result = callTool('add_lane_change_action', {
        eventId,
        targetLane: 3,
        targetType: 'absolute',
      }, store);
      expect(result.success).toBe(true);
      const action = (result.data as Record<string, unknown>)['action'] as Record<string, unknown>;
      const target = action['target'] as Record<string, unknown>;
      expect(target['kind']).toBe('absolute');
      expect(target['value']).toBe(3);
    });

    it('should add a relative lane change action with entityRef', () => {
      const result = callTool('add_lane_change_action', {
        eventId,
        targetLane: -1,
        targetType: 'relative',
        entityRef: 'Ego',
      }, store);
      expect(result.success).toBe(true);
      const action = (result.data as Record<string, unknown>)['action'] as Record<string, unknown>;
      const target = action['target'] as Record<string, unknown>;
      expect(target['kind']).toBe('relative');
      expect(target['value']).toBe(-1);
      expect(target['entityRef']).toBe('Ego');
    });

    it('should fail when targetType is relative but entityRef is missing', () => {
      const result = callTool('add_lane_change_action', {
        eventId,
        targetLane: -1,
        targetType: 'relative',
      }, store);
      expect(result.success).toBe(false);
      expect(result.error).toContain('entityRef');
    });

    it('should fail without targetLane', () => {
      const result = callTool('add_lane_change_action', { eventId }, store);
      expect(result.success).toBe(false);
    });
  });

  describe('add_teleport_action', () => {
    it('should add a teleport action with world position shorthand', () => {
      const result = callTool('add_teleport_action', { eventId, x: 100, y: 200 }, store);
      expect(result.success).toBe(true);
    });

    it('should add a teleport action with lane position shorthand', () => {
      const result = callTool('add_teleport_action', {
        eventId, roadId: '1', laneId: '-1', s: 50
      }, store);
      expect(result.success).toBe(true);
    });

    it('should fail without position data', () => {
      const result = callTool('add_teleport_action', { eventId }, store);
      expect(result.success).toBe(false);
    });
  });

  describe('add_action', () => {
    it('should add a generic action', () => {
      const result = callTool('add_action', {
        eventId,
        action: {
          type: 'speedAction',
          dynamics: { dynamicsShape: 'step', dynamicsDimension: 'time', value: 0 },
          target: { kind: 'absolute', value: 0 },
        },
      }, store);
      expect(result.success).toBe(true);
    });

    it('should fail without action object', () => {
      const result = callTool('add_action', { eventId }, store);
      expect(result.success).toBe(false);
    });
  });
});
