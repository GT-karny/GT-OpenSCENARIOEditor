import { describe, it, expect, beforeEach } from 'vitest';
import type { OpenDriveDocument } from '@osce/shared';
import { CommandHistory, CompoundCommand } from '@osce/scenario-engine';
import type { PatchCommand } from '../../commands/patch-command.js';
import { AddRoadCommand, RemoveRoadCommand, UpdateRoadCommand } from '../../commands/road-commands.js';
import { SplitRoadCommand, JoinRoadsCommand } from '../../commands/road-link-commands.js';
import { createDefaultDocument } from '../../store/defaults.js';
import { createTestDocument, createTestRoad, createMockGetSet } from '../helpers.js';

/**
 * Focused coverage for the PatchCommand base introduced when the per-command
 * structuredClone/hand-restore undo was replaced by immer produceWithPatches.
 */
describe('PatchCommand base', () => {
  let doc: OpenDriveDocument;
  let history: CommandHistory;
  const dirtyIds: string[] = [];

  const getDoc = () => doc;
  const setDoc = (d: OpenDriveDocument) => {
    doc = d;
  };
  const markDirty = (id: string) => {
    dirtyIds.push(id);
  };

  beforeEach(() => {
    doc = createDefaultDocument();
    history = new CommandHistory();
    dirtyIds.length = 0;
  });

  describe('single-command undo restores byte-identical pre-mutation document', () => {
    it('AddRoad: undo deep-equals the pre-execute document', () => {
      const before = structuredClone(doc);
      const cmd = new AddRoadCommand({ name: 'R1' }, getDoc, setDoc, markDirty);
      history.execute(cmd);
      expect(doc).not.toEqual(before);

      history.undo();
      expect(doc).toEqual(before);
    });

    it('UpdateRoad: undo deep-equals the pre-update document', () => {
      const add = new AddRoadCommand({ name: 'R1', length: 100 }, getDoc, setDoc, markDirty);
      history.execute(add);
      const beforeUpdate = structuredClone(doc);

      const upd = new UpdateRoadCommand(
        add.getCreatedRoad().id,
        { name: 'Renamed', length: 250 },
        getDoc,
        setDoc,
        markDirty,
      );
      history.execute(upd);
      expect(doc).not.toEqual(beforeUpdate);

      history.undo();
      expect(doc).toEqual(beforeUpdate);
    });

    it('RemoveRoad with back-links: undo restores the exact prior document', () => {
      const d = createTestDocument();
      d.roads.push(createTestRoad({ id: 'road-1', name: 'R1' }));
      d.roads.push(
        createTestRoad({
          id: 'road-2',
          name: 'R2',
          link: { predecessor: { elementType: 'road', elementId: 'road-1', contactPoint: 'end' } },
        }),
      );
      const mock = createMockGetSet(d);
      const before = structuredClone(mock.getLatest());

      const cmd = new RemoveRoadCommand('road-1', mock.getDoc, mock.setDoc, mock.markDirtyRoad);
      cmd.execute();
      const after = mock.getLatest();
      // road-1 gone AND road-2's dangling predecessor cleared.
      expect(after.roads).toHaveLength(1);
      expect(after.roads[0].link?.predecessor).toBeUndefined();

      cmd.undo();
      expect(mock.getLatest()).toEqual(before);
      void d;
    });
  });

  describe('redo (stored-patch replay) is byte-identical to first execute', () => {
    function expectRedoByteEqual(exec: () => PatchCommand): void {
      const cmd = exec();
      history.execute(cmd);
      const afterFirst = structuredClone(doc);

      history.undo();
      history.redo();
      expect(doc).toEqual(afterFirst);
    }

    it('AddRoad redo matches first execute', () => {
      expectRedoByteEqual(() => new AddRoadCommand({ name: 'R1' }, getDoc, setDoc, markDirty));
    });

    it('SplitRoad redo matches first execute (complex multi-array mutation)', () => {
      const d = createTestDocument();
      d.roads.push(createTestRoad({ id: 'road-1', length: 100 }));
      const mock = createMockGetSet(d);
      const cmd = new SplitRoadCommand('road-1', 50, mock.getDoc, mock.setDoc, mock.markDirtyRoad);

      cmd.execute();
      const afterFirst = structuredClone(mock.getLatest());
      cmd.undo();
      cmd.execute(); // redo re-runs execute per CommandHistory semantics
      expect(mock.getLatest()).toEqual(afterFirst);
      void d;
    });

    it('JoinRoads redo matches first execute', () => {
      const d = createTestDocument();
      d.roads.push(
        createTestRoad({
          id: 'road-1',
          length: 100,
          link: { successor: { elementType: 'road', elementId: 'road-2', contactPoint: 'start' } },
        }),
      );
      d.roads.push(
        createTestRoad({
          id: 'road-2',
          length: 100,
          link: { predecessor: { elementType: 'road', elementId: 'road-1', contactPoint: 'end' } },
        }),
      );
      const mock = createMockGetSet(d);
      const cmd = new JoinRoadsCommand('road-1', 'road-2', mock.getDoc, mock.setDoc, mock.markDirtyRoad);

      cmd.execute();
      const afterFirst = structuredClone(mock.getLatest());
      cmd.undo();
      cmd.execute();
      expect(mock.getLatest()).toEqual(afterFirst);
      void d;
    });

    it('full undo/redo/undo cycle returns to matching snapshots', () => {
      const cmd = new AddRoadCommand({ name: 'R1' }, getDoc, setDoc, markDirty);
      history.execute(cmd);
      const stateA = structuredClone(doc);

      history.undo();
      const stateB = structuredClone(doc);
      expect(stateB).not.toEqual(stateA);

      history.redo();
      expect(doc).toEqual(stateA);

      history.undo();
      expect(doc).toEqual(stateB);
    });
  });

  describe('empty patch set (guarded no-op) is a no-op through the full cycle', () => {
    it('UpdateRoad on a missing road changes nothing on execute/undo/redo', () => {
      const before = structuredClone(doc);
      const cmd = new UpdateRoadCommand('missing', { name: 'X' }, getDoc, setDoc, markDirty);

      cmd.execute();
      expect(doc).toEqual(before);
      cmd.undo();
      expect(doc).toEqual(before);
      cmd.execute(); // redo replays empty patches
      expect(doc).toEqual(before);
    });
  });

  describe('dirty-flag emission is unchanged', () => {
    it('AddRoad marks the road dirty on execute, undo, and redo', () => {
      const cmd = new AddRoadCommand({ name: 'R1' }, getDoc, setDoc, markDirty);
      const id = cmd.getCreatedRoad().id;

      history.execute(cmd);
      expect(dirtyIds).toEqual([id]);

      history.undo();
      expect(dirtyIds).toEqual([id, id]);

      history.redo();
      expect(dirtyIds).toEqual([id, id, id]);
    });

    it('JoinRoads marks only the first road on execute but both on undo', () => {
      const d = createTestDocument();
      d.roads.push(
        createTestRoad({
          id: 'road-1',
          length: 100,
          link: { successor: { elementType: 'road', elementId: 'road-2', contactPoint: 'start' } },
        }),
      );
      d.roads.push(
        createTestRoad({
          id: 'road-2',
          length: 100,
          link: { predecessor: { elementType: 'road', elementId: 'road-1', contactPoint: 'end' } },
        }),
      );
      const marked: string[] = [];
      let cur = d;
      const cmd = new JoinRoadsCommand(
        'road-1',
        'road-2',
        () => cur,
        (n) => {
          cur = n;
        },
        (id) => marked.push(id),
      );

      cmd.execute();
      expect(marked).toEqual(['road-1']);

      cmd.undo();
      // Undo re-inserts road-2, so both must be marked dirty for regeneration.
      expect(marked).toEqual(['road-1', 'road-1', 'road-2']);
      void d;
    });
  });

  describe('CompoundCommand batch collapse still works on the patch base', () => {
    it('a compound of patch commands undoes/redoes as one step, byte-identical', () => {
      const add = new AddRoadCommand({ name: 'R1' }, getDoc, setDoc, markDirty);
      history.execute(add);
      const roadId = add.getCreatedRoad().id;
      const beforeBatch = structuredClone(doc);

      // Build member commands (as the store's endBatch would after they ran).
      const upd = new UpdateRoadCommand(roadId, { length: 321 }, getDoc, setDoc, markDirty);
      const upd2 = new UpdateRoadCommand(roadId, { name: 'R1-batched' }, getDoc, setDoc, markDirty);
      const compound = new CompoundCommand('batch', [upd, upd2]);

      history.execute(compound);
      const afterBatch = structuredClone(doc);
      expect(doc.roads[0].length).toBe(321);
      expect(doc.roads[0].name).toBe('R1-batched');
      expect(afterBatch).not.toEqual(beforeBatch);

      // One undo reverts BOTH member mutations.
      history.undo();
      expect(doc).toEqual(beforeBatch);

      // One redo re-applies BOTH, byte-identical.
      history.redo();
      expect(doc).toEqual(afterBatch);
    });
  });
});
