/**
 * A compound command that groups multiple sub-commands into a single
 * undo/redo unit. Used for complex operations whose individual steps must
 * commit and revert together as one history entry.
 */

import type { ICommand } from '@osce/shared';
import { BaseCommand } from './base-command.js';

export class CompoundCommand extends BaseCommand {
  private readonly commands: ICommand[];

  constructor(description: string, commands: ICommand[]) {
    super(description);
    this.commands = commands;
  }

  execute(): void {
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }

  undo(): void {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  getSubCommands(): readonly ICommand[] {
    return this.commands;
  }
}
