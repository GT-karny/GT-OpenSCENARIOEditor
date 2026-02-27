import { describe, it, expect, beforeEach } from 'vitest';
import { createScenarioStore } from '@osce/scenario-engine';
import { undoRedoTools } from '../tools/undo-redo-tools.js';
import type { ScenarioStoreInstance } from '../tools/tool-registry.js';

function callTool(name: string, args: Record<string, unknown>, store: ScenarioStoreInstance) {
  const tool = undoRedoTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool.handler(args, store);
}

describe('undo-redo-tools', () => {
  let store: ScenarioStoreInstance;

  beforeEach(() => {
    store = createScenarioStore();
    store.getState().createScenario();
  });

  describe('undo', () => {
    it('should undo the last operation', () => {
      store.getState().addEntity({ name: 'Ego', type: 'vehicle' });
      expect(store.getState().getScenario().entities).toHaveLength(1);

      const result = callTool('undo', {}, store);
      expect(result.success).toBe(true);
      expect(store.getState().getScenario().entities).toHaveLength(0);
    });

    it('should fail when nothing to undo', () => {
      const result = callTool('undo', {}, store);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nothing to undo');
    });
  });

  describe('redo', () => {
    it('should redo the last undone operation', () => {
      store.getState().addEntity({ name: 'Ego', type: 'vehicle' });
      store.getState().undo();
      expect(store.getState().getScenario().entities).toHaveLength(0);

      const result = callTool('redo', {}, store);
      expect(result.success).toBe(true);
      expect(store.getState().getScenario().entities).toHaveLength(1);
    });

    it('should fail when nothing to redo', () => {
      const result = callTool('redo', {}, store);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nothing to redo');
    });
  });
});
