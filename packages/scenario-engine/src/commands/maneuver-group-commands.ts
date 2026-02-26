/**
 * Commands for ManeuverGroup operations.
 */

import { produce } from 'immer';
import type { ScenarioDocument, ManeuverGroup } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createManeuverGroupFromPartial } from '../store/defaults.js';
import { findActById, findManeuverGroupById } from '../operations/storyboard-operations.js';

export type GetDoc = () => ScenarioDocument;
export type SetDoc = (doc: ScenarioDocument) => void;

export class AddManeuverGroupCommand extends BaseCommand {
  private readonly group: ManeuverGroup;
  private readonly actId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(actId: string, partial: Partial<ManeuverGroup>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Add maneuver group: ${partial.name ?? 'unnamed'}`);
    this.actId = actId;
    this.group = createManeuverGroupFromPartial(partial);
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const found = findActById(draft, this.actId);
      if (found) found.act.maneuverGroups.push(this.group);
    }));
  }

  undo(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const found = findActById(draft, this.actId);
      if (found) {
        const idx = found.act.maneuverGroups.findIndex((g) => g.id === this.group.id);
        if (idx !== -1) found.act.maneuverGroups.splice(idx, 1);
      }
    }));
  }

  getCreatedGroup(): ManeuverGroup {
    return this.group;
  }
}

export class RemoveManeuverGroupCommand extends BaseCommand {
  private removedGroup: ManeuverGroup | null = null;
  private removedIndex = -1;
  private parentActId: string | null = null;
  private readonly groupId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(groupId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Remove maneuver group: ${groupId}`);
    this.groupId = groupId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const found = findManeuverGroupById(doc, this.groupId);
    if (found) {
      this.removedGroup = found.group;
      this.removedIndex = found.groupIndex;
      this.parentActId = found.act.id;
    }
    this.setDoc(produce(doc, (draft) => {
      if (this.parentActId) {
        const f = findActById(draft, this.parentActId);
        if (f && this.removedIndex !== -1) {
          f.act.maneuverGroups.splice(this.removedIndex, 1);
        }
      }
    }));
  }

  undo(): void {
    if (!this.removedGroup || !this.parentActId || this.removedIndex === -1) return;
    const group = this.removedGroup;
    const actId = this.parentActId;
    const idx = this.removedIndex;
    this.setDoc(produce(this.getDoc(), (draft) => {
      const f = findActById(draft, actId);
      if (f) f.act.maneuverGroups.splice(idx, 0, group);
    }));
  }
}
