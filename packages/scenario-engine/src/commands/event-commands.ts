/**
 * Commands for ScenarioEvent operations.
 */

import { produce } from 'immer';
import type { ScenarioDocument, ScenarioEvent } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createEventFromPartial } from '../store/defaults.js';
import { findManeuverById, findEventById } from '../operations/storyboard-operations.js';

export type GetDoc = () => ScenarioDocument;
export type SetDoc = (doc: ScenarioDocument) => void;

export class AddEventCommand extends BaseCommand {
  private readonly event: ScenarioEvent;
  private readonly maneuverId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(maneuverId: string, partial: Partial<ScenarioEvent>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Add event: ${partial.name ?? 'unnamed'}`);
    this.maneuverId = maneuverId;
    this.event = createEventFromPartial(partial);
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const found = findManeuverById(draft, this.maneuverId);
      if (found) found.maneuver.events.push(this.event);
    }));
  }

  undo(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const found = findManeuverById(draft, this.maneuverId);
      if (found) {
        const idx = found.maneuver.events.findIndex((e) => e.id === this.event.id);
        if (idx !== -1) found.maneuver.events.splice(idx, 1);
      }
    }));
  }

  getCreatedEvent(): ScenarioEvent {
    return this.event;
  }
}

export class RemoveEventCommand extends BaseCommand {
  private removedEvent: ScenarioEvent | null = null;
  private removedIndex = -1;
  private parentManeuverId: string | null = null;
  private readonly eventId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(eventId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Remove event: ${eventId}`);
    this.eventId = eventId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const found = findEventById(doc, this.eventId);
    if (found) {
      this.removedEvent = found.event;
      this.removedIndex = found.eventIndex;
      this.parentManeuverId = found.maneuver.id;
    }
    this.setDoc(produce(doc, (draft) => {
      if (this.parentManeuverId) {
        const f = findManeuverById(draft, this.parentManeuverId);
        if (f && this.removedIndex !== -1) {
          f.maneuver.events.splice(this.removedIndex, 1);
        }
      }
    }));
  }

  undo(): void {
    if (!this.removedEvent || !this.parentManeuverId || this.removedIndex === -1) return;
    const event = this.removedEvent;
    const maneuverId = this.parentManeuverId;
    const idx = this.removedIndex;
    this.setDoc(produce(this.getDoc(), (draft) => {
      const f = findManeuverById(draft, maneuverId);
      if (f) f.maneuver.events.splice(idx, 0, event);
    }));
  }
}
