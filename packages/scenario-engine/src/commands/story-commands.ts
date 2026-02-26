/**
 * Commands for Story operations.
 */

import { produce } from 'immer';
import type { ScenarioDocument, Story } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createStoryFromPartial } from '../store/defaults.js';
import { findStoryIndex } from '../operations/storyboard-operations.js';

export type GetDoc = () => ScenarioDocument;
export type SetDoc = (doc: ScenarioDocument) => void;

export class AddStoryCommand extends BaseCommand {
  private readonly story: Story;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(partial: Partial<Story>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Add story: ${partial.name ?? 'unnamed'}`);
    this.story = createStoryFromPartial(partial);
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      draft.storyboard.stories.push(this.story);
    }));
  }

  undo(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const idx = findStoryIndex(draft, this.story.id);
      if (idx !== -1) draft.storyboard.stories.splice(idx, 1);
    }));
  }

  getCreatedStory(): Story {
    return this.story;
  }
}

export class RemoveStoryCommand extends BaseCommand {
  private removedStory: Story | null = null;
  private removedIndex = -1;
  private readonly storyId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(storyId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Remove story: ${storyId}`);
    this.storyId = storyId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    this.removedIndex = findStoryIndex(doc, this.storyId);
    if (this.removedIndex !== -1) {
      this.removedStory = doc.storyboard.stories[this.removedIndex];
    }
    this.setDoc(produce(doc, (draft) => {
      if (this.removedIndex !== -1) draft.storyboard.stories.splice(this.removedIndex, 1);
    }));
  }

  undo(): void {
    if (!this.removedStory || this.removedIndex === -1) return;
    const story = this.removedStory;
    const idx = this.removedIndex;
    this.setDoc(produce(this.getDoc(), (draft) => {
      draft.storyboard.stories.splice(idx, 0, story);
    }));
  }
}
