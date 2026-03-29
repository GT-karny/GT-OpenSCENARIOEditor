import { describe, it, expect } from 'vitest';
import { deepReplaceEntityRef, deepRemoveEntityRef } from '../operations/entity-rename-utils.js';

describe('deepReplaceEntityRef', () => {
  it('replaces entityRef in a flat object', () => {
    const obj = { entityRef: 'Ego', name: 'action1' };
    deepReplaceEntityRef(obj, 'Ego', 'Hero');
    expect(obj.entityRef).toBe('Hero');
    expect(obj.name).toBe('action1');
  });

  it('replaces entityRef in nested objects', () => {
    const obj = {
      storyboard: {
        init: {
          entityActions: [{ entityRef: 'Ego', privateActions: [] }],
        },
      },
    };
    deepReplaceEntityRef(obj, 'Ego', 'Hero');
    expect(obj.storyboard.init.entityActions[0].entityRef).toBe('Hero');
  });

  it('replaces elements in entityRefs arrays', () => {
    const obj = {
      actors: { entityRefs: ['Ego', 'Target', 'Ego'], selectTriggeringEntities: false },
    };
    deepReplaceEntityRef(obj, 'Ego', 'Hero');
    expect(obj.actors.entityRefs).toEqual(['Hero', 'Target', 'Hero']);
  });

  it('replaces masterEntityRef and trailerRef', () => {
    const obj = { masterEntityRef: 'Ego', trailerRef: 'Ego', id: 'abc' };
    deepReplaceEntityRef(obj, 'Ego', 'Hero');
    expect(obj.masterEntityRef).toBe('Hero');
    expect(obj.trailerRef).toBe('Hero');
  });

  it('skips id fields', () => {
    const obj = { id: 'Ego', entityRef: 'Ego' };
    deepReplaceEntityRef(obj, 'Ego', 'Hero');
    expect(obj.id).toBe('Ego');
    expect(obj.entityRef).toBe('Hero');
  });

  it('does not replace non-matching names', () => {
    const obj = { entityRef: 'Target', entityRefs: ['Target', 'NPC'] };
    deepReplaceEntityRef(obj, 'Ego', 'Hero');
    expect(obj.entityRef).toBe('Target');
    expect(obj.entityRefs).toEqual(['Target', 'NPC']);
  });

  it('handles deeply nested storyboard-like structure', () => {
    const obj = {
      stories: [
        {
          acts: [
            {
              maneuverGroups: [
                {
                  actors: { entityRefs: ['Ego'], selectTriggeringEntities: false },
                  maneuvers: [
                    {
                      events: [
                        {
                          startTrigger: {
                            conditionGroups: [
                              {
                                conditions: [
                                  {
                                    triggeringEntities: { entityRefs: ['Ego'] },
                                    byValue: { entityRef: 'Ego' },
                                  },
                                ],
                              },
                            ],
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    deepReplaceEntityRef(obj, 'Ego', 'Hero');
    expect(obj.stories[0].acts[0].maneuverGroups[0].actors.entityRefs).toEqual(['Hero']);
    expect(
      obj.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0].startTrigger
        .conditionGroups[0].conditions[0].triggeringEntities.entityRefs,
    ).toEqual(['Hero']);
    expect(
      obj.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0].startTrigger
        .conditionGroups[0].conditions[0].byValue.entityRef,
    ).toBe('Hero');
  });
});

describe('deepRemoveEntityRef', () => {
  it('removes matching elements from entityRefs arrays', () => {
    const obj = { actors: { entityRefs: ['Ego', 'Target', 'Ego'] } };
    deepRemoveEntityRef(obj, 'Ego');
    expect(obj.actors.entityRefs).toEqual(['Target']);
  });

  it('sets matching single entityRef to empty string', () => {
    const obj = { entityRef: 'Ego', name: 'test' };
    deepRemoveEntityRef(obj, 'Ego');
    expect(obj.entityRef).toBe('');
  });

  it('does not affect non-matching refs', () => {
    const obj = { entityRef: 'Target', entityRefs: ['Target'] };
    deepRemoveEntityRef(obj, 'Ego');
    expect(obj.entityRef).toBe('Target');
    expect(obj.entityRefs).toEqual(['Target']);
  });
});
