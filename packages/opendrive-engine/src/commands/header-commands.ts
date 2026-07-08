/**
 * Commands for OpenDRIVE header updates.
 */

import type { OdrHeader } from '@osce/shared';
import { PatchCommand } from './patch-command.js';
import type { GetDoc, SetDoc } from './road-commands.js';

export class UpdateHeaderCommand extends PatchCommand {
  private readonly updates: Partial<OdrHeader>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(updates: Partial<OdrHeader>, getDoc: GetDoc, setDoc: SetDoc) {
    super('Update OpenDRIVE header');
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      Object.assign(draft.header, this.updates);
    });
  }
}
