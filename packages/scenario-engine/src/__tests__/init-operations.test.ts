import { describe, it, expect } from 'vitest';
import {
  AddInitActionCommand,
  RemoveInitActionCommand,
  SetInitPositionCommand,
  SetInitSpeedCommand,
} from '../commands/init-commands.js';

import { createDefaultDocument } from '../store/defaults.js';
import { createMockGetSet } from './helpers.js';
import type { Position, SpeedAction, TeleportAction } from '@osce/shared';

describe('init commands', () => {
  describe('AddInitAction', () => {
    it('adds init action for entity (creates entityActions entry)', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());

      const cmd = new AddInitActionCommand('Ego', {
        type: 'teleportAction',
        position: { type: 'worldPosition', x: 10, y: 20 },
      }, getDoc, setDoc);
      cmd.execute();

      const ea = getLatest().storyboard.init.entityActions;
      expect(ea).toHaveLength(1);
      expect(ea[0].entityRef).toBe('Ego');
      expect(ea[0].privateActions).toHaveLength(1);
      expect(ea[0].privateActions[0].action.type).toBe('teleportAction');
    });

    it('adds init action to existing entityActions entry', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());

      new AddInitActionCommand('Ego', {
        type: 'teleportAction',
        position: { type: 'worldPosition', x: 0, y: 0 },
      }, getDoc, setDoc).execute();

      new AddInitActionCommand('Ego', {
        type: 'speedAction',
        dynamics: { dynamicsShape: 'step', dynamicsDimension: 'time', value: 0 },
        target: { kind: 'absolute', value: 10 },
      }, getDoc, setDoc).execute();

      const ea = getLatest().storyboard.init.entityActions;
      expect(ea).toHaveLength(1);
      expect(ea[0].privateActions).toHaveLength(2);
    });

    it('undo removes init action (and entityActions entry if created)', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());

      const cmd = new AddInitActionCommand('Ego', {
        type: 'teleportAction',
        position: { type: 'worldPosition', x: 0, y: 0 },
      }, getDoc, setDoc);
      cmd.execute();
      expect(getLatest().storyboard.init.entityActions).toHaveLength(1);

      cmd.undo();
      expect(getLatest().storyboard.init.entityActions).toHaveLength(0);
    });
  });

  describe('RemoveInitAction', () => {
    it('removes init action by id', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());

      new AddInitActionCommand('Ego', {
        type: 'teleportAction',
        position: { type: 'worldPosition', x: 0, y: 0 },
      }, getDoc, setDoc).execute();

      const actionId = getLatest().storyboard.init.entityActions[0].privateActions[0].id;
      const removeCmd = new RemoveInitActionCommand(actionId, getDoc, setDoc);
      removeCmd.execute();

      expect(getLatest().storyboard.init.entityActions[0].privateActions).toHaveLength(0);
    });

    it('undo restores removed init action', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());

      new AddInitActionCommand('Ego', {
        type: 'teleportAction',
        position: { type: 'worldPosition', x: 5, y: 10 },
      }, getDoc, setDoc).execute();

      const actionId = getLatest().storyboard.init.entityActions[0].privateActions[0].id;
      const removeCmd = new RemoveInitActionCommand(actionId, getDoc, setDoc);
      removeCmd.execute();
      removeCmd.undo();

      expect(getLatest().storyboard.init.entityActions[0].privateActions).toHaveLength(1);
    });
  });

  describe('SetInitPosition', () => {
    it('sets teleport action for entity', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());
      const position: Position = { type: 'worldPosition', x: 100, y: 200 };

      const cmd = new SetInitPositionCommand('Ego', position, getDoc, setDoc);
      cmd.execute();

      const ea = getLatest().storyboard.init.entityActions;
      expect(ea).toHaveLength(1);
      const teleportActions = ea[0].privateActions.filter((pa) => pa.action.type === 'teleportAction');
      expect(teleportActions).toHaveLength(1);
      expect((teleportActions[0].action as TeleportAction).position).toEqual(position);
    });

    it('replaces existing teleport action', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());

      new SetInitPositionCommand('Ego', { type: 'worldPosition', x: 0, y: 0 }, getDoc, setDoc).execute();
      new SetInitPositionCommand('Ego', { type: 'worldPosition', x: 50, y: 50 }, getDoc, setDoc).execute();

      const ea = getLatest().storyboard.init.entityActions[0];
      const teleportActions = ea.privateActions.filter((pa) => pa.action.type === 'teleportAction');
      expect(teleportActions).toHaveLength(1);
      expect((teleportActions[0].action as TeleportAction).position.type).toBe('worldPosition');
    });

    it('undo restores previous state', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());

      const cmd = new SetInitPositionCommand('Ego', { type: 'worldPosition', x: 100, y: 200 }, getDoc, setDoc);
      cmd.execute();
      cmd.undo();

      expect(getLatest().storyboard.init.entityActions).toHaveLength(0);
    });
  });

  describe('SetInitSpeed', () => {
    it('sets speed action for entity', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());

      const cmd = new SetInitSpeedCommand('Ego', 30, getDoc, setDoc);
      cmd.execute();

      const ea = getLatest().storyboard.init.entityActions;
      expect(ea).toHaveLength(1);
      const speedActions = ea[0].privateActions.filter((pa) => pa.action.type === 'speedAction');
      expect(speedActions).toHaveLength(1);
      const sa = speedActions[0].action as SpeedAction;
      expect(sa.target).toEqual({ kind: 'absolute', value: 30 });
    });

    it('replaces existing speed action', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());

      new SetInitSpeedCommand('Ego', 10, getDoc, setDoc).execute();
      new SetInitSpeedCommand('Ego', 50, getDoc, setDoc).execute();

      const ea = getLatest().storyboard.init.entityActions[0];
      const speedActions = ea.privateActions.filter((pa) => pa.action.type === 'speedAction');
      expect(speedActions).toHaveLength(1);
      expect((speedActions[0].action as SpeedAction).target).toEqual({ kind: 'absolute', value: 50 });
    });

    it('undo restores previous state', () => {
      const { getDoc, setDoc, getLatest } = createMockGetSet(createDefaultDocument());

      const cmd = new SetInitSpeedCommand('Ego', 30, getDoc, setDoc);
      cmd.execute();
      cmd.undo();

      expect(getLatest().storyboard.init.entityActions).toHaveLength(0);
    });
  });
});
