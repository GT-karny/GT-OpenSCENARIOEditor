/**
 * Commands for entity CRUD operations.
 */

import { produce } from 'immer';
import type { ScenarioDocument, ScenarioEntity, EntityInitActions } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createEntityFromPartial, createEntityInitActions } from '../store/defaults.js';
import { findEntityIndex } from '../operations/entity-operations.js';

export type GetDoc = () => ScenarioDocument;
export type SetDoc = (doc: ScenarioDocument) => void;

export class AddEntityCommand extends BaseCommand {
  private readonly entity: ScenarioEntity;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(partial: Partial<ScenarioEntity>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Add entity: ${partial.name ?? 'unnamed'}`);
    this.entity = createEntityFromPartial(partial);
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      draft.entities.push(this.entity);
      // Auto-create empty EntityInitActions
      const existing = draft.storyboard.init.entityActions.find(
        (ea) => ea.entityRef === this.entity.name,
      );
      if (!existing) {
        draft.storyboard.init.entityActions.push(
          createEntityInitActions(this.entity.name),
        );
      }
    }));
  }

  undo(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const idx = findEntityIndex(draft, this.entity.id);
      if (idx !== -1) draft.entities.splice(idx, 1);
      // Also remove auto-created EntityInitActions
      const eaIdx = draft.storyboard.init.entityActions.findIndex(
        (ea) => ea.entityRef === this.entity.name,
      );
      if (eaIdx !== -1) draft.storyboard.init.entityActions.splice(eaIdx, 1);
    }));
  }

  getCreatedEntity(): ScenarioEntity {
    return this.entity;
  }
}

export class RemoveEntityCommand extends BaseCommand {
  private removedEntity: ScenarioEntity | null = null;
  private removedIndex = -1;
  private removedInitActions: EntityInitActions | null = null;
  private removedInitIndex = -1;
  private readonly entityId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(entityId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Remove entity: ${entityId}`);
    this.entityId = entityId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    this.removedIndex = findEntityIndex(doc, this.entityId);
    if (this.removedIndex !== -1) {
      this.removedEntity = doc.entities[this.removedIndex];
      // Save EntityInitActions for undo
      const eaIdx = doc.storyboard.init.entityActions.findIndex(
        (ea) => ea.entityRef === this.removedEntity!.name,
      );
      if (eaIdx !== -1) {
        this.removedInitActions = structuredClone(doc.storyboard.init.entityActions[eaIdx]);
        this.removedInitIndex = eaIdx;
      }
    }
    this.setDoc(produce(doc, (draft) => {
      if (this.removedIndex !== -1) draft.entities.splice(this.removedIndex, 1);
      if (this.removedInitIndex !== -1) {
        draft.storyboard.init.entityActions.splice(this.removedInitIndex, 1);
      }
    }));
  }

  undo(): void {
    if (!this.removedEntity || this.removedIndex === -1) return;
    const entity = this.removedEntity;
    const idx = this.removedIndex;
    const initActions = this.removedInitActions;
    const initIdx = this.removedInitIndex;
    this.setDoc(produce(this.getDoc(), (draft) => {
      draft.entities.splice(idx, 0, entity);
      if (initActions && initIdx !== -1) {
        draft.storyboard.init.entityActions.splice(initIdx, 0, initActions);
      }
    }));
  }
}

export class UpdateEntityCommand extends BaseCommand {
  private previousEntity: ScenarioEntity | null = null;
  private previousEntityRef: string | null = null;
  private readonly entityId: string;
  private readonly updates: Partial<ScenarioEntity>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(entityId: string, updates: Partial<ScenarioEntity>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Update entity: ${entityId}`);
    this.entityId = entityId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const idx = findEntityIndex(doc, this.entityId);
    if (idx === -1) return;
    this.previousEntity = structuredClone(doc.entities[idx]);
    this.setDoc(produce(doc, (draft) => {
      const oldName = draft.entities[idx].name;
      Object.assign(draft.entities[idx], this.updates);
      // Sync entityRef in init actions if name changed
      if (this.updates.name && this.updates.name !== oldName) {
        this.previousEntityRef = oldName;
        const ea = draft.storyboard.init.entityActions.find(
          (ea) => ea.entityRef === oldName,
        );
        if (ea) ea.entityRef = this.updates.name;
      }
    }));
  }

  undo(): void {
    if (!this.previousEntity) return;
    const prev = this.previousEntity;
    const prevRef = this.previousEntityRef;
    this.setDoc(produce(this.getDoc(), (draft) => {
      const idx = findEntityIndex(draft, this.entityId);
      if (idx !== -1) draft.entities[idx] = prev;
      // Restore previous entityRef if name was changed
      if (prevRef && this.updates.name) {
        const ea = draft.storyboard.init.entityActions.find(
          (ea) => ea.entityRef === this.updates.name,
        );
        if (ea) ea.entityRef = prevRef;
      }
    }));
  }
}
