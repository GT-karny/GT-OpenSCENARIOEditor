/**
 * Commands for road linking and splitting operations.
 */

import { current } from 'immer';
import { nextNumericId } from '../utils/id-generator.js';
import type {
  OpenDriveDocument,
  OdrRoad,
  OdrRoadLinkElement,
  OdrGeometry,
  OdrLaneSection,
} from '@osce/shared';
import { PatchCommand } from './patch-command.js';

export type GetDoc = () => OpenDriveDocument;
export type SetDoc = (doc: OpenDriveDocument) => void;
export type MarkDirtyRoad = (roadId: string) => void;

/**
 * Find the index of a road by its ID.
 */
function findRoadIndex(doc: OpenDriveDocument, roadId: string): number {
  return doc.roads.findIndex((r) => r.id === roadId);
}

/**
 * Set predecessor or successor on a road.
 */
export class SetRoadLinkCommand extends PatchCommand {
  private readonly roadId: string;
  private readonly linkType: 'predecessor' | 'successor';
  private readonly linkElement: OdrRoadLinkElement | undefined;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirtyRoad: MarkDirtyRoad;

  constructor(
    roadId: string,
    linkType: 'predecessor' | 'successor',
    linkElement: OdrRoadLinkElement | undefined,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirtyRoad: MarkDirtyRoad,
  ) {
    const desc = linkElement
      ? `Set ${linkType} on road ${roadId} to ${linkElement.elementId}`
      : `Clear ${linkType} on road ${roadId}`;
    super(desc);
    this.roadId = roadId;
    this.linkType = linkType;
    this.linkElement = linkElement;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirtyRoad = markDirtyRoad;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      const road = draft.roads[roadIdx];
      if (!road.link) {
        road.link = {};
      }
      if (this.linkElement) {
        road.link[this.linkType] = { ...this.linkElement };
      } else {
        delete road.link[this.linkType];
        // Clean up empty link object
        if (!road.link.predecessor && !road.link.successor) {
          road.link = undefined;
        }
      }
    });
  }

  protected markSideEffects(): void {
    this.markDirtyRoad(this.roadId);
  }
}

/**
 * Split a road at a given s-position into two roads.
 * The first road keeps the original ID and geometry up to the split point.
 * The second road gets a new ID and geometry from the split point onwards.
 */
export class SplitRoadCommand extends PatchCommand {
  private readonly roadId: string;
  private readonly splitS: number;
  private readonly newRoadId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirtyRoad: MarkDirtyRoad;

  constructor(
    roadId: string,
    splitS: number,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirtyRoad: MarkDirtyRoad,
  ) {
    super(`Split road ${roadId} at s=${splitS}`);
    this.roadId = roadId;
    this.splitS = splitS;
    this.newRoadId = nextNumericId(getDoc().roads.map((r) => r.id));
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirtyRoad = markDirtyRoad;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;

      const road = draft.roads[roadIdx];
      if (this.splitS <= 0 || this.splitS >= road.length) return;

      // Capture the original successor before it is overwritten below.
      const originalSuccessor = road.link?.successor
        ? structuredClone(current(road.link.successor))
        : undefined;

      // Work from a plain (non-draft) snapshot so structuredClone is safe.
      const plainRoad = current(road);

      // Partition geometry segments.
      const beforeGeo: OdrGeometry[] = [];
      const afterGeo: OdrGeometry[] = [];
      for (const geo of plainRoad.planView) {
        const geoEnd = geo.s + geo.length;
        if (geoEnd <= this.splitS) {
          // Entirely before split point.
          beforeGeo.push(structuredClone(geo));
        } else if (geo.s >= this.splitS) {
          // Entirely after split point — shift s values.
          afterGeo.push({ ...structuredClone(geo), s: geo.s - this.splitS });
        } else {
          // Geometry spans the split point — split it.
          const beforeLen = this.splitS - geo.s;
          const afterLen = geo.length - beforeLen;
          beforeGeo.push({ ...structuredClone(geo), length: beforeLen });
          afterGeo.push({ ...structuredClone(geo), s: 0, length: afterLen });
        }
      }

      // Partition lane sections.
      const beforeLanes: OdrLaneSection[] = [];
      const afterLanes: OdrLaneSection[] = [];
      for (const ls of plainRoad.lanes) {
        if (ls.s < this.splitS) {
          beforeLanes.push(structuredClone(ls));
        } else {
          afterLanes.push({ ...structuredClone(ls), s: ls.s - this.splitS });
        }
      }

      // Ensure both halves have at least one lane section.
      if (beforeLanes.length === 0 && plainRoad.lanes.length > 0) {
        beforeLanes.push({ ...structuredClone(plainRoad.lanes[0]), s: 0 });
      }
      if (afterLanes.length === 0 && plainRoad.lanes.length > 0) {
        afterLanes.push({
          ...structuredClone(plainRoad.lanes[plainRoad.lanes.length - 1]),
          s: 0,
        });
      }

      const newRoadLength = road.length - this.splitS;

      // Update original road (first half).
      road.length = this.splitS;
      road.planView = beforeGeo;
      road.lanes = beforeLanes;

      // Create new road (second half).
      const newRoad: OdrRoad = {
        id: this.newRoadId,
        name: `${road.name}_split`,
        length: newRoadLength,
        junction: plainRoad.junction,
        rule: plainRoad.rule,
        type: plainRoad.type ? structuredClone(plainRoad.type) : undefined,
        planView: afterGeo,
        elevationProfile: [],
        lateralProfile: [],
        laneOffset: [],
        lanes: afterLanes,
        objects: [],
        signals: [],
      };

      // Original road now links to the new road as successor.
      if (!road.link) road.link = {};
      road.link.successor = {
        elementType: 'road',
        elementId: this.newRoadId,
        contactPoint: 'start',
      };

      // New road links back to original as predecessor.
      newRoad.link = {
        predecessor: {
          elementType: 'road',
          elementId: this.roadId,
          contactPoint: 'end',
        },
      };

      // If original had a successor, new road inherits it.
      if (originalSuccessor) {
        newRoad.link.successor = originalSuccessor;
      }

      draft.roads.push(newRoad);
    });
  }

  protected markSideEffects(): void {
    this.markDirtyRoad(this.roadId);
    this.markDirtyRoad(this.newRoadId);
  }

  getNewRoadId(): string {
    return this.newRoadId;
  }
}

/**
 * Join two connected roads into one.
 * The second road is merged into the first, and the second road is removed.
 */
export class JoinRoadsCommand extends PatchCommand {
  private readonly firstRoadId: string;
  private readonly secondRoadId: string;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirtyRoad: MarkDirtyRoad;

  constructor(
    firstRoadId: string,
    secondRoadId: string,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirtyRoad: MarkDirtyRoad,
  ) {
    super(`Join roads ${firstRoadId} and ${secondRoadId}`);
    this.firstRoadId = firstRoadId;
    this.secondRoadId = secondRoadId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirtyRoad = markDirtyRoad;
  }

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const firstIdx = findRoadIndex(draft, this.firstRoadId);
      const secondIdx = findRoadIndex(draft, this.secondRoadId);
      if (firstIdx === -1 || secondIdx === -1) return;

      const firstRoad = draft.roads[firstIdx];
      const secondRoad = draft.roads[secondIdx];

      // Verify roads are connected (first road's successor is second road).
      const isConnected =
        firstRoad.link?.successor?.elementId === this.secondRoadId ||
        secondRoad.link?.predecessor?.elementId === this.firstRoadId;
      if (!isConnected) return;

      const firstLength = firstRoad.length;

      // Work from a plain (non-draft) snapshot so structuredClone is safe.
      const plainSecond = current(secondRoad);

      // Append second road's geometry with shifted s values.
      for (const geo of plainSecond.planView) {
        firstRoad.planView.push({ ...structuredClone(geo), s: geo.s + firstLength });
      }

      // Append second road's lane sections with shifted s values.
      for (const ls of plainSecond.lanes) {
        firstRoad.lanes.push({ ...structuredClone(ls), s: ls.s + firstLength });
      }

      // Update total length.
      firstRoad.length = firstLength + plainSecond.length;

      // Inherit second road's successor link.
      if (plainSecond.link?.successor) {
        if (!firstRoad.link) firstRoad.link = {};
        firstRoad.link.successor = structuredClone(plainSecond.link.successor);
      } else {
        if (firstRoad.link) {
          delete firstRoad.link.successor;
          if (!firstRoad.link.predecessor) {
            firstRoad.link = undefined;
          }
        }
      }

      // Remove the second road.
      const draftSecondIdx = findRoadIndex(draft, this.secondRoadId);
      if (draftSecondIdx !== -1) {
        draft.roads.splice(draftSecondIdx, 1);
      }
    });
  }

  protected markSideEffects(): void {
    this.markDirtyRoad(this.firstRoadId);
  }

  protected markUndoSideEffects(): void {
    // Undo re-inserts the second road, so both must regenerate.
    this.markDirtyRoad(this.firstRoadId);
    this.markDirtyRoad(this.secondRoadId);
  }
}
