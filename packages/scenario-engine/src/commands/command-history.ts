/**
 * Command history implementing ICommandHistory.
 * Manages undo/redo stacks for the command pattern.
 */

import type { ICommand, ICommandHistory } from '@osce/shared';

/**
 * Monotonic source of history-entry identities, shared across all
 * CommandHistory instances. Each pushed entry gets a unique, never-reused id;
 * because ids never repeat, a branched history can never coincidentally match a
 * savedRevision captured before the branch (see {@link CommandHistory.getRevision}).
 */
let nextRevisionId = 1;

export class CommandHistory implements ICommandHistory {
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  // Entry identities, kept parallel to the command stacks. `undoIds[i]` is the id
  // of `undoStack[i]`; `redoIds` mirrors `redoStack` (top = the next redo).
  private undoIds: number[] = [];
  private redoIds: number[] = [];
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  execute(command: ICommand): void {
    command.execute();
    this.undoStack.push(command);
    // A fresh id: the redo branch (if any) is discarded below, so this new entry
    // can never share an id with the abandoned future.
    this.undoIds.push(nextRevisionId++);
    this.redoStack = [];
    this.redoIds = [];
    if (this.undoStack.length > this.maxSize) {
      const excess = this.undoStack.length - this.maxSize;
      this.undoStack.splice(0, excess);
      this.undoIds.splice(0, excess);
    }
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (command) {
      const id = this.undoIds.pop()!;
      command.undo();
      this.redoStack.push(command);
      this.redoIds.push(id);
    }
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (command) {
      const id = this.redoIds.pop()!;
      command.execute();
      this.undoStack.push(command);
      this.undoIds.push(id);
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
    this.undoIds = [];
    this.redoIds = [];
  }

  /**
   * Identity of the history entry the current position is standing on, i.e. the
   * id of the top undo entry (`0` at the base position / empty history).
   *
   * The value is derived from *position*, not a running counter, so undo/redo
   * move it back and forth over the same ids. A consumer can therefore snapshot
   * `savedRevision = getRevision()` on save and treat `getRevision() !== savedRevision`
   * as the dirty flag: undoing back to the save point restores the saved value
   * and the document reads clean again.
   */
  getRevision(): number {
    return this.undoIds.length > 0 ? this.undoIds[this.undoIds.length - 1] : 0;
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
   *
   * The collapse does not change the current document state, so the merged entry
   * inherits the id of the pre-merge head entry and {@link getRevision} stays
   * unchanged across the operation.
   */
  collapseUndo(count: number, replacement: ICommand): void {
    const removeCount = Math.min(count, this.undoStack.length);
    // Preserve the current position's identity (fall back to a fresh id only when
    // collapsing onto an empty stack, where the replacement is genuinely new).
    const headId =
      this.undoIds.length > 0 ? this.undoIds[this.undoIds.length - 1] : nextRevisionId++;
    if (removeCount > 0) {
      this.undoStack.splice(this.undoStack.length - removeCount, removeCount);
      this.undoIds.splice(this.undoIds.length - removeCount, removeCount);
    }
    this.undoStack.push(replacement);
    this.undoIds.push(headId);
    this.redoStack = [];
    this.redoIds = [];
  }
}
