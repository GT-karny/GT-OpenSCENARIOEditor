/**
 * Commands for signal CRUD operations.
 * Signals belong to a road, so all commands require a roadId.
 */

import type { OdrSignal } from '@osce/shared';
import { PatchCommand } from './patch-command.js';
import type { GetDoc, SetDoc, MarkDirtyRoad } from './road-commands.js';
import { findRoadIndex } from '../operations/road-operations.js';
import { createSignalFromDefaults } from '../store/defaults.js';
import { nextNumericId } from '../utils/id-generator.js';

export class AddSignalCommand extends PatchCommand {
  private readonly roadId: string;
  private readonly signal: OdrSignal;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(
    roadId: string,
    partial: Partial<OdrSignal>,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyRoad,
  ) {
    const allSignalIds = getDoc().roads.flatMap((r) => r.signals.map((s) => s.id));
    const id = partial.id ?? nextNumericId(allSignalIds);
    super(`Add signal ${id} to road ${roadId}`);
    this.roadId = roadId;
    this.signal = {
      ...createSignalFromDefaults(id),
      ...partial,
      id,
    };
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      draft.roads[roadIdx].signals.push(this.signal);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.roadId);
  }

  getCreatedSignal(): OdrSignal {
    return this.signal;
  }
}

export class RemoveSignalCommand extends PatchCommand {
  private readonly roadId: string;
  private readonly signalId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(
    roadId: string,
    signalId: string,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyRoad,
  ) {
    super(`Remove signal ${signalId} from road ${roadId}`);
    this.roadId = roadId;
    this.signalId = signalId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      const idx = draft.roads[roadIdx].signals.findIndex((s) => s.id === this.signalId);
      if (idx !== -1) draft.roads[roadIdx].signals.splice(idx, 1);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.roadId);
  }
}

export class UpdateSignalCommand extends PatchCommand {
  private readonly roadId: string;
  private readonly signalId: string;
  private readonly updates: Partial<OdrSignal>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(
    roadId: string,
    signalId: string,
    updates: Partial<OdrSignal>,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyRoad,
  ) {
    super(`Update signal ${signalId} on road ${roadId}`);
    this.roadId = roadId;
    this.signalId = signalId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      const draftSignal = draft.roads[roadIdx].signals.find((s) => s.id === this.signalId);
      if (draftSignal) Object.assign(draftSignal, this.updates);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.roadId);
  }
}
