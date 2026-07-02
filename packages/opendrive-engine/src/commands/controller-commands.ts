/**
 * Commands for controller CRUD operations.
 * Controllers are top-level elements in the OpenDRIVE document.
 */

import type { OpenDriveDocument, OdrController } from '@osce/shared';
import { PatchCommand } from './patch-command.js';
import type { GetDoc, SetDoc } from './road-commands.js';
import { nextNumericId } from '../utils/id-generator.js';
import { createControllerFromDefaults } from '../store/defaults.js';

function findControllerIndex(doc: OpenDriveDocument, controllerId: string): number {
  return doc.controllers.findIndex((c) => c.id === controllerId);
}

export class AddControllerCommand extends PatchCommand {
  private readonly controller: OdrController;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(partial: Partial<OdrController>, getDoc: GetDoc, setDoc: SetDoc) {
    const id = partial.id ?? nextNumericId(getDoc().controllers.map((c) => c.id));
    super(`Add controller: ${partial.name ?? id}`);
    const controller = createControllerFromDefaults(id, partial.name ?? '');
    if (partial.sequence !== undefined) controller.sequence = partial.sequence;
    if (partial.controls) controller.controls = partial.controls;
    this.controller = controller;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      draft.controllers.push(this.controller);
    });
  }

  getCreatedController(): OdrController {
    return this.controller;
  }
}

export class RemoveControllerCommand extends PatchCommand {
  private readonly controllerId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(controllerId: string, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Remove controller: ${controllerId}`);
    this.controllerId = controllerId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const idx = findControllerIndex(draft, this.controllerId);
      if (idx !== -1) draft.controllers.splice(idx, 1);
    });
  }
}

export class UpdateControllerCommand extends PatchCommand {
  private readonly controllerId: string;
  private readonly updates: Partial<OdrController>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;

  constructor(controllerId: string, updates: Partial<OdrController>, getDoc: GetDoc, setDoc: SetDoc) {
    super(`Update controller: ${controllerId}`);
    this.controllerId = controllerId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const idx = findControllerIndex(draft, this.controllerId);
      if (idx === -1) return;
      Object.assign(draft.controllers[idx], this.updates);
    });
  }
}
