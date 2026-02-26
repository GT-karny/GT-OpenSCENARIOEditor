import { describe, it, expect } from 'vitest';
import {
  createDefaultDocument,
  createDefaultStoryboard,
  createDefaultTrigger,
  createDefaultConditionGroup,
  createEntityFromPartial,
  createStoryFromPartial,
  createActFromPartial,
  createManeuverGroupFromPartial,
  createManeuverFromPartial,
  createEventFromPartial,
  createActionFromPartial,
  createConditionFromPartial,
  createEntityInitActions,
  createInitPrivateAction,
} from '../store/defaults.js';

describe('defaults', () => {
  it('createDefaultDocument produces a valid document', () => {
    const doc = createDefaultDocument();
    expect(doc.id).toBeDefined();
    expect(typeof doc.id).toBe('string');
    expect(doc.fileHeader.revMajor).toBe(1);
    expect(doc.fileHeader.revMinor).toBe(2);
    expect(doc.entities).toEqual([]);
    expect(doc.storyboard).toBeDefined();
    expect(doc.storyboard.stories).toEqual([]);
    expect(doc.storyboard.init).toBeDefined();
    expect(doc.storyboard.stopTrigger).toBeDefined();
    expect(doc._editor).toBeDefined();
  });

  it('createDefaultStoryboard produces valid storyboard', () => {
    const sb = createDefaultStoryboard();
    expect(sb.id).toBeDefined();
    expect(sb.init).toBeDefined();
    expect(sb.stories).toEqual([]);
    expect(sb.stopTrigger).toBeDefined();
  });

  it('createDefaultTrigger produces valid trigger', () => {
    const trigger = createDefaultTrigger();
    expect(trigger.id).toBeDefined();
    expect(trigger.conditionGroups).toEqual([]);
  });

  it('createDefaultConditionGroup produces valid group', () => {
    const group = createDefaultConditionGroup();
    expect(group.id).toBeDefined();
    expect(group.conditions).toEqual([]);
  });

  it('createEntityFromPartial merges defaults', () => {
    const entity = createEntityFromPartial({ name: 'Ego' });
    expect(entity.id).toBeDefined();
    expect(entity.name).toBe('Ego');
    expect(entity.type).toBe('vehicle');
    expect(entity.definition).toBeDefined();
  });

  it('createEntityFromPartial uses provided id', () => {
    const entity = createEntityFromPartial({ id: 'custom-id', name: 'Test' });
    expect(entity.id).toBe('custom-id');
  });

  it('createStoryFromPartial merges defaults', () => {
    const story = createStoryFromPartial({ name: 'MyStory' });
    expect(story.id).toBeDefined();
    expect(story.name).toBe('MyStory');
    expect(story.acts).toEqual([]);
  });

  it('createActFromPartial merges defaults with trigger', () => {
    const act = createActFromPartial({ name: 'MyAct' });
    expect(act.id).toBeDefined();
    expect(act.name).toBe('MyAct');
    expect(act.startTrigger).toBeDefined();
    expect(act.maneuverGroups).toEqual([]);
  });

  it('createManeuverGroupFromPartial merges defaults', () => {
    const group = createManeuverGroupFromPartial({});
    expect(group.id).toBeDefined();
    expect(group.maximumExecutionCount).toBe(1);
    expect(group.actors.entityRefs).toEqual([]);
  });

  it('createManeuverFromPartial merges defaults', () => {
    const maneuver = createManeuverFromPartial({});
    expect(maneuver.id).toBeDefined();
    expect(maneuver.events).toEqual([]);
  });

  it('createEventFromPartial merges defaults', () => {
    const event = createEventFromPartial({ name: 'MyEvent' });
    expect(event.id).toBeDefined();
    expect(event.name).toBe('MyEvent');
    expect(event.priority).toBe('override');
    expect(event.startTrigger).toBeDefined();
  });

  it('createActionFromPartial merges defaults', () => {
    const action = createActionFromPartial({});
    expect(action.id).toBeDefined();
    expect(action.action).toBeDefined();
  });

  it('createConditionFromPartial merges defaults', () => {
    const condition = createConditionFromPartial({});
    expect(condition.id).toBeDefined();
    expect(condition.conditionEdge).toBe('rising');
  });

  it('createEntityInitActions creates valid init actions', () => {
    const ea = createEntityInitActions('Ego');
    expect(ea.id).toBeDefined();
    expect(ea.entityRef).toBe('Ego');
    expect(ea.privateActions).toEqual([]);
  });

  it('createInitPrivateAction wraps action', () => {
    const pa = createInitPrivateAction({
      type: 'teleportAction',
      position: { type: 'worldPosition', x: 0, y: 0 },
    });
    expect(pa.id).toBeDefined();
    expect(pa.action.type).toBe('teleportAction');
  });

  it('each factory produces unique ids', () => {
    const ids = new Set([
      createDefaultDocument().id,
      createDefaultDocument().id,
      createDefaultTrigger().id,
      createDefaultTrigger().id,
    ]);
    expect(ids.size).toBe(4);
  });
});
