/**
 * Commands for ScenarioAction operations.
 */

import { produce } from 'immer';
import type { ScenarioDocument, ScenarioAction } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createActionFromPartial } from '../store/defaults.js';
import { findEventById, findActionById } from '../operations/storyboard-operations.js';

export type GetDoc = () => ScenarioDocument;
export type SetDoc = (doc: ScenarioDocument) => void;

export class AddActionCommand extends BaseCommand {
  private readonly action: ScenarioAction;
  private readonly eventId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(eventId: string, partial: Partial<ScenarioAction>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Add action: ${partial.name ?? 'unnamed'}`);
    this.eventId = eventId;
    this.action = createActionFromPartial(partial);
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const found = findEventById(draft, this.eventId);
      if (found) found.event.actions.push(this.action);
    }));
  }

  undo(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const found = findEventById(draft, this.eventId);
      if (found) {
        const idx = found.event.actions.findIndex((a) => a.id === this.action.id);
        if (idx !== -1) found.event.actions.splice(idx, 1);
      }
    }));
  }

  getCreatedAction(): ScenarioAction {
    return this.action;
  }
}

export class RemoveActionCommand extends BaseCommand {
  private removedAction: ScenarioAction | null = null;
  private removedIndex = -1;
  private parentEventId: string | null = null;
  private readonly actionId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(actionId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Remove action: ${actionId}`);
    this.actionId = actionId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const found = findActionById(doc, this.actionId);
    if (found) {
      this.removedAction = found.action;
      this.removedIndex = found.actionIndex;
      this.parentEventId = found.event.id;
    }
    this.setDoc(produce(doc, (draft) => {
      if (this.parentEventId) {
        const f = findEventById(draft, this.parentEventId);
        if (f && this.removedIndex !== -1) {
          f.event.actions.splice(this.removedIndex, 1);
        }
      }
    }));
  }

  undo(): void {
    if (!this.removedAction || !this.parentEventId || this.removedIndex === -1) return;
    const action = this.removedAction;
    const eventId = this.parentEventId;
    const idx = this.removedIndex;
    this.setDoc(produce(this.getDoc(), (draft) => {
      const f = findEventById(draft, eventId);
      if (f) f.event.actions.splice(idx, 0, action);
    }));
  }
}
