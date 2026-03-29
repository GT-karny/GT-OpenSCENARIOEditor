/**
 * Commands for variable CRUD operations.
 */

import { produce } from 'immer';
import type { ScenarioDocument, VariableDeclaration } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createVariableFromPartial } from '../store/defaults.js';
import { findVariableById, findVariableIndex } from '../operations/variable-operations.js';
import {
  deepReplaceParamRef,
  deepReplaceDirectRef,
  replaceInBindings,
} from '../operations/parameter-rename-utils.js';

export type GetDoc = () => ScenarioDocument;
export type SetDoc = (doc: ScenarioDocument) => void;

export class AddVariableCommand extends BaseCommand {
  private readonly variable: VariableDeclaration;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(partial: Partial<VariableDeclaration>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Add variable: ${partial.name ?? 'unnamed'}`);
    this.variable = createVariableFromPartial(partial);
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      draft.variableDeclarations.push(this.variable);
    }));
  }

  undo(): void {
    this.setDoc(produce(this.getDoc(), (draft) => {
      const idx = findVariableIndex(draft, this.variable.id);
      if (idx !== -1) draft.variableDeclarations.splice(idx, 1);
    }));
  }

  getCreatedVariable(): VariableDeclaration {
    return this.variable;
  }
}

export class RemoveVariableCommand extends BaseCommand {
  private removedVariable: VariableDeclaration | null = null;
  private removedIndex = -1;
  private readonly varId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(varId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Remove variable: ${varId}`);
    this.varId = varId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    this.removedIndex = findVariableIndex(doc, this.varId);
    if (this.removedIndex !== -1) {
      this.removedVariable = doc.variableDeclarations[this.removedIndex];
    }
    this.setDoc(produce(doc, (draft) => {
      if (this.removedIndex !== -1) draft.variableDeclarations.splice(this.removedIndex, 1);
    }));
  }

  undo(): void {
    if (!this.removedVariable || this.removedIndex === -1) return;
    const variable = this.removedVariable;
    const idx = this.removedIndex;
    this.setDoc(produce(this.getDoc(), (draft) => {
      draft.variableDeclarations.splice(idx, 0, variable);
    }));
  }
}

export class UpdateVariableCommand extends BaseCommand {
  private previousVariable: VariableDeclaration | null = null;
  private readonly varId: string;
  private readonly updates: Partial<VariableDeclaration>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(varId: string, updates: Partial<VariableDeclaration>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Update variable: ${varId}`);
    this.varId = varId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const idx = findVariableIndex(doc, this.varId);
    if (idx === -1) return;
    this.previousVariable = structuredClone(doc.variableDeclarations[idx]);
    this.setDoc(produce(doc, (draft) => {
      Object.assign(draft.variableDeclarations[idx], this.updates);
    }));
  }

  undo(): void {
    if (!this.previousVariable) return;
    const prev = this.previousVariable;
    this.setDoc(produce(this.getDoc(), (draft) => {
      const idx = findVariableIndex(draft, this.varId);
      if (idx !== -1) draft.variableDeclarations[idx] = prev;
    }));
  }
}

export class RenameVariableCommand extends BaseCommand {
  private oldDoc: ScenarioDocument | null = null;
  private readonly varId: string;
  private readonly newName: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(varId: string, newName: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Rename variable: ${newName}`);
    this.varId = varId;
    this.newName = newName;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const variable = findVariableById(doc, this.varId);
    if (!variable) return;

    const oldName = variable.name;
    this.oldDoc = structuredClone(doc);

    this.setDoc(produce(doc, (draft) => {
      // 1. Rename the declaration
      const idx = findVariableIndex(draft, this.varId);
      if (idx !== -1) draft.variableDeclarations[idx].name = this.newName;

      // 2. Update all bindings values (shared parameterBindings map)
      replaceInBindings(draft._editor.parameterBindings, oldName, this.newName);

      // 3. Deep-replace $VarName in all string values throughout the document
      deepReplaceParamRef(draft, oldName, this.newName);

      // 4. Replace direct variableRef fields (e.g., VariableAction, VariableCondition)
      deepReplaceDirectRef(draft, 'variableRef', oldName, this.newName);
    }));
  }

  undo(): void {
    if (this.oldDoc) this.setDoc(this.oldDoc);
  }
}
