import { describe, it, expect } from 'vitest';
import {
  SetStartTriggerCommand,
  SetStopTriggerCommand,
  AddConditionGroupCommand,
  RemoveConditionGroupCommand,
  AddConditionCommand,
  RemoveConditionCommand,
} from '../commands/trigger-commands.js';
import { AddStoryCommand } from '../commands/story-commands.js';
import { AddActCommand } from '../commands/act-commands.js';
import { createDefaultDocument, createDefaultTrigger, createDefaultConditionGroup, createConditionFromPartial } from '../store/defaults.js';
import { createMockGetSet } from './helpers.js';

describe('trigger commands', () => {
  function setupWithAct() {
    const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());
    const storyCmd = new AddStoryCommand({ name: 'S' }, getDoc, setDoc);
    storyCmd.execute();
    const actCmd = new AddActCommand(storyCmd.getCreatedStory().id, { name: 'A' }, getDoc, setDoc);
    actCmd.execute();
    return { getDoc, setDoc, getLatest, actId: actCmd.getCreatedAct().id };
  }

  describe('SetStartTrigger', () => {
    it('sets start trigger on an act', () => {
      const { getDoc, setDoc, getLatest, actId: aid } = setupWithAct();
      const newTrigger = createDefaultTrigger();
      const group = createDefaultConditionGroup();
      group.conditions.push(createConditionFromPartial({ name: 'SimTime' }));
      newTrigger.conditionGroups.push(group);

      const cmd = new SetStartTriggerCommand(aid, newTrigger, getDoc, setDoc);
      cmd.execute();

      const act = getLatest().storyboard.stories[0].acts[0];
      expect(act.startTrigger.id).toBe(newTrigger.id);
      expect(act.startTrigger.conditionGroups).toHaveLength(1);
    });

    it('undo restores previous trigger', () => {
      const { getDoc, setDoc, getLatest, actId: aid } = setupWithAct();
      const originalTriggerId = getLatest().storyboard.stories[0].acts[0].startTrigger.id;

      const newTrigger = createDefaultTrigger();
      const cmd = new SetStartTriggerCommand(aid, newTrigger, getDoc, setDoc);
      cmd.execute();
      expect(getLatest().storyboard.stories[0].acts[0].startTrigger.id).toBe(newTrigger.id);

      cmd.undo();
      expect(getLatest().storyboard.stories[0].acts[0].startTrigger.id).toBe(originalTriggerId);
    });
  });

  describe('SetStopTrigger', () => {
    it('sets stop trigger on storyboard', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());
      const storyboardId = getLatest().storyboard.id;
      const newTrigger = createDefaultTrigger();

      const cmd = new SetStopTriggerCommand(storyboardId, newTrigger, getDoc, setDoc);
      cmd.execute();

      expect(getLatest().storyboard.stopTrigger.id).toBe(newTrigger.id);
    });

    it('undo restores previous stop trigger', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());
      const storyboardId = getLatest().storyboard.id;
      const originalId = getLatest().storyboard.stopTrigger.id;
      const newTrigger = createDefaultTrigger();

      const cmd = new SetStopTriggerCommand(storyboardId, newTrigger, getDoc, setDoc);
      cmd.execute();
      cmd.undo();

      expect(getLatest().storyboard.stopTrigger.id).toBe(originalId);
    });
  });

  describe('AddConditionGroup', () => {
    it('adds condition group to trigger', () => {
      const { getDoc, setDoc, getLatest } = setupWithAct();
      const triggerId = getLatest().storyboard.stories[0].acts[0].startTrigger.id;

      const cmd = new AddConditionGroupCommand(triggerId, getDoc, setDoc);
      cmd.execute();

      expect(getLatest().storyboard.stories[0].acts[0].startTrigger.conditionGroups).toHaveLength(1);
    });

    it('undo removes condition group', () => {
      const { getDoc, setDoc, getLatest } = setupWithAct();
      const triggerId = getLatest().storyboard.stories[0].acts[0].startTrigger.id;

      const cmd = new AddConditionGroupCommand(triggerId, getDoc, setDoc);
      cmd.execute();
      cmd.undo();

      expect(getLatest().storyboard.stories[0].acts[0].startTrigger.conditionGroups).toHaveLength(0);
    });
  });

  describe('RemoveConditionGroup', () => {
    it('removes and restores condition group', () => {
      const { getDoc, setDoc, getLatest } = setupWithAct();
      const triggerId = getLatest().storyboard.stories[0].acts[0].startTrigger.id;

      const addCmd = new AddConditionGroupCommand(triggerId, getDoc, setDoc);
      addCmd.execute();
      const groupId = addCmd.getCreatedGroup().id;

      const removeCmd = new RemoveConditionGroupCommand(groupId, getDoc, setDoc);
      removeCmd.execute();
      expect(getLatest().storyboard.stories[0].acts[0].startTrigger.conditionGroups).toHaveLength(0);

      removeCmd.undo();
      expect(getLatest().storyboard.stories[0].acts[0].startTrigger.conditionGroups).toHaveLength(1);
    });
  });

  describe('AddCondition', () => {
    it('adds condition to group', () => {
      const { getDoc, setDoc, getLatest } = setupWithAct();
      const triggerId = getLatest().storyboard.stories[0].acts[0].startTrigger.id;

      const groupCmd = new AddConditionGroupCommand(triggerId, getDoc, setDoc);
      groupCmd.execute();
      const groupId = groupCmd.getCreatedGroup().id;

      const condCmd = new AddConditionCommand(groupId, { name: 'TimeCond' }, getDoc, setDoc);
      condCmd.execute();

      expect(getLatest().storyboard.stories[0].acts[0].startTrigger.conditionGroups[0].conditions).toHaveLength(1);
      expect(getLatest().storyboard.stories[0].acts[0].startTrigger.conditionGroups[0].conditions[0].name).toBe('TimeCond');
    });

    it('undo removes condition', () => {
      const { getDoc, setDoc, getLatest } = setupWithAct();
      const triggerId = getLatest().storyboard.stories[0].acts[0].startTrigger.id;

      const groupCmd = new AddConditionGroupCommand(triggerId, getDoc, setDoc);
      groupCmd.execute();

      const condCmd = new AddConditionCommand(groupCmd.getCreatedGroup().id, {}, getDoc, setDoc);
      condCmd.execute();
      condCmd.undo();

      expect(getLatest().storyboard.stories[0].acts[0].startTrigger.conditionGroups[0].conditions).toHaveLength(0);
    });
  });

  describe('RemoveCondition', () => {
    it('removes and restores condition', () => {
      const { getDoc, setDoc, getLatest } = setupWithAct();
      const triggerId = getLatest().storyboard.stories[0].acts[0].startTrigger.id;

      const groupCmd = new AddConditionGroupCommand(triggerId, getDoc, setDoc);
      groupCmd.execute();
      const condCmd = new AddConditionCommand(groupCmd.getCreatedGroup().id, { name: 'C1' }, getDoc, setDoc);
      condCmd.execute();
      const condId = condCmd.getCreatedCondition().id;

      const removeCmd = new RemoveConditionCommand(condId, getDoc, setDoc);
      removeCmd.execute();
      expect(getLatest().storyboard.stories[0].acts[0].startTrigger.conditionGroups[0].conditions).toHaveLength(0);

      removeCmd.undo();
      expect(getLatest().storyboard.stories[0].acts[0].startTrigger.conditionGroups[0].conditions).toHaveLength(1);
      expect(getLatest().storyboard.stories[0].acts[0].startTrigger.conditionGroups[0].conditions[0].name).toBe('C1');
    });
  });
});
