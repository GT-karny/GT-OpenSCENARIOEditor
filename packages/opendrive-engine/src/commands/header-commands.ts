/**
 * Commands for OpenDRIVE header updates.
 */

import { produce } from 'immer';
import type { OdrHeader } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import type { GetDoc, SetDoc } from './road-commands.js';

export class UpdateHeaderCommand extends BaseCommand {
  private previousHeader: OdrHeader | null = null;
  private readonly updates: Partial<OdrHeader>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(updates: Partial<OdrHeader>, getDoc: GetDoc, setDoc: SetDoc) {
    super('Update OpenDRIVE header');
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    this.previousHeader = structuredClone(doc.header);
    this.setDoc(
      produce(doc, (draft) => {
        Object.assign(draft.header, this.updates);
      }),
    );
  }

  undo(): void {
    if (!this.previousHeader) return;
    const prev = this.previousHeader;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        draft.header = prev;
      }),
    );
  }
}
