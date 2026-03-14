/**
 * Commands for road CRUD operations.
 */

import { produce } from 'immer';
import type { OpenDriveDocument, OdrRoad, OdrRoadLinkElement } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import { createRoadFromPartial } from '../builders/road-builder.js';
import { findRoadIndex } from '../operations/road-operations.js';

export type GetDoc = () => OpenDriveDocument;
export type SetDoc = (doc: OpenDriveDocument) => void;
export type MarkDirtyRoad = (roadId: string) => void;

export class AddRoadCommand extends BaseCommand {
  private readonly road: OdrRoad;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(
    partial: Partial<OdrRoad>,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyRoad,
  ) {
    super(`Add road: ${partial.name ?? partial.id ?? 'unnamed'}`);
    this.road = createRoadFromPartial(partial, undefined, getDoc());
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  execute(): void {
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        draft.roads.push(this.road);
      }),
    );
    this.markDirty(this.road.id);
  }

  undo(): void {
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const idx = findRoadIndex(draft, this.road.id);
        if (idx !== -1) draft.roads.splice(idx, 1);
      }),
    );
    this.markDirty(this.road.id);
  }

  getCreatedRoad(): OdrRoad {
    return this.road;
  }
}

/** Back-link that was cleared during road removal, saved for undo. */
interface ClearedLink {
  roadId: string;
  linkType: 'predecessor' | 'successor';
  element: OdrRoadLinkElement;
}

export class RemoveRoadCommand extends BaseCommand {
  private removedRoad: OdrRoad | null = null;
  private removedIndex = -1;
  private clearedLinks: ClearedLink[] = [];
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

  execute(): void {
    const doc = this.getDoc();
    this.removedIndex = findRoadIndex(doc, this.roadId);
    if (this.removedIndex !== -1) {
      this.removedRoad = structuredClone(doc.roads[this.removedIndex]);
    }

    // Collect back-links: other roads referencing the deleted road
    this.clearedLinks = [];
    for (const road of doc.roads) {
      if (road.id === this.roadId) continue;
      if (road.link?.predecessor?.elementId === this.roadId) {
        this.clearedLinks.push({
          roadId: road.id,
          linkType: 'predecessor',
          element: structuredClone(road.link.predecessor),
        });
      }
      if (road.link?.successor?.elementId === this.roadId) {
        this.clearedLinks.push({
          roadId: road.id,
          linkType: 'successor',
          element: structuredClone(road.link.successor),
        });
      }
    }

    this.setDoc(
      produce(doc, (draft) => {
        // Clear back-links from other roads
        for (const cleared of this.clearedLinks) {
          const otherIdx = findRoadIndex(draft, cleared.roadId);
          if (otherIdx !== -1 && draft.roads[otherIdx].link) {
            delete draft.roads[otherIdx].link![cleared.linkType];
          }
        }
        // Remove the road itself
        if (this.removedIndex !== -1) draft.roads.splice(this.removedIndex, 1);
      }),
    );

    this.markDirty(this.roadId);
    for (const cleared of this.clearedLinks) {
      this.markDirty(cleared.roadId);
    }
  }

  undo(): void {
    if (!this.removedRoad || this.removedIndex === -1) return;
    const road = this.removedRoad;
    const idx = this.removedIndex;
    const cleared = this.clearedLinks;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        // Restore the removed road
        draft.roads.splice(idx, 0, road);
        // Restore back-links on other roads
        for (const cl of cleared) {
          const otherIdx = findRoadIndex(draft, cl.roadId);
          if (otherIdx !== -1) {
            if (!draft.roads[otherIdx].link) {
              draft.roads[otherIdx].link = {};
            }
            draft.roads[otherIdx].link![cl.linkType] = structuredClone(cl.element);
          }
        }
      }),
    );
    this.markDirty(this.roadId);
    for (const cl of cleared) {
      this.markDirty(cl.roadId);
    }
  }
}

export class UpdateRoadCommand extends BaseCommand {
  private previousRoad: OdrRoad | null = null;
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

  execute(): void {
    const doc = this.getDoc();
    const idx = findRoadIndex(doc, this.roadId);
    if (idx === -1) return;
    this.previousRoad = structuredClone(doc.roads[idx]);
    this.setDoc(
      produce(doc, (draft) => {
        Object.assign(draft.roads[idx], this.updates);
      }),
    );
    this.markDirty(this.roadId);
  }

  undo(): void {
    if (!this.previousRoad) return;
    const prev = this.previousRoad;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const idx = findRoadIndex(draft, this.roadId);
        if (idx !== -1) draft.roads[idx] = prev;
      }),
    );
    this.markDirty(this.roadId);
  }
}
