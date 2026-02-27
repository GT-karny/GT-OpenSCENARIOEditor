/**
 * Update commands for storyboard elements.
 * Follows the same pattern as UpdateEntityCommand.
 */

import { produce } from 'immer';
import type {
  Story,
  Act,
  ManeuverGroup,
  Maneuver,
  ScenarioEvent,
  ScenarioAction,
  Condition,
} from '@osce/shared';
import { BaseCommand } from './base-command.js';
import type { GetDoc, SetDoc } from './entity-commands.js';
import {
  findStoryById,
  findStoryIndex,
  findActById,
  findManeuverGroupById,
  findManeuverById,
  findEventById,
  findActionById,
} from '../operations/storyboard-operations.js';
import { findConditionById } from '../operations/trigger-operations.js';

export class UpdateStoryCommand extends BaseCommand {
  private previousStory: Story | null = null;
  private readonly storyId: string;
  private readonly updates: Partial<Story>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(storyId: string, updates: Partial<Story>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Update story: ${storyId}`);
    this.storyId = storyId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const story = findStoryById(doc, this.storyId);
    if (!story) return;
    this.previousStory = structuredClone(story);
    this.setDoc(
      produce(doc, (draft) => {
        const idx = findStoryIndex(draft, this.storyId);
        if (idx !== -1) Object.assign(draft.storyboard.stories[idx], this.updates);
      }),
    );
  }

  undo(): void {
    if (!this.previousStory) return;
    const prev = this.previousStory;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const idx = findStoryIndex(draft, this.storyId);
        if (idx !== -1) draft.storyboard.stories[idx] = prev;
      }),
    );
  }
}

export class UpdateActCommand extends BaseCommand {
  private previousAct: Act | null = null;
  private readonly actId: string;
  private readonly updates: Partial<Act>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(actId: string, updates: Partial<Act>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Update act: ${actId}`);
    this.actId = actId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const found = findActById(doc, this.actId);
    if (!found) return;
    this.previousAct = structuredClone(found.act);
    this.setDoc(
      produce(doc, (draft) => {
        const f = findActById(draft, this.actId);
        if (f) Object.assign(f.act, this.updates);
      }),
    );
  }

  undo(): void {
    if (!this.previousAct) return;
    const prev = this.previousAct;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const f = findActById(draft, this.actId);
        if (f) {
          const story = draft.storyboard.stories.find((s) =>
            s.acts.some((a) => a.id === this.actId),
          );
          if (story) {
            const idx = story.acts.findIndex((a) => a.id === this.actId);
            if (idx !== -1) story.acts[idx] = prev;
          }
        }
      }),
    );
  }
}

export class UpdateManeuverGroupCommand extends BaseCommand {
  private previousGroup: ManeuverGroup | null = null;
  private readonly groupId: string;
  private readonly updates: Partial<ManeuverGroup>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(
    groupId: string,
    updates: Partial<ManeuverGroup>,
    getDoc: GetDoc,
    setDoc: SetDoc,
  ) {
    super(`Update maneuver group: ${groupId}`);
    this.groupId = groupId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const found = findManeuverGroupById(doc, this.groupId);
    if (!found) return;
    this.previousGroup = structuredClone(found.group);
    this.setDoc(
      produce(doc, (draft) => {
        const f = findManeuverGroupById(draft, this.groupId);
        if (f) Object.assign(f.group, this.updates);
      }),
    );
  }

  undo(): void {
    if (!this.previousGroup) return;
    const prev = this.previousGroup;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const f = findManeuverGroupById(draft, this.groupId);
        if (f) {
          const act = f.act;
          const idx = act.maneuverGroups.findIndex((g) => g.id === this.groupId);
          if (idx !== -1) act.maneuverGroups[idx] = prev;
        }
      }),
    );
  }
}

export class UpdateManeuverCommand extends BaseCommand {
  private previousManeuver: Maneuver | null = null;
  private readonly maneuverId: string;
  private readonly updates: Partial<Maneuver>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(maneuverId: string, updates: Partial<Maneuver>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Update maneuver: ${maneuverId}`);
    this.maneuverId = maneuverId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const found = findManeuverById(doc, this.maneuverId);
    if (!found) return;
    this.previousManeuver = structuredClone(found.maneuver);
    this.setDoc(
      produce(doc, (draft) => {
        const f = findManeuverById(draft, this.maneuverId);
        if (f) Object.assign(f.maneuver, this.updates);
      }),
    );
  }

  undo(): void {
    if (!this.previousManeuver) return;
    const prev = this.previousManeuver;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const f = findManeuverById(draft, this.maneuverId);
        if (f) {
          const idx = f.group.maneuvers.findIndex((m) => m.id === this.maneuverId);
          if (idx !== -1) f.group.maneuvers[idx] = prev;
        }
      }),
    );
  }
}

export class UpdateEventCommand extends BaseCommand {
  private previousEvent: ScenarioEvent | null = null;
  private readonly eventId: string;
  private readonly updates: Partial<ScenarioEvent>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(eventId: string, updates: Partial<ScenarioEvent>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Update event: ${eventId}`);
    this.eventId = eventId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const found = findEventById(doc, this.eventId);
    if (!found) return;
    this.previousEvent = structuredClone(found.event);
    this.setDoc(
      produce(doc, (draft) => {
        const f = findEventById(draft, this.eventId);
        if (f) Object.assign(f.event, this.updates);
      }),
    );
  }

  undo(): void {
    if (!this.previousEvent) return;
    const prev = this.previousEvent;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const f = findEventById(draft, this.eventId);
        if (f) {
          const idx = f.maneuver.events.findIndex((e) => e.id === this.eventId);
          if (idx !== -1) f.maneuver.events[idx] = prev;
        }
      }),
    );
  }
}

export class UpdateActionCommand extends BaseCommand {
  private previousAction: ScenarioAction | null = null;
  private readonly actionId: string;
  private readonly updates: Partial<ScenarioAction>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(actionId: string, updates: Partial<ScenarioAction>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Update action: ${actionId}`);
    this.actionId = actionId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const found = findActionById(doc, this.actionId);
    if (!found) return;
    this.previousAction = structuredClone(found.action);
    this.setDoc(
      produce(doc, (draft) => {
        const f = findActionById(draft, this.actionId);
        if (f) Object.assign(f.action, this.updates);
      }),
    );
  }

  undo(): void {
    if (!this.previousAction) return;
    const prev = this.previousAction;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const f = findActionById(draft, this.actionId);
        if (f) {
          const idx = f.event.actions.findIndex((a) => a.id === this.actionId);
          if (idx !== -1) f.event.actions[idx] = prev;
        }
      }),
    );
  }
}

export class UpdateConditionCommand extends BaseCommand {
  private previousCondition: Condition | null = null;
  private readonly conditionId: string;
  private readonly updates: Partial<Condition>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(conditionId: string, updates: Partial<Condition>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Update condition: ${conditionId}`);
    this.conditionId = conditionId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const found = findConditionById(doc, this.conditionId);
    if (!found) return;
    this.previousCondition = structuredClone(found.condition);
    this.setDoc(
      produce(doc, (draft) => {
        const f = findConditionById(draft, this.conditionId);
        if (f) Object.assign(f.condition, this.updates);
      }),
    );
  }

  undo(): void {
    if (!this.previousCondition) return;
    const prev = this.previousCondition;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const f = findConditionById(draft, this.conditionId);
        if (f) {
          const idx = f.group.conditions.findIndex((c) => c.id === this.conditionId);
          if (idx !== -1) f.group.conditions[idx] = prev;
        }
      }),
    );
  }
}
