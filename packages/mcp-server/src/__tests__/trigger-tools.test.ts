import { describe, it, expect, beforeEach } from 'vitest';
import { createScenarioStore } from '@osce/scenario-engine';
import { triggerTools } from '../tools/trigger-tools.js';
import { storyboardTools } from '../tools/storyboard-tools.js';
import type { ScenarioStoreInstance } from '../tools/tool-registry.js';

function callTool(name: string, args: Record<string, unknown>, store: ScenarioStoreInstance) {
  const tool = [...triggerTools, ...storyboardTools].find((t) => t.name === name);
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool.handler(args, store);
}

function setupEvent(store: ScenarioStoreInstance): string {
  const story = callTool('add_story', {}, store);
  const storyId = (story.data as Record<string, unknown>)['storyId'] as string;
  const act = callTool('add_act', { storyId }, store);
  const actId = (act.data as Record<string, unknown>)['actId'] as string;
  const mg = callTool('add_maneuver_group', { actId, actors: ['Ego'] }, store);
  const maneuverId = (mg.data as Record<string, unknown>)['maneuverId'] as string;
  const event = callTool('add_event', { maneuverId }, store);
  return (event.data as Record<string, unknown>)['eventId'] as string;
}

describe('trigger-tools', () => {
  let store: ScenarioStoreInstance;
  let eventId: string;

  beforeEach(() => {
    store = createScenarioStore();
    store.getState().createScenario();
    store.getState().addEntity({ name: 'Ego', type: 'vehicle' });
    eventId = setupEvent(store);
  });

  describe('add_simulation_time_trigger', () => {
    it('should set a simulation time trigger', () => {
      const result = callTool('add_simulation_time_trigger', { elementId: eventId, time: 5 }, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['time']).toBe(5);
    });

    it('should fail without time', () => {
      const result = callTool('add_simulation_time_trigger', { elementId: eventId }, store);
      expect(result.success).toBe(false);
    });
  });

  describe('add_distance_trigger', () => {
    it('should set a distance trigger', () => {
      const result = callTool('add_distance_trigger', {
        elementId: eventId,
        entityRef: 'Ego',
        value: 10,
        x: 100,
        y: 200,
      }, store);
      expect(result.success).toBe(true);
    });

    it('should fail without entityRef', () => {
      const result = callTool('add_distance_trigger', {
        elementId: eventId, value: 10, x: 0, y: 0
      }, store);
      expect(result.success).toBe(false);
    });
  });

  describe('set_start_trigger', () => {
    it('should set trigger with simulation time condition', () => {
      const result = callTool('set_start_trigger', {
        elementId: eventId,
        conditions: [{ type: 'simulationTime', time: 3 }],
      }, store);
      expect(result.success).toBe(true);
    });

    it('should set trigger with multiple conditions', () => {
      const result = callTool('set_start_trigger', {
        elementId: eventId,
        conditions: [
          { type: 'simulationTime', time: 3 },
          { type: 'simulationTime', time: 5 },
        ],
      }, store);
      expect(result.success).toBe(true);
    });

    it('should fail with empty conditions array', () => {
      const result = callTool('set_start_trigger', { elementId: eventId, conditions: [] }, store);
      expect(result.success).toBe(false);
    });
  });
});
