/**
 * Commands for Maneuver operations.
 */

import { produce } from 'immer';
import type { ScenarioDocument, Maneuver } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createManeuverFromPartial } from '../store/defaults.js';
import { findManeuverGroupById, findManeuverById } from '../operations/storyboard-operations.js';

export type GetDoc = () => ScenarioDocument;
export type SetDoc = (doc: ScenarioDocument) => void;

export class AddManeuverCommand extends BaseCommand {
  private readonly maneuver: Maneuver;
  private readonly groupId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(groupId: string, partial: Partial<Maneuver>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Add maneuver: ${partial.name ?? 'unnamed'}`);
    this.groupId = groupId;
    this.maneuver = createManeuverFromPartial(partial);
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const found = findManeuverGroupById(draft, this.groupId);
      if (found) found.group.maneuvers.push(this.maneuver);
    }));
  }

  undo(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const found = findManeuverGroupById(draft, this.groupId);
      if (found) {
        const idx = found.group.maneuvers.findIndex((m) => m.id === this.maneuver.id);
        if (idx !== -1) found.group.maneuvers.splice(idx, 1);
      }
    }));
  }

  getCreatedManeuver(): Maneuver {
    return this.maneuver;
  }
}

export class RemoveManeuverCommand extends BaseCommand {
  private removedManeuver: Maneuver | null = null;
  private removedIndex = -1;
  private parentGroupId: string | null = null;
  private readonly maneuverId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(maneuverId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Remove maneuver: ${maneuverId}`);
    this.maneuverId = maneuverId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const found = findManeuverById(doc, this.maneuverId);
    if (found) {
      this.removedManeuver = found.maneuver;
      this.removedIndex = found.maneuverIndex;
      this.parentGroupId = found.group.id;
    }
    this.setDoc(produce(doc, (draft) => {
      if (this.parentGroupId) {
        const f = findManeuverGroupById(draft, this.parentGroupId);
        if (f && this.removedIndex !== -1) {
          f.group.maneuvers.splice(this.removedIndex, 1);
        }
      }
    }));
  }

  undo(): void {
    if (!this.removedManeuver || !this.parentGroupId || this.removedIndex === -1) return;
    const maneuver = this.removedManeuver;
    const groupId = this.parentGroupId;
    const idx = this.removedIndex;
    this.setDoc(produce(this.getDoc(), (draft) => {
      const f = findManeuverGroupById(draft, groupId);
      if (f) f.group.maneuvers.splice(idx, 0, maneuver);
    }));
  }
}
