import { describe, it, expect } from 'vitest';
import { AddStoryCommand, RemoveStoryCommand } from '../commands/story-commands.js';
import { AddActCommand, RemoveActCommand } from '../commands/act-commands.js';
import { AddManeuverGroupCommand, RemoveManeuverGroupCommand } from '../commands/maneuver-group-commands.js';
import { AddManeuverCommand, RemoveManeuverCommand } from '../commands/maneuver-commands.js';
import { AddEventCommand, RemoveEventCommand } from '../commands/event-commands.js';
import { AddActionCommand, RemoveActionCommand } from '../commands/action-commands.js';
import { createDefaultDocument } from '../store/defaults.js';
import { createMockGetSet } from './helpers.js';

describe('storyboard commands', () => {
  describe('Story', () => {
    it('AddStoryCommand adds story', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());
      const cmd = new AddStoryCommand({ name: 'Story1' }, getDoc, setDoc);
      cmd.execute();
      expect(getLatest().storyboard.stories).toHaveLength(1);
      expect(getLatest().storyboard.stories[0].name).toBe('Story1');
    });

    it('AddStoryCommand undo removes story', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());
      const cmd = new AddStoryCommand({ name: 'Story1' }, getDoc, setDoc);
      cmd.execute();
      cmd.undo();
      expect(getLatest().storyboard.stories).toHaveLength(0);
    });

    it('RemoveStoryCommand removes and restores story', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());
      const addCmd = new AddStoryCommand({ name: 'Story1' }, getDoc, setDoc);
      addCmd.execute();
      const storyId = getLatest().storyboard.stories[0].id;

      const removeCmd = new RemoveStoryCommand(storyId, getDoc, setDoc);
      removeCmd.execute();
      expect(getLatest().storyboard.stories).toHaveLength(0);

      removeCmd.undo();
      expect(getLatest().storyboard.stories).toHaveLength(1);
      expect(getLatest().storyboard.stories[0].name).toBe('Story1');
    });
  });

  describe('Act', () => {
    it('AddActCommand adds act to story', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());
      const storyCmd = new AddStoryCommand({ name: 'Story1' }, getDoc, setDoc);
      storyCmd.execute();
      const storyId = storyCmd.getCreatedStory().id;

      const actCmd = new AddActCommand(storyId, { name: 'Act1' }, getDoc, setDoc);
      actCmd.execute();
      expect(getLatest().storyboard.stories[0].acts).toHaveLength(1);
      expect(getLatest().storyboard.stories[0].acts[0].name).toBe('Act1');
    });

    it('RemoveActCommand removes and restores act', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());
      const storyCmd = new AddStoryCommand({ name: 'Story1' }, getDoc, setDoc);
      storyCmd.execute();
      const storyId = storyCmd.getCreatedStory().id;

      const actCmd = new AddActCommand(storyId, { name: 'Act1' }, getDoc, setDoc);
      actCmd.execute();
      const actId = actCmd.getCreatedAct().id;

      const removeCmd = new RemoveActCommand(actId, getDoc, setDoc);
      removeCmd.execute();
      expect(getLatest().storyboard.stories[0].acts).toHaveLength(0);

      removeCmd.undo();
      expect(getLatest().storyboard.stories[0].acts).toHaveLength(1);
    });
  });

  describe('ManeuverGroup', () => {
    it('adds and removes maneuver group', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());
      const storyCmd = new AddStoryCommand({ name: 'S' }, getDoc, setDoc);
      storyCmd.execute();
      const actCmd = new AddActCommand(storyCmd.getCreatedStory().id, { name: 'A' }, getDoc, setDoc);
      actCmd.execute();
      const actId = actCmd.getCreatedAct().id;

      const groupCmd = new AddManeuverGroupCommand(actId, { name: 'MG' }, getDoc, setDoc);
      groupCmd.execute();
      expect(getLatest().storyboard.stories[0].acts[0].maneuverGroups).toHaveLength(1);

      const removeCmd = new RemoveManeuverGroupCommand(groupCmd.getCreatedGroup().id, getDoc, setDoc);
      removeCmd.execute();
      expect(getLatest().storyboard.stories[0].acts[0].maneuverGroups).toHaveLength(0);

      removeCmd.undo();
      expect(getLatest().storyboard.stories[0].acts[0].maneuverGroups).toHaveLength(1);
    });
  });

  describe('Maneuver', () => {
    it('adds and removes maneuver', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());
      const storyCmd = new AddStoryCommand({ name: 'S' }, getDoc, setDoc);
      storyCmd.execute();
      const actCmd = new AddActCommand(storyCmd.getCreatedStory().id, {}, getDoc, setDoc);
      actCmd.execute();
      const groupCmd = new AddManeuverGroupCommand(actCmd.getCreatedAct().id, {}, getDoc, setDoc);
      groupCmd.execute();
      const groupId = groupCmd.getCreatedGroup().id;

      const maneuverCmd = new AddManeuverCommand(groupId, { name: 'M1' }, getDoc, setDoc);
      maneuverCmd.execute();
      expect(getLatest().storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers).toHaveLength(1);

      const removeCmd = new RemoveManeuverCommand(maneuverCmd.getCreatedManeuver().id, getDoc, setDoc);
      removeCmd.execute();
      expect(getLatest().storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers).toHaveLength(0);

      removeCmd.undo();
      expect(getLatest().storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers).toHaveLength(1);
    });
  });

  describe('Event', () => {
    it('adds and removes event', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());
      const storyCmd = new AddStoryCommand({ name: 'S' }, getDoc, setDoc);
      storyCmd.execute();
      const actCmd = new AddActCommand(storyCmd.getCreatedStory().id, {}, getDoc, setDoc);
      actCmd.execute();
      const groupCmd = new AddManeuverGroupCommand(actCmd.getCreatedAct().id, {}, getDoc, setDoc);
      groupCmd.execute();
      const maneuverCmd = new AddManeuverCommand(groupCmd.getCreatedGroup().id, {}, getDoc, setDoc);
      maneuverCmd.execute();
      const maneuverId = maneuverCmd.getCreatedManeuver().id;

      const eventCmd = new AddEventCommand(maneuverId, { name: 'E1' }, getDoc, setDoc);
      eventCmd.execute();
      const events = getLatest().storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events;
      expect(events).toHaveLength(1);

      const removeCmd = new RemoveEventCommand(eventCmd.getCreatedEvent().id, getDoc, setDoc);
      removeCmd.execute();
      expect(getLatest().storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events).toHaveLength(0);

      removeCmd.undo();
      expect(getLatest().storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events).toHaveLength(1);
    });
  });

  describe('Action', () => {
    it('adds and removes action', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());
      const storyCmd = new AddStoryCommand({ name: 'S' }, getDoc, setDoc);
      storyCmd.execute();
      const actCmd = new AddActCommand(storyCmd.getCreatedStory().id, {}, getDoc, setDoc);
      actCmd.execute();
      const groupCmd = new AddManeuverGroupCommand(actCmd.getCreatedAct().id, {}, getDoc, setDoc);
      groupCmd.execute();
      const maneuverCmd = new AddManeuverCommand(groupCmd.getCreatedGroup().id, {}, getDoc, setDoc);
      maneuverCmd.execute();
      const eventCmd = new AddEventCommand(maneuverCmd.getCreatedManeuver().id, {}, getDoc, setDoc);
      eventCmd.execute();
      const eventId = eventCmd.getCreatedEvent().id;

      const actionCmd = new AddActionCommand(eventId, { name: 'A1' }, getDoc, setDoc);
      actionCmd.execute();
      const actions = getLatest().storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0].actions;
      expect(actions).toHaveLength(1);

      const removeCmd = new RemoveActionCommand(actionCmd.getCreatedAction().id, getDoc, setDoc);
      removeCmd.execute();
      expect(getLatest().storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0].actions).toHaveLength(0);

      removeCmd.undo();
      expect(getLatest().storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0].actions).toHaveLength(1);
    });
  });

  describe('deep hierarchy undo/redo', () => {
    it('full hierarchy add and undo chain works', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());

      const storyCmd = new AddStoryCommand({ name: 'S' }, getDoc, setDoc);
      storyCmd.execute();
      const actCmd = new AddActCommand(storyCmd.getCreatedStory().id, { name: 'A' }, getDoc, setDoc);
      actCmd.execute();
      const groupCmd = new AddManeuverGroupCommand(actCmd.getCreatedAct().id, { name: 'MG' }, getDoc, setDoc);
      groupCmd.execute();
      const maneuverCmd = new AddManeuverCommand(groupCmd.getCreatedGroup().id, { name: 'M' }, getDoc, setDoc);
      maneuverCmd.execute();
      const eventCmd = new AddEventCommand(maneuverCmd.getCreatedManeuver().id, { name: 'E' }, getDoc, setDoc);
      eventCmd.execute();
      const actionCmd = new AddActionCommand(eventCmd.getCreatedEvent().id, { name: 'Act' }, getDoc, setDoc);
      actionCmd.execute();

      // Verify full tree
      const events = getLatest().storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events;
      expect(events[0].actions).toHaveLength(1);

      // Undo action
      actionCmd.undo();
      expect(getLatest().storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0].actions).toHaveLength(0);

      // Undo event
      eventCmd.undo();
      expect(getLatest().storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events).toHaveLength(0);

      // Undo all the way back
      maneuverCmd.undo();
      groupCmd.undo();
      actCmd.undo();
      storyCmd.undo();
      expect(getLatest().storyboard.stories).toHaveLength(0);
    });
  });
});
