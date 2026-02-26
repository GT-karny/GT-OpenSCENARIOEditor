/**
 * Commands for Act operations.
 */

import { produce } from 'immer';
import type { ScenarioDocument, Act } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createActFromPartial } from '../store/defaults.js';
import { findStoryById, findActById } from '../operations/storyboard-operations.js';

export type GetDoc = () => ScenarioDocument;
export type SetDoc = (doc: ScenarioDocument) => void;

export class AddActCommand extends BaseCommand {
  private readonly act: Act;
  private readonly storyId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(storyId: string, partial: Partial<Act>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Add act: ${partial.name ?? 'unnamed'}`);
    this.storyId = storyId;
    this.act = createActFromPartial(partial);
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const story = findStoryById(draft, this.storyId);
      if (story) story.acts.push(this.act);
    }));
  }

  undo(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const story = findStoryById(draft, this.storyId);
      if (story) {
        const idx = story.acts.findIndex((a) => a.id === this.act.id);
        if (idx !== -1) story.acts.splice(idx, 1);
      }
    }));
  }

  getCreatedAct(): Act {
    return this.act;
  }
}

export class RemoveActCommand extends BaseCommand {
  private removedAct: Act | null = null;
  private removedIndex = -1;
  private parentStoryId: string | null = null;
  private readonly actId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(actId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Remove act: ${actId}`);
    this.actId = actId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const found = findActById(doc, this.actId);
    if (found) {
      this.removedAct = found.act;
      this.removedIndex = found.actIndex;
      this.parentStoryId = found.story.id;
    }
    this.setDoc(produce(doc, (draft) => {
      if (this.parentStoryId) {
        const story = findStoryById(draft, this.parentStoryId);
        if (story && this.removedIndex !== -1) {
          story.acts.splice(this.removedIndex, 1);
        }
      }
    }));
  }

  undo(): void {
    if (!this.removedAct || !this.parentStoryId || this.removedIndex === -1) return;
    const act = this.removedAct;
    const storyId = this.parentStoryId;
    const idx = this.removedIndex;
    this.setDoc(produce(this.getDoc(), (draft) => {
      const story = findStoryById(draft, storyId);
      if (story) story.acts.splice(idx, 0, act);
    }));
  }
}
