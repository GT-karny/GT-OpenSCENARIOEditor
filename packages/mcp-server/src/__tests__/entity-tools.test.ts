import { describe, it, expect, beforeEach } from 'vitest';
import { createScenarioStore } from '@osce/scenario-engine';
import { entityTools } from '../tools/entity-tools.js';
import type { ScenarioStoreInstance } from '../tools/tool-registry.js';

function callTool(name: string, args: Record<string, unknown>, store: ScenarioStoreInstance) {
  const tool = entityTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool.handler(args, store);
}

describe('entity-tools', () => {
  let store: ScenarioStoreInstance;

  beforeEach(() => {
    store = createScenarioStore();
    store.getState().createScenario();
  });

  describe('add_entity', () => {
    it('should add a vehicle entity', () => {
      const result = callTool('add_entity', { name: 'Ego', type: 'vehicle' }, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['name']).toBe('Ego');
      expect(data['type']).toBe('vehicle');
      expect(data['entityId']).toBeDefined();
    });

    it('should add a vehicle with specific category', () => {
      const result = callTool('add_entity', { name: 'Truck1', type: 'vehicle', vehicleCategory: 'truck' }, store);
      expect(result.success).toBe(true);
      const entity = store.getState().getScenario().entities[0];
      expect(entity.definition.kind).toBe('vehicle');
      if (entity.definition.kind === 'vehicle') {
        expect(entity.definition.vehicleCategory).toBe('truck');
      }
    });

    it('should add a pedestrian entity', () => {
      const result = callTool('add_entity', { name: 'Ped1', type: 'pedestrian' }, store);
      expect(result.success).toBe(true);
      const entity = store.getState().getScenario().entities[0];
      expect(entity.type).toBe('pedestrian');
    });

    it('should add a miscObject entity', () => {
      const result = callTool('add_entity', { name: 'Barrier1', type: 'miscObject', miscObjectCategory: 'barrier' }, store);
      expect(result.success).toBe(true);
      const entity = store.getState().getScenario().entities[0];
      expect(entity.type).toBe('miscObject');
    });

    it('should fail without required name', () => {
      const result = callTool('add_entity', { type: 'vehicle' }, store);
      expect(result.success).toBe(false);
    });

    it('should fail without required type', () => {
      const result = callTool('add_entity', { name: 'Ego' }, store);
      expect(result.success).toBe(false);
    });
  });

  describe('list_entities', () => {
    it('should return empty list initially', () => {
      const result = callTool('list_entities', {}, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['count']).toBe(0);
    });

    it('should list added entities', () => {
      callTool('add_entity', { name: 'Ego', type: 'vehicle' }, store);
      callTool('add_entity', { name: 'Target', type: 'vehicle' }, store);

      const result = callTool('list_entities', {}, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data['count']).toBe(2);
    });
  });

  describe('remove_entity', () => {
    it('should remove entity by ID', () => {
      const addResult = callTool('add_entity', { name: 'Ego', type: 'vehicle' }, store);
      const entityId = (addResult.data as Record<string, unknown>)['entityId'] as string;

      const result = callTool('remove_entity', { entityId }, store);
      expect(result.success).toBe(true);
      expect(store.getState().getScenario().entities).toHaveLength(0);
    });

    it('should remove entity by name', () => {
      callTool('add_entity', { name: 'Ego', type: 'vehicle' }, store);

      const result = callTool('remove_entity', { entityName: 'Ego' }, store);
      expect(result.success).toBe(true);
      expect(store.getState().getScenario().entities).toHaveLength(0);
    });

    it('should fail with non-existent name', () => {
      const result = callTool('remove_entity', { entityName: 'NonExistent' }, store);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail without entityId or entityName', () => {
      const result = callTool('remove_entity', {}, store);
      expect(result.success).toBe(false);
    });
  });

  describe('update_entity', () => {
    it('should update entity name', () => {
      const addResult = callTool('add_entity', { name: 'Ego', type: 'vehicle' }, store);
      const entityId = (addResult.data as Record<string, unknown>)['entityId'] as string;

      const result = callTool('update_entity', { entityId, updates: { name: 'EgoVehicle' } }, store);
      expect(result.success).toBe(true);
      const entity = store.getState().getEntity(entityId);
      expect(entity?.name).toBe('EgoVehicle');
    });
  });
});
