import { describe, it, expect, beforeEach } from 'vitest';
import { createScenarioStore } from '@osce/scenario-engine';
import { templateTools } from '../tools/template-tools.js';
import type { ScenarioStoreInstance } from '../tools/tool-registry.js';

function callTool(name: string, args: Record<string, unknown>, store: ScenarioStoreInstance) {
  const tool = templateTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool.handler(args, store);
}

describe('template-tools', () => {
  let store: ScenarioStoreInstance;

  beforeEach(() => {
    store = createScenarioStore();
    store.getState().createScenario();
  });

  describe('list_templates', () => {
    it('should list available templates', () => {
      const result = callTool('list_templates', {}, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['count']).toBeGreaterThan(0);
      const templates = data['templates'] as Array<Record<string, unknown>>;
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('parameters');
    });
  });

  describe('apply_template', () => {
    it('should apply cutIn template', () => {
      const result = callTool('apply_template', {
        templateId: 'cutIn',
        parameters: {},
      }, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['templateId']).toBe('cutIn');
      expect((data['entitiesAdded'] as number)).toBeGreaterThan(0);
      // Verify entities were actually added
      expect(store.getState().getScenario().entities.length).toBeGreaterThan(0);
    });

    it('should fail with non-existent template', () => {
      const result = callTool('apply_template', { templateId: 'nonExistent' }, store);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail without templateId', () => {
      const result = callTool('apply_template', {}, store);
      expect(result.success).toBe(false);
    });
  });
});
