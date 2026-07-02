import { describe, it, expect } from 'vitest';
import { detectElementType } from '../../components/property/ElementTypeDetector';

describe('detectElementType (web ElementTypeDetector)', () => {
  it('returns unknown for non-objects', () => {
    expect(detectElementType(null)).toEqual({ kind: 'unknown', element: null });
    expect(detectElementType(undefined)).toEqual({ kind: 'unknown', element: undefined });
    expect(detectElementType(42)).toEqual({ kind: 'unknown', element: 42 });
  });

  it('detects entityInit via the web-only registry extension', () => {
    const entityInit = {
      id: 'ei1',
      entityRef: 'Ego',
      privateActions: [],
    };
    expect(detectElementType(entityInit)).toEqual({ kind: 'entityInit', element: entityInit });
  });

  it('does not misdetect entityInit when privateActions is not an array', () => {
    const notEntityInit = { entityRef: 'Ego', privateActions: 'nope' };
    expect(detectElementType(notEntityInit)).toEqual({ kind: 'unknown', element: notEntityInit });
  });

  it('delegates to the canonical registry for entity', () => {
    const entity = { name: 'Ego', type: 'vehicle', definition: {} };
    expect(detectElementType(entity)).toEqual({ kind: 'entity', element: entity });
  });

  it('delegates to the canonical registry for event', () => {
    const event = {
      id: 'e1',
      name: 'Event',
      priority: 'overwrite',
      actions: [],
      startTrigger: { conditionGroups: [] },
    };
    expect(detectElementType(event)).toEqual({ kind: 'event', element: event });
  });

  it('delegates to the canonical registry for action', () => {
    const action = { id: 'a1', name: 'Action', action: { type: 'speedAction' } };
    expect(detectElementType(action)).toEqual({ kind: 'action', element: action });
  });

  it('delegates to the canonical registry for story', () => {
    const story = { name: 'S', acts: [] };
    expect(detectElementType(story)).toEqual({ kind: 'story', element: story });
  });

  it('delegates to the canonical registry for act (act before story precedence)', () => {
    const act = { name: 'A', maneuverGroups: [], startTrigger: { conditionGroups: [] } };
    expect(detectElementType(act)).toEqual({ kind: 'act', element: act });
  });

  it('delegates to the canonical registry for maneuverGroup', () => {
    const group = { name: 'MG', maneuvers: [], actors: { entityRefs: [] } };
    expect(detectElementType(group)).toEqual({ kind: 'maneuverGroup', element: group });
  });

  it('delegates to the canonical registry for trigger', () => {
    const trigger = { conditionGroups: [] };
    expect(detectElementType(trigger)).toEqual({ kind: 'trigger', element: trigger });
  });

  it('collapses storyboard | init | maneuver | condition | null into unknown', () => {
    const storyboard = { init: { globalActions: [], entityActions: [] }, stories: [] };
    expect(detectElementType(storyboard)).toEqual({ kind: 'unknown', element: storyboard });

    const init = { globalActions: [], entityActions: [] };
    expect(detectElementType(init)).toEqual({ kind: 'unknown', element: init });

    const maneuver = { name: 'M', events: [] };
    expect(detectElementType(maneuver)).toEqual({ kind: 'unknown', element: maneuver });

    const condition = { id: 'c1', conditionEdge: 'rising', delay: 0 };
    expect(detectElementType(condition)).toEqual({ kind: 'unknown', element: condition });

    const unrecognized = { foo: 'bar' };
    expect(detectElementType(unrecognized)).toEqual({ kind: 'unknown', element: unrecognized });
  });
});
