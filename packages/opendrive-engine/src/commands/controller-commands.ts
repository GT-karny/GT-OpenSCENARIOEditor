/**
 * Commands for controller CRUD operations.
 * Controllers are top-level elements in the OpenDRIVE document.
 */

import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import type { OpenDriveDocument, OdrController } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import type { GetDoc, SetDoc } from './road-commands.js';
import { createControllerFromDefaults } from '../store/defaults.js';

function findControllerIndex(doc: OpenDriveDocument, controllerId: string): number {
  return doc.controllers.findIndex((c) => c.id === controllerId);
}

export class AddControllerCommand extends BaseCommand {
  private readonly controller: OdrController;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(partial: Partial<OdrController>, getDoc: GetDoc, setDoc: SetDoc) {
    const id = partial.id ?? uuidv4();
    super(`Add controller: ${partial.name ?? id}`);
    const controller = createControllerFromDefaults(id, partial.name ?? '');
    if (partial.sequence !== undefined) controller.sequence = partial.sequence;
    if (partial.controls) controller.controls = partial.controls;
    this.controller = controller;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        draft.controllers.push(this.controller);
      }),
    );
  }

  undo(): void {
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const idx = findControllerIndex(draft, this.controller.id);
        if (idx !== -1) draft.controllers.splice(idx, 1);
      }),
    );
  }

  getCreatedController(): OdrController {
    return this.controller;
  }
}

export class RemoveControllerCommand extends BaseCommand {
  private removedController: OdrController | null = null;
  private removedIndex = -1;
  private readonly controllerId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(controllerId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Remove controller: ${controllerId}`);
    this.controllerId = controllerId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    this.removedIndex = findControllerIndex(doc, this.controllerId);
    if (this.removedIndex !== -1) {
      this.removedController = structuredClone(doc.controllers[this.removedIndex]);
    }
    this.setDoc(
      produce(doc, (draft) => {
        if (this.removedIndex !== -1) draft.controllers.splice(this.removedIndex, 1);
      }),
    );
  }

  undo(): void {
    if (!this.removedController || this.removedIndex === -1) return;
    const controller = this.removedController;
    const idx = this.removedIndex;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        draft.controllers.splice(idx, 0, controller);
      }),
    );
  }
}

export class UpdateControllerCommand extends BaseCommand {
  private previousController: OdrController | null = null;
  private readonly controllerId: string;
  private readonly updates: Partial<OdrController>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(
    controllerId: string,
    updates: Partial<OdrController>,
    getDoc: GetDoc,
    setDoc: SetDoc,
  ) {
    super(`Update controller: ${controllerId}`);
    this.controllerId = controllerId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  execute(): void {
    const doc = this.getDoc();
    const idx = findControllerIndex(doc, this.controllerId);
    if (idx === -1) return;
    this.previousController = structuredClone(doc.controllers[idx]);
    this.setDoc(
      produce(doc, (draft) => {
        Object.assign(draft.controllers[idx], this.updates);
      }),
    );
  }

  undo(): void {
    if (!this.previousController) return;
    const prev = this.previousController;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const idx = findControllerIndex(draft, this.controllerId);
        if (idx !== -1) draft.controllers[idx] = prev;
      }),
    );
  }
}
