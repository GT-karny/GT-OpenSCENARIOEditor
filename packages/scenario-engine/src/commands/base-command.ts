/**
 * Abstract base class implementing ICommand.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ICommand } from '@osce/shared';

export abstract class BaseCommand implements ICommand {
  readonly id: string;
  readonly description: string;

  constructor(description: string) {
    this.id = uuidv4();
    this.description = description;
  }

  abstract execute(): void;
  abstract undo(): void;
}
