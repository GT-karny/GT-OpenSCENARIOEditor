import { describe, it, expect, beforeEach } from 'vitest';
import { createScenarioStore } from '@osce/scenario-engine';
import { findTool, getAllTools } from '../tools/tool-registry.js';
import type { ScenarioStoreInstance } from '../tools/tool-registry.js';

function call(name: string, args: Record<string, unknown>, store: ScenarioStoreInstance) {
  const tool = findTool(name);
  if (!tool) throw new Error(`Tool "${name}" not found`);
  return tool.handler(args, store);
}

describe('integration', () => {
  let store: ScenarioStoreInstance;

  beforeEach(() => {
    store = createScenarioStore();
  });

  it('should register all expected tools', () => {
    const tools = getAllTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain('create_scenario');
    expect(names).toContain('get_scenario_state');
    expect(names).toContain('export_xosc');
    expect(names).toContain('import_xosc');
    expect(names).toContain('validate_scenario');
    expect(names).toContain('add_entity');
    expect(names).toContain('remove_entity');
    expect(names).toContain('list_entities');
    expect(names).toContain('update_entity');
    expect(names).toContain('set_init_position');
    expect(names).toContain('set_init_speed');
    expect(names).toContain('add_story');
    expect(names).toContain('add_act');
    expect(names).toContain('add_maneuver_group');
    expect(names).toContain('add_event');
    expect(names).toContain('add_speed_action');
    expect(names).toContain('add_lane_change_action');
    expect(names).toContain('add_teleport_action');
    expect(names).toContain('add_action');
    expect(names).toContain('set_start_trigger');
    expect(names).toContain('add_simulation_time_trigger');
    expect(names).toContain('add_distance_trigger');
    expect(names).toContain('list_templates');
    expect(names).toContain('apply_template');
    expect(names).toContain('undo');
    expect(names).toContain('redo');
  });

  describe('full scenario creation flow', () => {
    it('should create scenario → add entities → set positions → build storyboard → export', () => {
      // Step 1: Create scenario
      const createResult = call('create_scenario', {}, store);
      expect(createResult.success).toBe(true);

      // Step 2: Add entities
      const egoResult = call('add_entity', { name: 'Ego', type: 'vehicle', vehicleCategory: 'car' }, store);
      expect(egoResult.success).toBe(true);
      const targetResult = call('add_entity', { name: 'Target', type: 'vehicle', vehicleCategory: 'car' }, store);
      expect(targetResult.success).toBe(true);

      // Step 3: Set initial positions
      const posResult1 = call('set_init_position', { entityName: 'Ego', x: 0, y: 0, h: 0 }, store);
      expect(posResult1.success).toBe(true);
      const posResult2 = call('set_init_position', { entityName: 'Target', x: 50, y: 3.5 }, store);
      expect(posResult2.success).toBe(true);

      // Step 4: Set initial speeds
      const speedResult1 = call('set_init_speed', { entityName: 'Ego', speed: 33.33 }, store);
      expect(speedResult1.success).toBe(true);
      const speedResult2 = call('set_init_speed', { entityName: 'Target', speed: 27.78 }, store);
      expect(speedResult2.success).toBe(true);

      // Step 5: Build storyboard
      const storyResult = call('add_story', { name: 'CutInStory' }, store);
      expect(storyResult.success).toBe(true);
      const storyId = (storyResult.data as Record<string, unknown>)['storyId'] as string;

      const actResult = call('add_act', { storyId, name: 'CutInAct' }, store);
      expect(actResult.success).toBe(true);
      const actId = (actResult.data as Record<string, unknown>)['actId'] as string;

      // Set act start trigger
      call('add_simulation_time_trigger', { elementId: actId, time: 0 }, store);

      const mgResult = call('add_maneuver_group', { actId, actors: ['Target'] }, store);
      expect(mgResult.success).toBe(true);
      const maneuverId = (mgResult.data as Record<string, unknown>)['maneuverId'] as string;

      const eventResult = call('add_event', { maneuverId, name: 'LaneChangeEvent' }, store);
      expect(eventResult.success).toBe(true);
      const eventId = (eventResult.data as Record<string, unknown>)['eventId'] as string;

      // Add lane change action
      const laneResult = call('add_lane_change_action', {
        eventId,
        targetLane: -1,
        transitionDynamics: { shape: 'sinusoidal', value: 3, dimension: 'time' },
      }, store);
      expect(laneResult.success).toBe(true);

      // Set event trigger
      call('add_simulation_time_trigger', { elementId: eventId, time: 2 }, store);

      // Step 6: Validate
      const validateResult = call('validate_scenario', {}, store);
      expect(validateResult.success).toBe(true);

      // Step 7: Export
      const exportResult = call('export_xosc', { formatted: true }, store);
      expect(exportResult.success).toBe(true);
      const xml = exportResult.data as string;
      expect(xml).toContain('OpenSCENARIO');
      expect(xml).toContain('Ego');
      expect(xml).toContain('Target');

      // Step 8: Verify state
      const stateResult = call('get_scenario_state', {}, store);
      expect(stateResult.success).toBe(true);
      const state = (stateResult.data as Record<string, unknown>)['state'] as Record<string, unknown>;
      expect(state['entityCount']).toBe(2);
      expect(state['storyCount']).toBe(1);
    });
  });

  describe('undo/redo across operations', () => {
    it('should undo and redo entity operations', () => {
      call('create_scenario', {}, store);
      call('add_entity', { name: 'Ego', type: 'vehicle' }, store);
      call('add_entity', { name: 'Target', type: 'vehicle' }, store);
      expect(store.getState().getScenario().entities).toHaveLength(2);

      // Undo second add
      call('undo', {}, store);
      expect(store.getState().getScenario().entities).toHaveLength(1);

      // Undo first add
      call('undo', {}, store);
      expect(store.getState().getScenario().entities).toHaveLength(0);

      // Redo
      call('redo', {}, store);
      expect(store.getState().getScenario().entities).toHaveLength(1);
      expect(store.getState().getScenario().entities[0].name).toBe('Ego');
    });
  });

  describe('export/import round-trip', () => {
    it('should export and re-import a scenario', () => {
      // Create a scenario with entities
      call('create_scenario', {}, store);
      call('add_entity', { name: 'Ego', type: 'vehicle' }, store);
      call('set_init_position', { entityName: 'Ego', x: 10, y: 20 }, store);
      call('set_init_speed', { entityName: 'Ego', speed: 15 }, store);

      // Export
      const exportResult = call('export_xosc', {}, store);
      expect(exportResult.success).toBe(true);
      const xml = exportResult.data as string;

      // Import into a new state
      const importResult = call('import_xosc', { xml }, store);
      expect(importResult.success).toBe(true);
      const data = importResult.data as Record<string, unknown>;
      expect(data['entityCount']).toBe(1);

      // Verify entity is present
      const entities = store.getState().getScenario().entities;
      expect(entities).toHaveLength(1);
      expect(entities[0].name).toBe('Ego');
    });
  });

  describe('template workflow', () => {
    it('should list and apply a template', () => {
      call('create_scenario', {}, store);

      // List templates
      const listResult = call('list_templates', {}, store);
      expect(listResult.success).toBe(true);
      const templates = (listResult.data as Record<string, unknown>)['templates'] as Array<Record<string, unknown>>;
      const cutIn = templates.find((t) => t['id'] === 'cutIn');
      expect(cutIn).toBeDefined();

      // Apply template
      const applyResult = call('apply_template', {
        templateId: 'cutIn',
        parameters: { egoSpeed: 30 },
      }, store);
      expect(applyResult.success).toBe(true);

      // Verify entities and storyboard were created
      const doc = store.getState().getScenario();
      expect(doc.entities.length).toBeGreaterThan(0);
      expect(doc.storyboard.stories.length).toBeGreaterThan(0);

      // Validate
      const validateResult = call('validate_scenario', {}, store);
      expect(validateResult.success).toBe(true);
    });
  });
});
