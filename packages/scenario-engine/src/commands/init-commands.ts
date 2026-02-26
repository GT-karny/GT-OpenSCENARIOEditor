/**
 * Commands for Init operations (initial entity actions, position, speed).
 */

import { produce } from 'immer';
import type { ScenarioDocument, PrivateAction, Position, InitPrivateAction } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createEntityInitActions, createInitPrivateAction } from '../store/defaults.js';
import {
  findEntityInitActions,
  findEntityInitActionsIndex,
  findInitActionById,
} from '../operations/init-operations.js';

export type GetDoc = () => ScenarioDocument;
export type SetDoc = (doc: ScenarioDocument) => void;

export class AddInitActionCommand extends BaseCommand {
  private readonly entityName: string;
  private readonly action: PrivateAction;
  private createdInitAction: InitPrivateAction | null = null;
  private createdEntityActions = false;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(entityName: string, action: PrivateAction, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Add init action for: ${entityName}`);
    this.entityName = entityName;
    this.action = action;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const initAction = createInitPrivateAction(this.action);
    this.createdInitAction = initAction;

    this.setDoc(produce(this.getDoc(), (draft) => {
      let ea = findEntityInitActions(draft, this.entityName);
      if (!ea) {
        ea = createEntityInitActions(this.entityName);
        draft.storyboard.init.entityActions.push(ea);
        this.createdEntityActions = true;
      }
      ea.privateActions.push(initAction);
    }));
  }

  undo(): void {
    if (!this.createdInitAction) return;
    const initActionId = this.createdInitAction.id;
    const entityName = this.entityName;
    const createdEA = this.createdEntityActions;

    this.setDoc(produce(this.getDoc(), (draft) => {
      if (createdEA) {
        const idx = findEntityInitActionsIndex(draft, entityName);
        if (idx !== -1) draft.storyboard.init.entityActions.splice(idx, 1);
      } else {
        const ea = findEntityInitActions(draft, entityName);
        if (ea) {
          const idx = ea.privateActions.findIndex((pa) => pa.id === initActionId);
          if (idx !== -1) ea.privateActions.splice(idx, 1);
        }
      }
    }));
  }
}

export class RemoveInitActionCommand extends BaseCommand {
  private removedAction: InitPrivateAction | null = null;
  private removedIndex = -1;
  private parentEntityName: string | null = null;
  private readonly actionId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(actionId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Remove init action: ${actionId}`);
    this.actionId = actionId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const found = findInitActionById(doc, this.actionId);
    if (found) {
      this.removedAction = found.initAction;
      this.removedIndex = found.actionIndex;
      this.parentEntityName = found.entityActions.entityRef;
    }
    this.setDoc(produce(doc, (draft) => {
      if (this.parentEntityName) {
        const ea = findEntityInitActions(draft, this.parentEntityName);
        if (ea && this.removedIndex !== -1) {
          ea.privateActions.splice(this.removedIndex, 1);
        }
      }
    }));
  }

  undo(): void {
    if (!this.removedAction || !this.parentEntityName || this.removedIndex === -1) return;
    const action = this.removedAction;
    const entityName = this.parentEntityName;
    const idx = this.removedIndex;
    this.setDoc(produce(this.getDoc(), (draft) => {
      const ea = findEntityInitActions(draft, entityName);
      if (ea) ea.privateActions.splice(idx, 0, action);
    }));
  }
}

export class SetInitPositionCommand extends BaseCommand {
  private readonly entityName: string;
  private readonly position: Position;
  private previousState: { hadEntityActions: boolean; previousActions: InitPrivateAction[] } | null = null;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(entityName: string, position: Position, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Set init position for: ${entityName}`);
    this.entityName = entityName;
    this.position = position;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const ea = findEntityInitActions(doc, this.entityName);

    this.previousState = {
      hadEntityActions: !!ea,
      previousActions: ea ? [...ea.privateActions] : [],
    };

    this.setDoc(produce(doc, (draft) => {
      let draftEa = findEntityInitActions(draft, this.entityName);
      if (!draftEa) {
        draftEa = createEntityInitActions(this.entityName);
        draft.storyboard.init.entityActions.push(draftEa);
      }
      // Remove existing teleport actions
      draftEa.privateActions = draftEa.privateActions.filter(
        (pa) => pa.action.type !== 'teleportAction',
      );
      // Add new teleport action
      draftEa.privateActions.push(createInitPrivateAction({
        type: 'teleportAction',
        position: this.position,
      }));
    }));
  }

  undo(): void {
    if (!this.previousState) return;
    const prevState = this.previousState;
    const entityName = this.entityName;

    this.setDoc(produce(this.getDoc(), (draft) => {
      if (!prevState.hadEntityActions) {
        const idx = findEntityInitActionsIndex(draft, entityName);
        if (idx !== -1) draft.storyboard.init.entityActions.splice(idx, 1);
      } else {
        const ea = findEntityInitActions(draft, entityName);
        if (ea) ea.privateActions = prevState.previousActions;
      }
    }));
  }
}

export class SetInitSpeedCommand extends BaseCommand {
  private readonly entityName: string;
  private readonly speed: number;
  private previousState: { hadEntityActions: boolean; previousActions: InitPrivateAction[] } | null = null;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(entityName: string, speed: number, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Set init speed for: ${entityName}`);
    this.entityName = entityName;
    this.speed = speed;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const ea = findEntityInitActions(doc, this.entityName);

    this.previousState = {
      hadEntityActions: !!ea,
      previousActions: ea ? [...ea.privateActions] : [],
    };

    this.setDoc(produce(doc, (draft) => {
      let draftEa = findEntityInitActions(draft, this.entityName);
      if (!draftEa) {
        draftEa = createEntityInitActions(this.entityName);
        draft.storyboard.init.entityActions.push(draftEa);
      }
      // Remove existing speed actions
      draftEa.privateActions = draftEa.privateActions.filter(
        (pa) => pa.action.type !== 'speedAction',
      );
      // Add new speed action
      draftEa.privateActions.push(createInitPrivateAction({
        type: 'speedAction',
        dynamics: { dynamicsShape: 'step', dynamicsDimension: 'time', value: 0 },
        target: { kind: 'absolute', value: this.speed },
      }));
    }));
  }

  undo(): void {
    if (!this.previousState) return;
    const prevState = this.previousState;
    const entityName = this.entityName;

    this.setDoc(produce(this.getDoc(), (draft) => {
      if (!prevState.hadEntityActions) {
        const idx = findEntityInitActionsIndex(draft, entityName);
        if (idx !== -1) draft.storyboard.init.entityActions.splice(idx, 1);
      } else {
        const ea = findEntityInitActions(draft, entityName);
        if (ea) ea.privateActions = prevState.previousActions;
      }
    }));
  }
}
