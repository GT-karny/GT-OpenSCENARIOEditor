import { describe, it, expect } from 'vitest';
import { CommandHistory } from '../commands/command-history.js';
import type { ICommand } from '@osce/shared';

function createMockCommand(log: string[]): ICommand {
  const id = `cmd-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    description: `Mock ${id}`,
    execute: () => log.push(`execute:${id}`),
    undo: () => log.push(`undo:${id}`),
  };
}

describe('CommandHistory', () => {
  it('executes a command and pushes to undo stack', () => {
    const log: string[] = [];
    const history = new CommandHistory();
    const cmd = createMockCommand(log);

    history.execute(cmd);

    expect(log).toEqual([`execute:${cmd.id}`]);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
    expect(history.getUndoStack()).toHaveLength(1);
  });

  it('undo moves command to redo stack', () => {
    const log: string[] = [];
    const history = new CommandHistory();
    const cmd = createMockCommand(log);

    history.execute(cmd);
    history.undo();

    expect(log).toContain(`undo:${cmd.id}`);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
    expect(history.getRedoStack()).toHaveLength(1);
  });

  it('redo moves command back to undo stack', () => {
    const log: string[] = [];
    const history = new CommandHistory();
    const cmd = createMockCommand(log);

    history.execute(cmd);
    history.undo();
    history.redo();

    expect(log.filter((l) => l.startsWith('execute'))).toHaveLength(2);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it('execute clears redo stack', () => {
    const log: string[] = [];
    const history = new CommandHistory();
    const cmd1 = createMockCommand(log);
    const cmd2 = createMockCommand(log);

    history.execute(cmd1);
    history.undo();
    expect(history.canRedo()).toBe(true);

    history.execute(cmd2);
    expect(history.canRedo()).toBe(false);
    expect(history.getRedoStack()).toHaveLength(0);
  });

  it('clear empties both stacks', () => {
    const log: string[] = [];
    const history = new CommandHistory();
    history.execute(createMockCommand(log));
    history.execute(createMockCommand(log));

    history.clear();

    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.getUndoStack()).toHaveLength(0);
    expect(history.getRedoStack()).toHaveLength(0);
  });

  it('respects max size', () => {
    const log: string[] = [];
    const history = new CommandHistory(3);

    for (let i = 0; i < 5; i++) {
      history.execute(createMockCommand(log));
    }

    expect(history.getUndoStack()).toHaveLength(3);
  });

  it('undo on empty stack does nothing', () => {
    const history = new CommandHistory();
    history.undo();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it('redo on empty stack does nothing', () => {
    const history = new CommandHistory();
    history.redo();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it('multiple undo/redo cycles work correctly', () => {
    const log: string[] = [];
    const history = new CommandHistory();
    const cmd1 = createMockCommand(log);
    const cmd2 = createMockCommand(log);
    const cmd3 = createMockCommand(log);

    history.execute(cmd1);
    history.execute(cmd2);
    history.execute(cmd3);
    expect(history.getUndoStack()).toHaveLength(3);

    history.undo();
    history.undo();
    expect(history.getUndoStack()).toHaveLength(1);
    expect(history.getRedoStack()).toHaveLength(2);

    history.redo();
    expect(history.getUndoStack()).toHaveLength(2);
    expect(history.getRedoStack()).toHaveLength(1);
  });

  describe('getRevision (position-identity)', () => {
    it('starts at 0 on an empty history (base position)', () => {
      const history = new CommandHistory();
      expect(history.getRevision()).toBe(0);
    });

    it('undo returns to the earlier revision so derived dirty can clear', () => {
      const log: string[] = [];
      const history = new CommandHistory();

      // Snapshot the saved point at load (base = 0), then edit.
      const savedRevision = history.getRevision();
      history.execute(createMockCommand(log));
      expect(history.getRevision()).not.toBe(savedRevision); // dirty

      history.undo();
      expect(history.getRevision()).toBe(savedRevision); // clean again
    });

    it('returns to a mid-history saved revision after undo', () => {
      const log: string[] = [];
      const history = new CommandHistory();

      history.execute(createMockCommand(log));
      const savedRevision = history.getRevision(); // saved after one edit
      history.execute(createMockCommand(log));
      expect(history.getRevision()).not.toBe(savedRevision);

      history.undo();
      expect(history.getRevision()).toBe(savedRevision);
    });

    it('does not reuse ids on a branched history', () => {
      const log: string[] = [];
      const history = new CommandHistory();

      history.execute(createMockCommand(log)); // A
      const revA = history.getRevision();
      history.execute(createMockCommand(log)); // B
      const revB = history.getRevision();

      history.undo(); // back to A
      expect(history.getRevision()).toBe(revA);

      history.execute(createMockCommand(log)); // C discards the B branch
      const revC = history.getRevision();
      expect(revC).not.toBe(revA);
      expect(revC).not.toBe(revB);
    });

    it('redo re-enters the same revision it came from', () => {
      const log: string[] = [];
      const history = new CommandHistory();

      history.execute(createMockCommand(log));
      const rev = history.getRevision();
      history.undo();
      history.redo();
      expect(history.getRevision()).toBe(rev);
    });

    it('clear resets the revision to 0', () => {
      const log: string[] = [];
      const history = new CommandHistory();
      history.execute(createMockCommand(log));
      history.execute(createMockCommand(log));

      history.clear();
      expect(history.getRevision()).toBe(0);
    });
  });

  describe('collapseUndo', () => {
    it('replaces the last N commands with a single replacement', () => {
      const log: string[] = [];
      const history = new CommandHistory();
      history.execute(createMockCommand(log));
      history.execute(createMockCommand(log));
      history.execute(createMockCommand(log));
      expect(history.getUndoStack()).toHaveLength(3);

      const replacement = createMockCommand(log);
      history.collapseUndo(2, replacement);

      expect(history.getUndoStack()).toHaveLength(2);
      expect(history.getUndoStack()[1]).toBe(replacement);
    });

    it('clears the redo stack', () => {
      const log: string[] = [];
      const history = new CommandHistory();
      history.execute(createMockCommand(log));
      history.undo();
      expect(history.canRedo()).toBe(true);

      history.execute(createMockCommand(log));
      history.collapseUndo(1, createMockCommand(log));

      expect(history.canRedo()).toBe(false);
      expect(history.getRedoStack()).toHaveLength(0);
    });

    it('clamps count to the undo stack size', () => {
      const log: string[] = [];
      const history = new CommandHistory();
      history.execute(createMockCommand(log));

      const replacement = createMockCommand(log);
      history.collapseUndo(5, replacement);

      expect(history.getUndoStack()).toHaveLength(1);
      expect(history.getUndoStack()[0]).toBe(replacement);
    });

    it('pushes the replacement onto an empty undo stack when count is 0', () => {
      const log: string[] = [];
      const history = new CommandHistory();

      const replacement = createMockCommand(log);
      history.collapseUndo(0, replacement);

      expect(history.getUndoStack()).toHaveLength(1);
      expect(history.getUndoStack()[0]).toBe(replacement);
    });

    it('leaves the revision unchanged (collapse does not change current state)', () => {
      const log: string[] = [];
      const history = new CommandHistory();
      history.execute(createMockCommand(log));
      history.execute(createMockCommand(log));
      history.execute(createMockCommand(log));

      const before = history.getRevision();
      history.collapseUndo(2, createMockCommand(log));
      expect(history.getRevision()).toBe(before);
    });
  });
});
