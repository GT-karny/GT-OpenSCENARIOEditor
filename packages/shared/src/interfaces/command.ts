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
}
