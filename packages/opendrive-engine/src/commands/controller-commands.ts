/**
 * Commands for controller CRUD operations.
 * Controllers are top-level elements in the OpenDRIVE document.
 */

import type { OpenDriveDocument, OdrController } from '@osce/shared';
import { PatchCommand } from './patch-command.js';
import type { GetDoc, SetDoc } from './road-commands.js';
import { nextNumericId } from '../utils/id-generator.js';
import { createControllerFromDefaults } from '../store/defaults.js';

export type MarkDirtyController = (controllerId: string) => void;

function findControllerIndex(doc: OpenDriveDocument, controllerId: string): number {
  return doc.controllers.findIndex((c) => c.id === controllerId);
}

export class AddControllerCommand extends PatchCommand {
  private readonly controller: OdrController;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyController;

  constructor(
    partial: Partial<OdrController>,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyController,
  ) {
    const id = partial.id ?? nextNumericId(getDoc().controllers.map((c) => c.id));
    super(`Add controller: ${partial.name ?? id}`);
    const controller = createControllerFromDefaults(id, partial.name ?? '');
    if (partial.sequence !== undefined) controller.sequence = partial.sequence;
    if (partial.controls) controller.controls = partial.controls;
    this.controller = controller;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      draft.controllers.push(this.controller);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.controller.id);
  }

  getCreatedController(): OdrController {
    return this.controller;
  }
}

export class RemoveControllerCommand extends PatchCommand {
  private readonly controllerId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyController;

  constructor(controllerId: string, getDoc: GetDoc, setDoc: SetDoc, markDirty: MarkDirtyController) {
    super(`Remove controller: ${controllerId}`);
    this.controllerId = controllerId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const idx = findControllerIndex(draft, this.controllerId);
      if (idx !== -1) draft.controllers.splice(idx, 1);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.controllerId);
  }
}

export class UpdateControllerCommand extends PatchCommand {
  private readonly controllerId: string;
  private readonly updates: Partial<OdrController>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyController;

  constructor(
    controllerId: string,
    updates: Partial<OdrController>,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyController,
  ) {
    super(`Update controller: ${controllerId}`);
    this.controllerId = controllerId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const idx = findControllerIndex(draft, this.controllerId);
      if (idx === -1) return;
      Object.assign(draft.controllers[idx], this.updates);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.controllerId);
  }
}
