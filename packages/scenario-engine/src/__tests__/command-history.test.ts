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
});
