/**
 * Commands for entity CRUD operations.
 */

import { produce } from 'immer';
import type { ScenarioDocument, ScenarioEntity } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createEntityFromPartial } from '../store/defaults.js';
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
    }));
  }

  undo(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const idx = findEntityIndex(draft, this.entity.id);
      if (idx !== -1) draft.entities.splice(idx, 1);
    }));
  }

  getCreatedEntity(): ScenarioEntity {
    return this.entity;
  }
}

export class RemoveEntityCommand extends BaseCommand {
  private removedEntity: ScenarioEntity | null = null;
  private removedIndex = -1;
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
    }
    this.setDoc(produce(doc, (draft) => {
      if (this.removedIndex !== -1) draft.entities.splice(this.removedIndex, 1);
    }));
  }

  undo(): void {
    if (!this.removedEntity || this.removedIndex === -1) return;
    const entity = this.removedEntity;
    const idx = this.removedIndex;
    this.setDoc(produce(this.getDoc(), (draft) => {
      draft.entities.splice(idx, 0, entity);
    }));
  }
}

export class UpdateEntityCommand extends BaseCommand {
  private previousEntity: ScenarioEntity | null = null;
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
      Object.assign(draft.entities[idx], this.updates);
    }));
  }

  undo(): void {
    if (!this.previousEntity) return;
    const prev = this.previousEntity;
    this.setDoc(produce(this.getDoc(), (draft) => {
      const idx = findEntityIndex(draft, this.entityId);
      if (idx !== -1) draft.entities[idx] = prev;
    }));
  }
}
