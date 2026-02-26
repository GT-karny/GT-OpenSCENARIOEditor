/**
 * Commands for Trigger, ConditionGroup, and Condition operations.
 */

import { produce } from 'immer';
import type { ScenarioDocument, Trigger, ConditionGroup, Condition } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createDefaultConditionGroup, createConditionFromPartial } from '../store/defaults.js';
import { getElementById } from '../operations/tree-traversal.js';
import { findTriggerById, findConditionGroupById, findConditionById } from '../operations/trigger-operations.js';

export type GetDoc = () => ScenarioDocument;
export type SetDoc = (doc: ScenarioDocument) => void;

/**
 * Helper to set a trigger on an element that has startTrigger/stopTrigger.
 */
function setTriggerOnElement(
  doc: ScenarioDocument,
  elementId: string,
  field: 'startTrigger' | 'stopTrigger',
  trigger: Trigger,
): ScenarioDocument {
  return produce(doc, (draft) => {
    const element = getElementById(draft, elementId) as Record<string, unknown> | undefined;
    if (element && field in element) {
      element[field] = trigger;
    }
  });
}

export class SetStartTriggerCommand extends BaseCommand {
  private previousTrigger: Trigger | null = null;
  private readonly elementId: string;
  private readonly trigger: Trigger;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(elementId: string, trigger: Trigger, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Set start trigger on: ${elementId}`);
    this.elementId = elementId;
    this.trigger = trigger;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const element = getElementById(doc, this.elementId) as Record<string, unknown> | undefined;
    if (element && 'startTrigger' in element) {
      this.previousTrigger = element.startTrigger as Trigger;
    }
    this.setDoc(setTriggerOnElement(doc, this.elementId, 'startTrigger', this.trigger));
  }

  undo(): void {
    if (!this.previousTrigger) return;
    this.setDoc(setTriggerOnElement(this.getDoc(), this.elementId, 'startTrigger', this.previousTrigger));
  }
}

export class SetStopTriggerCommand extends BaseCommand {
  private previousTrigger: Trigger | null = null;
  private readonly elementId: string;
  private readonly trigger: Trigger;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(elementId: string, trigger: Trigger, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Set stop trigger on: ${elementId}`);
    this.elementId = elementId;
    this.trigger = trigger;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const element = getElementById(doc, this.elementId) as Record<string, unknown> | undefined;
    if (element && 'stopTrigger' in element) {
      this.previousTrigger = element.stopTrigger as Trigger;
    }
    this.setDoc(setTriggerOnElement(doc, this.elementId, 'stopTrigger', this.trigger));
  }

  undo(): void {
    if (!this.previousTrigger) return;
    this.setDoc(setTriggerOnElement(this.getDoc(), this.elementId, 'stopTrigger', this.previousTrigger));
  }
}

export class AddConditionGroupCommand extends BaseCommand {
  private readonly group: ConditionGroup;
  private readonly triggerId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(triggerId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Add condition group to trigger: ${triggerId}`);
    this.triggerId = triggerId;
    this.group = createDefaultConditionGroup();
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const loc = findTriggerById(draft, this.triggerId);
      if (loc) loc.trigger.conditionGroups.push(this.group);
    }));
  }

  undo(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const loc = findTriggerById(draft, this.triggerId);
      if (loc) {
        const idx = loc.trigger.conditionGroups.findIndex((g) => g.id === this.group.id);
        if (idx !== -1) loc.trigger.conditionGroups.splice(idx, 1);
      }
    }));
  }

  getCreatedGroup(): ConditionGroup {
    return this.group;
  }
}

export class RemoveConditionGroupCommand extends BaseCommand {
  private removedGroup: ConditionGroup | null = null;
  private removedIndex = -1;
  private parentTriggerId: string | null = null;
  private readonly groupId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(groupId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Remove condition group: ${groupId}`);
    this.groupId = groupId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const found = findConditionGroupById(doc, this.groupId);
    if (found) {
      this.removedGroup = found.group;
      this.removedIndex = found.groupIndex;
      this.parentTriggerId = found.trigger.id;
    }
    this.setDoc(produce(doc, (draft) => {
      if (this.parentTriggerId) {
        const loc = findTriggerById(draft, this.parentTriggerId);
        if (loc && this.removedIndex !== -1) {
          loc.trigger.conditionGroups.splice(this.removedIndex, 1);
        }
      }
    }));
  }

  undo(): void {
    if (!this.removedGroup || !this.parentTriggerId || this.removedIndex === -1) return;
    const group = this.removedGroup;
    const triggerId = this.parentTriggerId;
    const idx = this.removedIndex;
    this.setDoc(produce(this.getDoc(), (draft) => {
      const loc = findTriggerById(draft, triggerId);
      if (loc) loc.trigger.conditionGroups.splice(idx, 0, group);
    }));
  }
}

export class AddConditionCommand extends BaseCommand {
  private readonly condition: Condition;
  private readonly groupId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(groupId: string, partial: Partial<Condition>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Add condition to group: ${groupId}`);
    this.groupId = groupId;
    this.condition = createConditionFromPartial(partial);
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const found = findConditionGroupById(draft, this.groupId);
      if (found) found.group.conditions.push(this.condition);
    }));
  }

  undo(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const found = findConditionGroupById(draft, this.groupId);
      if (found) {
        const idx = found.group.conditions.findIndex((c) => c.id === this.condition.id);
        if (idx !== -1) found.group.conditions.splice(idx, 1);
      }
    }));
  }

  getCreatedCondition(): Condition {
    return this.condition;
  }
}

export class RemoveConditionCommand extends BaseCommand {
  private removedCondition: Condition | null = null;
  private removedIndex = -1;
  private parentGroupId: string | null = null;
  private readonly conditionId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(conditionId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Remove condition: ${conditionId}`);
    this.conditionId = conditionId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const found = findConditionById(doc, this.conditionId);
    if (found) {
      this.removedCondition = found.condition;
      this.removedIndex = found.conditionIndex;
      this.parentGroupId = found.group.id;
    }
    this.setDoc(produce(doc, (draft) => {
      if (this.parentGroupId) {
        const f = findConditionGroupById(draft, this.parentGroupId);
        if (f && this.removedIndex !== -1) {
          f.group.conditions.splice(this.removedIndex, 1);
        }
      }
    }));
  }

  undo(): void {
    if (!this.removedCondition || !this.parentGroupId || this.removedIndex === -1) return;
    const condition = this.removedCondition;
    const groupId = this.parentGroupId;
    const idx = this.removedIndex;
    this.setDoc(produce(this.getDoc(), (draft) => {
      const f = findConditionGroupById(draft, groupId);
      if (f) f.group.conditions.splice(idx, 0, condition);
    }));
  }
}
