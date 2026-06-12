/**
 * Commands for road object CRUD operations.
 * Objects belong to a road, so all commands require a roadId.
 */

import { produce } from 'immer';
import type { OdrRoadObject } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import type { GetDoc, SetDoc, MarkDirtyRoad } from './road-commands.js';
import { findRoadIndex } from '../operations/road-operations.js';
import { nextNumericId } from '../utils/id-generator.js';

export class AddObjectCommand extends BaseCommand {
  private readonly roadId: string;
  private readonly object: OdrRoadObject;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(
    roadId: string,
    partial: Partial<OdrRoadObject>,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyRoad,
  ) {
    const allObjectIds = getDoc().roads.flatMap((r) => r.objects.map((o) => o.id));
    const id = partial.id ?? nextNumericId(allObjectIds);
    super(`Add object ${id} to road ${roadId}`);
    this.roadId = roadId;
    this.object = {
      s: 0,
      t: 0,
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
        draft.roads[roadIdx].objects.push(this.object);
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
        const idx = draft.roads[roadIdx].objects.findIndex((o) => o.id === this.object.id);
        if (idx !== -1) draft.roads[roadIdx].objects.splice(idx, 1);
      }),
    );
    this.markDirty(this.roadId);
  }

  getCreatedObject(): OdrRoadObject {
    return this.object;
  }
}

export class RemoveObjectCommand extends BaseCommand {
  private removedObject: OdrRoadObject | null = null;
  private removedIndex = -1;
  private readonly roadId: string;
  private readonly objectId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(
    roadId: string,
    objectId: string,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyRoad,
  ) {
    super(`Remove object ${objectId} from road ${roadId}`);
    this.roadId = roadId;
    this.objectId = objectId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  execute(): void {
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;

    this.removedIndex = doc.roads[roadIdx].objects.findIndex((o) => o.id === this.objectId);
    if (this.removedIndex !== -1) {
      this.removedObject = structuredClone(doc.roads[roadIdx].objects[this.removedIndex]);
    }

    this.setDoc(
      produce(doc, (draft) => {
        if (this.removedIndex !== -1) {
          draft.roads[roadIdx].objects.splice(this.removedIndex, 1);
        }
      }),
    );
    this.markDirty(this.roadId);
  }

  undo(): void {
    if (!this.removedObject || this.removedIndex === -1) return;
    const object = this.removedObject;
    const idx = this.removedIndex;
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;

    this.setDoc(
      produce(doc, (draft) => {
        draft.roads[roadIdx].objects.splice(idx, 0, object);
      }),
    );
    this.markDirty(this.roadId);
  }
}
