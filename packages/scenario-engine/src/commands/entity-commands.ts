/**
 * Commands for entity CRUD operations.
 */

import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import type { ScenarioDocument, ScenarioEntity, EntityInitActions } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createEntityFromPartial, createEntityInitActions } from '../store/defaults.js';
import { findEntityIndex } from '../operations/entity-operations.js';
import { deepCloneWithNewIds } from '../operations/deep-clone.js';
import {
  deepReplaceEntityRef,
  deepRemoveEntityRef,
} from '../operations/entity-rename-utils.js';

/**
 * Generate a unique entity name based on `baseName`, appending `_copy`,
 * then `_copy2`, `_copy3`, ... until it no longer collides with any
 * existing entity name in the document.
 */
function uniqueEntityCopyName(existingNames: readonly string[], baseName: string): string {
  const taken = new Set(existingNames);
  let candidate = `${baseName}_copy`;
  let counter = 2;
  while (taken.has(candidate)) {
    candidate = `${baseName}_copy${counter}`;
    counter += 1;
  }
  return candidate;
}

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

/**
 * Duplicate an entity together with its Init EntityInitActions as a single
 * undoable step. The clone receives a fresh id, a unique name
 * (e.g. `Name_copy`, `Name_copy2`), regenerated nested parameter ids, and a
 * deep copy of the source entity's init actions with new ids whose
 * `entityRef` points at the clone's name. References from OTHER elements to
 * the source entity are intentionally NOT remapped.
 */
export class DuplicateEntityCommand extends BaseCommand {
  private clonedEntity: ScenarioEntity | null = null;
  private clonedInitActions: EntityInitActions | null = null;
  private readonly sourceEntityId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(sourceEntityId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Duplicate entity: ${sourceEntityId}`);
    this.sourceEntityId = sourceEntityId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();

    // Reuse the previously built clone on redo so ids stay stable.
    if (this.clonedEntity) {
      const entity = this.clonedEntity;
      const initActions = this.clonedInitActions;
      this.setDoc(produce(doc, (draft) => {
        draft.entities.push(entity);
        if (initActions) draft.storyboard.init.entityActions.push(initActions);
      }));
      return;
    }

    const sourceIdx = findEntityIndex(doc, this.sourceEntityId);
    if (sourceIdx === -1) return;

    const source = doc.entities[sourceIdx];
    const newName = uniqueEntityCopyName(
      doc.entities.map((e) => e.name),
      source.name,
    );

    const clone = deepCloneWithNewIds(source, 'entity');
    clone.name = newName;
    // Keep the embedded definition name aligned with the entity name.
    const definition = clone.definition as { name?: string };
    if (typeof definition.name === 'string') {
      definition.name = newName;
    }
    this.clonedEntity = clone;

    // Clone the source entity's init actions (if any) and retarget entityRef.
    const sourceInit = doc.storyboard.init.entityActions.find(
      (ea) => ea.entityRef === source.name,
    );
    if (sourceInit) {
      const clonedInit = structuredClone(sourceInit);
      clonedInit.id = uuidv4();
      clonedInit.entityRef = newName;
      for (const pa of clonedInit.privateActions) {
        pa.id = uuidv4();
      }
      this.clonedInitActions = clonedInit;
    } else {
      // Match AddEntityCommand: every entity gets an EntityInitActions entry.
      this.clonedInitActions = createEntityInitActions(newName);
    }

    const entity = this.clonedEntity;
    const initActions = this.clonedInitActions;
    this.setDoc(produce(doc, (draft) => {
      draft.entities.push(entity);
      if (initActions) draft.storyboard.init.entityActions.push(initActions);
    }));
  }

  undo(): void {
    if (!this.clonedEntity) return;
    const entityId = this.clonedEntity.id;
    const initId = this.clonedInitActions?.id;
    this.setDoc(produce(this.getDoc(), (draft) => {
      const idx = findEntityIndex(draft, entityId);
      if (idx !== -1) draft.entities.splice(idx, 1);
      if (initId) {
        const eaIdx = draft.storyboard.init.entityActions.findIndex((ea) => ea.id === initId);
        if (eaIdx !== -1) draft.storyboard.init.entityActions.splice(eaIdx, 1);
      }
    }));
  }

  getClonedEntity(): ScenarioEntity | null {
    return this.clonedEntity;
  }
}
