/**
 * Commands for entity CRUD operations.
 */

import { produce } from 'immer';
import type { ScenarioDocument, ScenarioEntity } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createEntityFromPartial, createEntityInitActions } from '../store/defaults.js';
import { findEntityIndex } from '../operations/entity-operations.js';
import {
  deepReplaceEntityRef,
  deepRemoveEntityRef,
} from '../operations/entity-rename-utils.js';

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

export interface EntityCleanupOption {
  action: 'replace' | 'remove';
  replacementName?: string;
}

export class RemoveEntityCommand extends BaseCommand {
  private oldDoc: ScenarioDocument | null = null;
  private readonly entityId: string;
  private readonly cleanupOption?: EntityCleanupOption;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(
    entityId: string,
    getDoc: GetDoc,
    setDoc: SetDoc,
    cleanupOption?: EntityCleanupOption,
  ) {
    super(`Remove entity: ${entityId}`);
    this.entityId = entityId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.cleanupOption = cleanupOption;
  }

  execute(): void {
    const doc = this.getDoc();
    const entityIdx = findEntityIndex(doc, this.entityId);
    if (entityIdx === -1) return;

    const entityName = doc.entities[entityIdx].name;

    // Full doc backup for undo (cleanup modifies storyboard broadly)
    this.oldDoc = structuredClone(doc);

    this.setDoc(produce(doc, (draft) => {
      // 1. Remove entity
      draft.entities.splice(entityIdx, 1);

      // 2. Remove init.entityActions
      const eaIdx = draft.storyboard.init.entityActions.findIndex(
        (ea) => ea.entityRef === entityName,
      );
      if (eaIdx !== -1) {
        draft.storyboard.init.entityActions.splice(eaIdx, 1);
      }

      // 3. Clean up entityRef references based on cleanup option
      if (this.cleanupOption?.action === 'replace' && this.cleanupOption.replacementName) {
        deepReplaceEntityRef(draft.storyboard, entityName, this.cleanupOption.replacementName);
      } else if (this.cleanupOption?.action === 'remove') {
        deepRemoveEntityRef(draft.storyboard, entityName);
      }
    }));
  }

  undo(): void {
    if (this.oldDoc) this.setDoc(this.oldDoc);
  }
}

export class UpdateEntityCommand extends BaseCommand {
  private previousEntity: ScenarioEntity | null = null;
  private oldDoc: ScenarioDocument | null = null;
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
    const oldName = doc.entities[idx].name;
    const isRename = !!(this.updates.name && this.updates.name !== oldName);

    // Full doc backup for rename (deep replace affects entire storyboard)
    if (isRename) {
      this.oldDoc = structuredClone(doc);
    }

    this.setDoc(produce(doc, (draft) => {
      Object.assign(draft.entities[idx], this.updates);
      // Deep-replace all entityRef fields across storyboard on rename
      if (isRename) {
        deepReplaceEntityRef(draft.storyboard, oldName, this.updates.name!);
      }
    }));
  }

  undo(): void {
    // Full restore for rename operations
    if (this.oldDoc) {
      this.setDoc(this.oldDoc);
      return;
    }
    // Simple restore for non-rename updates
    if (!this.previousEntity) return;
    const prev = this.previousEntity;
    this.setDoc(produce(this.getDoc(), (draft) => {
      const idx = findEntityIndex(draft, this.entityId);
      if (idx !== -1) draft.entities[idx] = prev;
    }));
  }
}
