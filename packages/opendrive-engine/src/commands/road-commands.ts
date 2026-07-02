/**
 * Commands for road CRUD operations.
 */

import type { OpenDriveDocument, OdrRoad } from '@osce/shared';
import { PatchCommand } from './patch-command.js';
import { createRoadFromPartial } from '../builders/road-builder.js';
import { findRoadIndex } from '../operations/road-operations.js';

export type GetDoc = () => OpenDriveDocument;
export type SetDoc = (doc: OpenDriveDocument) => void;
export type MarkDirtyRoad = (roadId: string) => void;

export class AddRoadCommand extends PatchCommand {
  private readonly road: OdrRoad;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(partial: Partial<OdrRoad>, getDoc: GetDoc, setDoc: SetDoc, markDirty: MarkDirtyRoad) {
    super(`Add road: ${partial.name ?? partial.id ?? 'unnamed'}`);
    this.road = createRoadFromPartial(partial, undefined, getDoc());
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      draft.roads.push(this.road);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.road.id);
  }

  getCreatedRoad(): OdrRoad {
    return this.road;
  }
}

/** Back-link that was cleared during road removal, saved for dirty tracking. */
interface ClearedLink {
  roadId: string;
  linkType: 'predecessor' | 'successor';
}

export class RemoveRoadCommand extends PatchCommand {
  private clearedRoadIds: string[] = [];
  private readonly roadId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(roadId: string, getDoc: GetDoc, setDoc: SetDoc, markDirty: MarkDirtyRoad) {
    super(`Remove road: ${roadId}`);
    this.roadId = roadId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  apply(): void {
    const doc = this.getDoc();

    // Collect back-links: other roads referencing the deleted road.
    const cleared: ClearedLink[] = [];
    for (const road of doc.roads) {
      if (road.id === this.roadId) continue;
      if (road.link?.predecessor?.elementId === this.roadId) {
        cleared.push({ roadId: road.id, linkType: 'predecessor' });
      }
      if (road.link?.successor?.elementId === this.roadId) {
        cleared.push({ roadId: road.id, linkType: 'successor' });
      }
    }
    this.clearedRoadIds = cleared.map((c) => c.roadId);

    this.mutate(this.getDoc, this.setDoc, (draft) => {
      // Clear back-links from other roads.
      for (const cl of cleared) {
        const otherIdx = findRoadIndex(draft, cl.roadId);
        if (otherIdx !== -1 && draft.roads[otherIdx].link) {
          delete draft.roads[otherIdx].link![cl.linkType];
        }
      }
      // Remove the road itself.
      const idx = findRoadIndex(draft, this.roadId);
      if (idx !== -1) draft.roads.splice(idx, 1);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.roadId);
    for (const roadId of this.clearedRoadIds) {
      this.markDirty(roadId);
    }
  }
}

export class UpdateRoadCommand extends PatchCommand {
  private readonly roadId: string;
  private readonly updates: Partial<OdrRoad>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(
    roadId: string,
    updates: Partial<OdrRoad>,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyRoad,
  ) {
    super(`Update road: ${roadId}`);
    this.roadId = roadId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const idx = findRoadIndex(draft, this.roadId);
      if (idx === -1) return;
      Object.assign(draft.roads[idx], this.updates);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.roadId);
  }
}
