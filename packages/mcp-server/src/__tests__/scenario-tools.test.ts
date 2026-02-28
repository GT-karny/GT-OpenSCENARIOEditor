import { describe, it, expect, beforeEach } from 'vitest';
import { createScenarioStore } from '@osce/scenario-engine';
import { scenarioTools } from '../tools/scenario-tools.js';
import type { ScenarioStoreInstance } from '../tools/tool-registry.js';

function callTool(name: string, args: Record<string, unknown>, store: ScenarioStoreInstance) {
  const tool = scenarioTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool.handler(args, store);
}

describe('scenario-tools', () => {
  let store: ScenarioStoreInstance;

  beforeEach(() => {
    store = createScenarioStore();
  });

  describe('create_scenario', () => {
    it('should create an empty scenario', () => {
      const result = callTool('create_scenario', {}, store);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('documentId');
      const doc = store.getState().getScenario();
      expect(doc.entities).toHaveLength(0);
    });

    it('should reset state when called again', () => {
      store.getState().addEntity({ name: 'Ego', type: 'vehicle' });
      expect(store.getState().getScenario().entities).toHaveLength(1);

      const result = callTool('create_scenario', {}, store);
      expect(result.success).toBe(true);
      expect(store.getState().getScenario().entities).toHaveLength(0);
    });
  });

  describe('get_scenario_state', () => {
    it('should return scenario state and document', () => {
      store.getState().createScenario();
      store.getState().addEntity({ name: 'Ego', type: 'vehicle' });

      const result = callTool('get_scenario_state', {}, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data).toHaveProperty('state');
      expect(data).toHaveProperty('document');
      const state = data['state'] as Record<string, unknown>;
      expect(state['entityCount']).toBe(1);
    });
  });

  describe('export_xosc', () => {
    it('should export XML', () => {
      store.getState().createScenario();
      const result = callTool('export_xosc', {}, store);
      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      expect(result.data as string).toContain('OpenSCENARIO');
    });

    it('should export formatted XML by default', () => {
      store.getState().createScenario();
      const result = callTool('export_xosc', { formatted: true }, store);
      expect(result.success).toBe(true);
      expect((result.data as string).includes('\n')).toBe(true);
    });
  });

  describe('validate_scenario', () => {
    it('should return validation result', () => {
      store.getState().createScenario();
      const result = callTool('validate_scenario', {}, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data).toHaveProperty('valid');
      expect(data).toHaveProperty('errors');
      expect(data).toHaveProperty('warnings');
    });
  });

  describe('import_xosc', () => {
    it('should reject missing xml parameter', () => {
      const result = callTool('import_xosc', {}, store);
      expect(result.success).toBe(false);
      expect(result.error).toContain('xml');
    });

    it('should reject invalid XML', () => {
      const result = callTool('import_xosc', { xml: 'not xml' }, store);
      expect(result.success).toBe(false);
    });
  });
});
