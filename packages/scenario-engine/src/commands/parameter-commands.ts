/**
 * Commands for parameter CRUD operations.
 */

import { produce } from 'immer';
import type { ScenarioDocument, ParameterDeclaration } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createParameterFromPartial } from '../store/defaults.js';
import { findParameterById, findParameterIndex } from '../operations/parameter-operations.js';
import { deepReplaceParamRef, replaceInBindings } from '../operations/parameter-rename-utils.js';

export type GetDoc = () => ScenarioDocument;
export type SetDoc = (doc: ScenarioDocument) => void;

export class AddParameterCommand extends BaseCommand {
  private readonly param: ParameterDeclaration;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(partial: Partial<ParameterDeclaration>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Add parameter: ${partial.name ?? 'unnamed'}`);
    this.param = createParameterFromPartial(partial);
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      draft.parameterDeclarations.push(this.param);
    }));
  }

  undo(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const idx = findParameterIndex(draft, this.param.id);
      if (idx !== -1) draft.parameterDeclarations.splice(idx, 1);
    }));
  }

  getCreatedParameter(): ParameterDeclaration {
    return this.param;
  }
}

export class RemoveParameterCommand extends BaseCommand {
  private removedParam: ParameterDeclaration | null = null;
  private removedIndex = -1;
  private readonly paramId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(paramId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Remove parameter: ${paramId}`);
    this.paramId = paramId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    this.removedIndex = findParameterIndex(doc, this.paramId);
    if (this.removedIndex !== -1) {
      this.removedParam = doc.parameterDeclarations[this.removedIndex];
    }
    this.setDoc(produce(doc, (draft) => {
      if (this.removedIndex !== -1) draft.parameterDeclarations.splice(this.removedIndex, 1);
    }));
  }

  undo(): void {
    if (!this.removedParam || this.removedIndex === -1) return;
    const param = this.removedParam;
    const idx = this.removedIndex;
    this.setDoc(produce(this.getDoc(), (draft) => {
      draft.parameterDeclarations.splice(idx, 0, param);
    }));
  }
}

export class UpdateParameterCommand extends BaseCommand {
  private previousParam: ParameterDeclaration | null = null;
  private readonly paramId: string;
  private readonly updates: Partial<ParameterDeclaration>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(paramId: string, updates: Partial<ParameterDeclaration>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Update parameter: ${paramId}`);
    this.paramId = paramId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const idx = findParameterIndex(doc, this.paramId);
    if (idx === -1) return;
    this.previousParam = structuredClone(doc.parameterDeclarations[idx]);
    this.setDoc(produce(doc, (draft) => {
      Object.assign(draft.parameterDeclarations[idx], this.updates);
    }));
  }

  undo(): void {
    if (!this.previousParam) return;
    const prev = this.previousParam;
    this.setDoc(produce(this.getDoc(), (draft) => {
      const idx = findParameterIndex(draft, this.paramId);
      if (idx !== -1) draft.parameterDeclarations[idx] = prev;
    }));
  }
}

export class RenameParameterCommand extends BaseCommand {
  private oldDoc: ScenarioDocument | null = null;
  private readonly paramId: string;
  private readonly newName: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(paramId: string, newName: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Rename parameter: ${newName}`);
    this.paramId = paramId;
    this.newName = newName;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const param = findParameterById(doc, this.paramId);
    if (!param) return;

    const oldName = param.name;
    this.oldDoc = structuredClone(doc);

    this.setDoc(produce(doc, (draft) => {
      // 1. Rename the declaration
      const idx = findParameterIndex(draft, this.paramId);
      if (idx !== -1) draft.parameterDeclarations[idx].name = this.newName;

      // 2. Update all bindings values
      replaceInBindings(draft._editor.parameterBindings, oldName, this.newName);

      // 3. Deep-replace in all string values throughout the document
      deepReplaceParamRef(draft, oldName, this.newName);
    }));
  }

  undo(): void {
    if (this.oldDoc) this.setDoc(this.oldDoc);
  }
}

export class SetParameterBindingCommand extends BaseCommand {
  private previousValue: string | undefined;
  private readonly elementId: string;
  private readonly fieldName: string;
  private readonly paramRef: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(elementId: string, fieldName: string, paramRef: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Bind ${fieldName} to ${paramRef}`);
    this.elementId = elementId;
    this.fieldName = fieldName;
    this.paramRef = paramRef;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    this.previousValue = doc._editor.parameterBindings[this.elementId]?.[this.fieldName];
    this.setDoc(produce(doc, (draft) => {
      if (!draft._editor.parameterBindings[this.elementId]) {
        draft._editor.parameterBindings[this.elementId] = {};
      }
      draft._editor.parameterBindings[this.elementId][this.fieldName] = this.paramRef;
    }));
  }

  undo(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      if (this.previousValue !== undefined) {
        draft._editor.parameterBindings[this.elementId][this.fieldName] = this.previousValue;
      } else {
        delete draft._editor.parameterBindings[this.elementId]?.[this.fieldName];
        // Clean up empty element entry
        if (draft._editor.parameterBindings[this.elementId] &&
            Object.keys(draft._editor.parameterBindings[this.elementId]).length === 0) {
          delete draft._editor.parameterBindings[this.elementId];
        }
      }
    }));
  }
}

export class RemoveParameterBindingCommand extends BaseCommand {
  private previousValue: string | undefined;
  private readonly elementId: string;
  private readonly fieldName: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(elementId: string, fieldName: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Unbind ${fieldName}`);
    this.elementId = elementId;
    this.fieldName = fieldName;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    this.previousValue = doc._editor.parameterBindings[this.elementId]?.[this.fieldName];
    this.setDoc(produce(doc, (draft) => {
      delete draft._editor.parameterBindings[this.elementId]?.[this.fieldName];
      // Clean up empty element entry
      if (draft._editor.parameterBindings[this.elementId] &&
          Object.keys(draft._editor.parameterBindings[this.elementId]).length === 0) {
        delete draft._editor.parameterBindings[this.elementId];
      }
    }));
  }

  undo(): void {
    if (this.previousValue === undefined) return;
    const val = this.previousValue;
    this.setDoc(produce(this.getDoc(), (draft) => {
      if (!draft._editor.parameterBindings[this.elementId]) {
        draft._editor.parameterBindings[this.elementId] = {};
      }
      draft._editor.parameterBindings[this.elementId][this.fieldName] = val;
    }));
  }
}
