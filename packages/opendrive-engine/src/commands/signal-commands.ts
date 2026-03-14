/**
 * Commands for signal CRUD operations.
 * Signals belong to a road, so all commands require a roadId.
 */

import { produce } from 'immer';
import type { OdrSignal } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import type { GetDoc, SetDoc, MarkDirtyRoad } from './road-commands.js';
import { findRoadIndex } from '../operations/road-operations.js';
import { createSignalFromDefaults } from '../store/defaults.js';
import { nextNumericId } from '../utils/id-generator.js';

export class AddSignalCommand extends BaseCommand {
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

  execute(): void {
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;

    this.setDoc(
      produce(doc, (draft) => {
        draft.roads[roadIdx].signals.push(this.signal);
      }),
    );
    this.markDirty(this.roadId);
  }

  undo(): void {
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;

    this.setDoc(
      produce(doc, (draft) => {
        const idx = draft.roads[roadIdx].signals.findIndex((s) => s.id === this.signal.id);
        if (idx !== -1) draft.roads[roadIdx].signals.splice(idx, 1);
      }),
    );
    this.markDirty(this.roadId);
  }

  getCreatedSignal(): OdrSignal {
    return this.signal;
  }
}

export class RemoveSignalCommand extends BaseCommand {
  private removedSignal: OdrSignal | null = null;
  private removedIndex = -1;
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

  execute(): void {
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;

    this.removedIndex = doc.roads[roadIdx].signals.findIndex((s) => s.id === this.signalId);
    if (this.removedIndex !== -1) {
      this.removedSignal = structuredClone(doc.roads[roadIdx].signals[this.removedIndex]);
    }

    this.setDoc(
      produce(doc, (draft) => {
        if (this.removedIndex !== -1) {
          draft.roads[roadIdx].signals.splice(this.removedIndex, 1);
        }
      }),
    );
    this.markDirty(this.roadId);
  }

  undo(): void {
    if (!this.removedSignal || this.removedIndex === -1) return;
    const signal = this.removedSignal;
    const idx = this.removedIndex;
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;

    this.setDoc(
      produce(doc, (draft) => {
        draft.roads[roadIdx].signals.splice(idx, 0, signal);
      }),
    );
    this.markDirty(this.roadId);
  }
}

export class UpdateSignalCommand extends BaseCommand {
  private previousSignal: OdrSignal | null = null;
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

  execute(): void {
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;

    const signal = doc.roads[roadIdx].signals.find((s) => s.id === this.signalId);
    if (!signal) return;

    this.previousSignal = structuredClone(signal);

    this.setDoc(
      produce(doc, (draft) => {
        const draftSignal = draft.roads[roadIdx].signals.find((s) => s.id === this.signalId);
        if (draftSignal) Object.assign(draftSignal, this.updates);
      }),
    );
    this.markDirty(this.roadId);
  }

  undo(): void {
    if (!this.previousSignal) return;
    const prev = this.previousSignal;
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;

    this.setDoc(
      produce(doc, (draft) => {
        const idx = draft.roads[roadIdx].signals.findIndex((s) => s.id === this.signalId);
        if (idx !== -1) draft.roads[roadIdx].signals[idx] = prev;
      }),
    );
    this.markDirty(this.roadId);
  }
}
