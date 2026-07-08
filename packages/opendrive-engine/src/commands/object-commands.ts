/**
 * Commands for road object CRUD operations.
 * Objects belong to a road, so all commands require a roadId.
 */

import type { OdrRoadObject } from '@osce/shared';
import { PatchCommand } from './patch-command.js';
import type { GetDoc, SetDoc, MarkDirtyRoad } from './road-commands.js';
import { findRoadIndex } from '../operations/road-operations.js';
import { nextNumericId } from '../utils/id-generator.js';

export class AddObjectCommand extends PatchCommand {
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

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      draft.roads[roadIdx].objects.push(this.object);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.roadId);
  }

  getCreatedObject(): OdrRoadObject {
    return this.object;
  }
}

export class RemoveObjectCommand extends PatchCommand {
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

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      const idx = draft.roads[roadIdx].objects.findIndex((o) => o.id === this.objectId);
      if (idx !== -1) draft.roads[roadIdx].objects.splice(idx, 1);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.roadId);
  }
}
