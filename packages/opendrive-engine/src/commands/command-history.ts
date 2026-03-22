/**
 * Command history implementing ICommandHistory.
 * Manages undo/redo stacks for the command pattern.
 */

import type { ICommand, ICommandHistory } from '@osce/shared';

export class CommandHistory implements ICommandHistory {
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  execute(command: ICommand): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.splice(0, this.undoStack.length - this.maxSize);
    }
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  getUndoStack(): readonly ICommand[] {
    return this.undoStack;
  }

  getRedoStack(): readonly ICommand[] {
    return this.redoStack;
  }

  /**
   * Replace the most recent `count` commands on the undo stack with a single
   * replacement command. Used by batch operations to collapse multiple
   * individual commands into one undo step.
   */
  collapseUndo(count: number, replacement: ICommand): void {
    const removeCount = Math.min(count, this.undoStack.length);
    if (removeCount > 0) {
      this.undoStack.splice(this.undoStack.length - removeCount, removeCount);
    }
    this.undoStack.push(replacement);
    this.redoStack = [];
  }
}
