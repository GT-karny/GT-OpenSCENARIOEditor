/**
 * Command pattern interface for Undo/Redo.
 */

export interface ICommand {
  readonly id: string;
  readonly description: string;
  execute(): void;
  undo(): void;
}

export interface ICommandHistory {
  execute(command: ICommand): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  clear(): void;
  getUndoStack(): readonly ICommand[];
  getRedoStack(): readonly ICommand[];
  /**
   * Replace the most recent `count` commands on the undo stack with a single
   * replacement command, clearing the redo stack. Used by batch operations to
   * collapse multiple individual commands into one undo step.
   */
  collapseUndo(count: number, replacement: ICommand): void;
}
