import { describe, it, expect, beforeEach } from 'vitest';
import { createScenarioStore } from '@osce/scenario-engine';
import { initTools } from '../tools/init-tools.js';
import type { ScenarioStoreInstance } from '../tools/tool-registry.js';

function callTool(name: string, args: Record<string, unknown>, store: ScenarioStoreInstance) {
  const tool = initTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool.handler(args, store);
}

describe('init-tools', () => {
  let store: ScenarioStoreInstance;

  beforeEach(() => {
    store = createScenarioStore();
    store.getState().createScenario();
    store.getState().addEntity({ name: 'Ego', type: 'vehicle' });
  });

  describe('set_init_position', () => {
    it('should set world position with shorthand', () => {
      const result = callTool('set_init_position', { entityName: 'Ego', x: 10, y: 20 }, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      const pos = data['position'] as Record<string, unknown>;
      expect(pos['type']).toBe('worldPosition');
      expect(pos['x']).toBe(10);
      expect(pos['y']).toBe(20);
    });

    it('should set world position with z and h', () => {
      const result = callTool('set_init_position', { entityName: 'Ego', x: 0, y: 0, z: 1.5, h: 3.14 }, store);
      expect(result.success).toBe(true);
      const pos = (result.data as Record<string, unknown>)['position'] as Record<string, unknown>;
      expect(pos['z']).toBe(1.5);
      expect(pos['h']).toBe(3.14);
    });

    it('should set lane position with shorthand', () => {
      const result = callTool('set_init_position', {
        entityName: 'Ego', roadId: '1', laneId: '-1', s: 100
      }, store);
      expect(result.success).toBe(true);
      const pos = (result.data as Record<string, unknown>)['position'] as Record<string, unknown>;
      expect(pos['type']).toBe('lanePosition');
      expect(pos['roadId']).toBe('1');
      expect(pos['laneId']).toBe('-1');
      expect(pos['s']).toBe(100);
    });

    it('should set position with full position object', () => {
      const result = callTool('set_init_position', {
        entityName: 'Ego',
        position: { type: 'worldPosition', x: 5, y: 10 },
      }, store);
      expect(result.success).toBe(true);
    });

    it('should fail for non-existent entity', () => {
      const result = callTool('set_init_position', { entityName: 'NonExistent', x: 0, y: 0 }, store);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail without position data', () => {
      const result = callTool('set_init_position', { entityName: 'Ego' }, store);
      expect(result.success).toBe(false);
    });
  });

  describe('set_init_speed', () => {
    it('should set initial speed', () => {
      const result = callTool('set_init_speed', { entityName: 'Ego', speed: 13.89 }, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['speed']).toBe(13.89);
    });

    it('should fail for non-existent entity', () => {
      const result = callTool('set_init_speed', { entityName: 'NonExistent', speed: 10 }, store);
      expect(result.success).toBe(false);
    });

    it('should fail without speed', () => {
      const result = callTool('set_init_speed', { entityName: 'Ego' }, store);
      expect(result.success).toBe(false);
    });
  });
});
