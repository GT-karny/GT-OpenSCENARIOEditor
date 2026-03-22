import { describe, it, expect, beforeEach } from 'vitest';
import type { OpenDriveDocument } from '@osce/shared';
import { AddRoadCommand, RemoveRoadCommand, UpdateRoadCommand } from '../../commands/road-commands.js';
import { CommandHistory } from '../../commands/command-history.js';
import { createDefaultDocument } from '../../store/defaults.js';

describe('Road Commands', () => {
  let doc: OpenDriveDocument;
  let history: CommandHistory;
  const dirtyIds = new Set<string>();

  const getDoc = () => doc;
  const setDoc = (d: OpenDriveDocument) => { doc = d; };
  const markDirty = (id: string) => { dirtyIds.add(id); };

  beforeEach(() => {
    doc = createDefaultDocument();
    history = new CommandHistory();
    dirtyIds.clear();
  });

  describe('AddRoadCommand', () => {
    it('adds a road to the document', () => {
      const cmd = new AddRoadCommand({ name: 'TestRoad' }, getDoc, setDoc, markDirty);
      history.execute(cmd);

      expect(doc.roads).toHaveLength(1);
      expect(doc.roads[0].name).toBe('TestRoad');
      expect(dirtyIds.has(doc.roads[0].id)).toBe(true);
    });

    it('undo removes the added road', () => {
      const cmd = new AddRoadCommand({ name: 'TestRoad' }, getDoc, setDoc, markDirty);
      history.execute(cmd);
      expect(doc.roads).toHaveLength(1);

      history.undo();
      expect(doc.roads).toHaveLength(0);
    });

    it('redo re-adds the road', () => {
      const cmd = new AddRoadCommand({ name: 'TestRoad' }, getDoc, setDoc, markDirty);
      history.execute(cmd);
      const roadId = cmd.getCreatedRoad().id;

      history.undo();
      expect(doc.roads).toHaveLength(0);

      history.redo();
      expect(doc.roads).toHaveLength(1);
      expect(doc.roads[0].id).toBe(roadId);
    });

    it('creates road with default lane section', () => {
      const cmd = new AddRoadCommand({}, getDoc, setDoc, markDirty);
      history.execute(cmd);

      const road = cmd.getCreatedRoad();
      expect(road.lanes).toHaveLength(1);
      expect(road.lanes[0].leftLanes).toHaveLength(1);
      expect(road.lanes[0].rightLanes).toHaveLength(1);
      expect(road.lanes[0].centerLane.id).toBe(0);
    });
  });

  describe('RemoveRoadCommand', () => {
    it('removes a road by ID', () => {
      const addCmd = new AddRoadCommand({ name: 'R1' }, getDoc, setDoc, markDirty);
      history.execute(addCmd);
      const roadId = addCmd.getCreatedRoad().id;

      const removeCmd = new RemoveRoadCommand(roadId, getDoc, setDoc, markDirty);
      history.execute(removeCmd);
      expect(doc.roads).toHaveLength(0);
    });

    it('undo restores the removed road at the same position', () => {
      const add1 = new AddRoadCommand({ name: 'R1' }, getDoc, setDoc, markDirty);
      history.execute(add1);
      const add2 = new AddRoadCommand({ name: 'R2' }, getDoc, setDoc, markDirty);
      history.execute(add2);

      const removeCmd = new RemoveRoadCommand(add1.getCreatedRoad().id, getDoc, setDoc, markDirty);
      history.execute(removeCmd);
      expect(doc.roads).toHaveLength(1);
      expect(doc.roads[0].name).toBe('R2');

      history.undo();
      expect(doc.roads).toHaveLength(2);
      expect(doc.roads[0].name).toBe('R1');
      expect(doc.roads[1].name).toBe('R2');
    });

    it('does nothing for non-existent road ID', () => {
      const removeCmd = new RemoveRoadCommand('non-existent', getDoc, setDoc, markDirty);
      history.execute(removeCmd);
      expect(doc.roads).toHaveLength(0);
    });
  });

  describe('UpdateRoadCommand', () => {
    it('updates road properties', () => {
      const addCmd = new AddRoadCommand({ name: 'R1', length: 100 }, getDoc, setDoc, markDirty);
      history.execute(addCmd);

      const updateCmd = new UpdateRoadCommand(
        addCmd.getCreatedRoad().id,
        { name: 'Updated', length: 250 },
        getDoc,
        setDoc,
        markDirty,
      );
      history.execute(updateCmd);
      expect(doc.roads[0].name).toBe('Updated');
      expect(doc.roads[0].length).toBe(250);
    });

    it('undo restores previous road state', () => {
      const addCmd = new AddRoadCommand({ name: 'R1', length: 100 }, getDoc, setDoc, markDirty);
      history.execute(addCmd);
      const roadId = addCmd.getCreatedRoad().id;

      const updateCmd = new UpdateRoadCommand(
        roadId,
        { name: 'Changed' },
        getDoc,
        setDoc,
        markDirty,
      );
      history.execute(updateCmd);
      expect(doc.roads[0].name).toBe('Changed');

      history.undo();
      expect(doc.roads[0].name).toBe('R1');
    });

    it('does nothing for non-existent road ID', () => {
      const updateCmd = new UpdateRoadCommand(
        'non-existent',
        { name: 'X' },
        getDoc,
        setDoc,
        markDirty,
      );
      history.execute(updateCmd);
      expect(doc.roads).toHaveLength(0);
    });
  });

  describe('CommandHistory integration', () => {
    it('supports mixed operations with full undo/redo', () => {
      const add1 = new AddRoadCommand({ name: 'R1' }, getDoc, setDoc, markDirty);
      history.execute(add1);
      const roadId = add1.getCreatedRoad().id;

      const update1 = new UpdateRoadCommand(roadId, { name: 'R1-v2' }, getDoc, setDoc, markDirty);
      history.execute(update1);

      const add2 = new AddRoadCommand({ name: 'R2' }, getDoc, setDoc, markDirty);
      history.execute(add2);

      expect(doc.roads).toHaveLength(2);
      expect(doc.roads[0].name).toBe('R1-v2');

      // Undo add2
      history.undo();
      expect(doc.roads).toHaveLength(1);

      // Undo update1
      history.undo();
      expect(doc.roads[0].name).toBe('R1');

      // Undo add1
      history.undo();
      expect(doc.roads).toHaveLength(0);

      // Redo all
      history.redo();
      history.redo();
      history.redo();
      expect(doc.roads).toHaveLength(2);
      expect(doc.roads[0].name).toBe('R1-v2');
    });
  });
});
