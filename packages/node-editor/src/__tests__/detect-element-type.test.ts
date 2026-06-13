import { describe, it, expect } from 'vitest';
import { detectElementType } from '../utils/detect-element-type.js';

describe('detectElementType', () => {
  it('should return null for non-objects', () => {
    expect(detectElementType(null)).toBeNull();
    expect(detectElementType(undefined)).toBeNull();
    expect(detectElementType(42)).toBeNull();
    expect(detectElementType('event')).toBeNull();
  });

  it('should detect an event (actions + startTrigger + priority)', () => {
    const event = {
      id: 'e1',
      name: 'Event',
      priority: 'overwrite',
      actions: [],
      startTrigger: { conditionGroups: [] },
    };
    expect(detectElementType(event)).toBe('event');
  });

  it('should detect an action (action wrapper + name)', () => {
    const action = {
      id: 'a1',
      name: 'Action',
      action: { type: 'speedAction' },
    };
    expect(detectElementType(action)).toBe('action');
  });

  it('should not detect an action when the inner action lacks a type', () => {
    const notAction = { id: 'x', name: 'X', action: {} };
    expect(detectElementType(notAction)).toBeNull();
  });

  it('should detect a condition (conditionEdge + delay)', () => {
    const condition = { id: 'c1', conditionEdge: 'rising', delay: 0 };
    expect(detectElementType(condition)).toBe('condition');
  });

  it('should detect a trigger (conditionGroups, no init)', () => {
    const trigger = { conditionGroups: [] };
    expect(detectElementType(trigger)).toBe('trigger');
  });

  it('should detect a storyboard before init/trigger', () => {
    const storyboard = {
      init: { globalActions: [], entityActions: [] },
      stories: [],
      stopTrigger: { conditionGroups: [] },
    };
    expect(detectElementType(storyboard)).toBe('storyboard');
  });

  it('should detect init (globalActions + entityActions)', () => {
    const init = { globalActions: [], entityActions: [] };
    expect(detectElementType(init)).toBe('init');
  });

  it('should detect a story (acts)', () => {
    const story = { name: 'S', acts: [] };
    expect(detectElementType(story)).toBe('story');
  });

  it('should detect an act (maneuverGroups) over a story', () => {
    const act = { name: 'A', maneuverGroups: [], startTrigger: { conditionGroups: [] } };
    expect(detectElementType(act)).toBe('act');
  });

  it('should detect a maneuverGroup (maneuvers + actors)', () => {
    const group = { name: 'MG', maneuvers: [], actors: { entityRefs: [] } };
    expect(detectElementType(group)).toBe('maneuverGroup');
  });

  it('should detect a maneuver (events)', () => {
    const maneuver = { name: 'M', events: [] };
    expect(detectElementType(maneuver)).toBe('maneuver');
  });

  it('should detect an entity (definition + recognized type)', () => {
    expect(detectElementType({ name: 'Ego', type: 'vehicle', definition: {} })).toBe('entity');
    expect(detectElementType({ name: 'Ped', type: 'pedestrian', definition: {} })).toBe('entity');
    expect(detectElementType({ name: 'Obj', type: 'miscObject', definition: {} })).toBe('entity');
  });

  it('should not detect an entity for an unrecognized type', () => {
    expect(detectElementType({ name: 'X', type: 'spaceship', definition: {} })).toBeNull();
  });

  it('should return null for an unrecognized shape', () => {
    expect(detectElementType({ foo: 'bar' })).toBeNull();
  });
});
