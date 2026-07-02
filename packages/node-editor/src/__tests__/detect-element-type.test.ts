import { describe, it, expect } from 'vitest';
import {
  detectElementType,
  createElementTypeDetector,
  ELEMENT_TYPE_MATCHERS,
  PARENT_FIELD_TO_TYPE,
} from '../utils/detect-element-type.js';
import type { ElementTypeMatcher } from '../utils/detect-element-type.js';
import type { OsceNodeType } from '../types/node-types.js';

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

describe('ELEMENT_TYPE_MATCHERS registry', () => {
  it('checks storyboard before init and trigger (specific before generic)', () => {
    const storyboardIndex = ELEMENT_TYPE_MATCHERS.findIndex((m) => m.type === 'storyboard');
    const initIndex = ELEMENT_TYPE_MATCHERS.findIndex((m) => m.type === 'init');
    const triggerIndex = ELEMENT_TYPE_MATCHERS.findIndex((m) => m.type === 'trigger');
    expect(storyboardIndex).toBeGreaterThanOrEqual(0);
    expect(storyboardIndex).toBeLessThan(initIndex);
    expect(storyboardIndex).toBeLessThan(triggerIndex);
  });

  it('checks act before story (specific before generic)', () => {
    const actIndex = ELEMENT_TYPE_MATCHERS.findIndex((m) => m.type === 'act');
    const storyIndex = ELEMENT_TYPE_MATCHERS.findIndex((m) => m.type === 'story');
    expect(actIndex).toBeGreaterThanOrEqual(0);
    expect(actIndex).toBeLessThan(storyIndex);
  });

  it('checks event before action (both can share a "name" field)', () => {
    const eventIndex = ELEMENT_TYPE_MATCHERS.findIndex((m) => m.type === 'event');
    const actionIndex = ELEMENT_TYPE_MATCHERS.findIndex((m) => m.type === 'action');
    expect(eventIndex).toBeLessThan(actionIndex);
  });

  it('contains exactly one matcher per OsceNodeType with no duplicates', () => {
    const types = ELEMENT_TYPE_MATCHERS.map((m) => m.type);
    expect(new Set(types).size).toBe(types.length);
  });
});

describe('createElementTypeDetector', () => {
  it('resolves precedence in registration order: earlier entries win', () => {
    type FooBar = 'foo' | 'bar';
    const matchers: ElementTypeMatcher<FooBar>[] = [
      { type: 'foo', matches: (obj) => 'shared' in obj },
      { type: 'bar', matches: (obj) => 'shared' in obj },
    ];
    const detect = createElementTypeDetector(matchers);
    expect(detect({ shared: true })).toBe('foo');
  });

  it('supports extension entries prepended ahead of the canonical registry', () => {
    type Extended = OsceNodeType | 'custom';
    const customMatcher: ElementTypeMatcher<Extended> = {
      type: 'custom',
      matches: (obj) => 'customField' in obj,
    };
    const detect = createElementTypeDetector<Extended>([
      customMatcher,
      ...ELEMENT_TYPE_MATCHERS,
    ]);
    expect(detect({ customField: true })).toBe('custom');
    // Canonical detection still works through the extended detector.
    expect(detect({ name: 'S', acts: [] })).toBe('story');
  });

  it('returns null for non-objects regardless of matcher list', () => {
    const detect = createElementTypeDetector(ELEMENT_TYPE_MATCHERS);
    expect(detect(null)).toBeNull();
    expect(detect(42)).toBeNull();
  });
});

describe('PARENT_FIELD_TO_TYPE', () => {
  it('maps known parent field names to their element type', () => {
    expect(PARENT_FIELD_TO_TYPE.maneuverGroups).toBe('maneuverGroup');
    expect(PARENT_FIELD_TO_TYPE.maneuvers).toBe('maneuver');
    expect(PARENT_FIELD_TO_TYPE.events).toBe('event');
    expect(PARENT_FIELD_TO_TYPE.actions).toBe('action');
    expect(PARENT_FIELD_TO_TYPE.entities).toBe('entity');
  });

  it('returns undefined for unknown parent field names', () => {
    expect(PARENT_FIELD_TO_TYPE.notAField).toBeUndefined();
    expect(PARENT_FIELD_TO_TYPE.stories).toBeUndefined();
  });
});
