/**
 * Commands for road linking and splitting operations.
 */

import { produce } from 'immer';
import { nextNumericId } from '../utils/id-generator.js';
import type {
  OpenDriveDocument,
  OdrRoad,
  OdrRoadLink,
  OdrRoadLinkElement,
  OdrGeometry,
  OdrLaneSection,
} from '@osce/shared';
import { BaseCommand } from './base-command.js';

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
export class SetRoadLinkCommand extends BaseCommand {
  private readonly roadId: string;
  private readonly linkType: 'predecessor' | 'successor';
  private readonly linkElement: OdrRoadLinkElement | undefined;
  private previousLink: OdrRoadLink | undefined;
  private hadLink: boolean = false;
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

  execute(): void {
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;

    // Save previous state for undo
    this.hadLink = doc.roads[roadIdx].link !== undefined;
    this.previousLink = doc.roads[roadIdx].link
      ? structuredClone(doc.roads[roadIdx].link)
      : undefined;

    this.setDoc(
      produce(doc, (draft) => {
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
      }),
    );
    this.markDirtyRoad(this.roadId);
  }

  undo(): void {
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const roadIdx = findRoadIndex(draft, this.roadId);
        if (roadIdx === -1) return;
        if (this.hadLink && this.previousLink) {
          draft.roads[roadIdx].link = this.previousLink;
        } else {
          draft.roads[roadIdx].link = undefined;
        }
      }),
    );
    this.markDirtyRoad(this.roadId);
  }
}

/**
 * Split a road at a given s-position into two roads.
 * The first road keeps the original ID and geometry up to the split point.
 * The second road gets a new ID and geometry from the split point onwards.
 */
export class SplitRoadCommand extends BaseCommand {
  private readonly roadId: string;
  private readonly splitS: number;
  private readonly newRoadId: string;
  private previousRoad: OdrRoad | null = null;
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

  execute(): void {
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;

    const road = doc.roads[roadIdx];
    if (this.splitS <= 0 || this.splitS >= road.length) return;

    this.previousRoad = structuredClone(road);

    // Partition geometry segments
    const beforeGeo: OdrGeometry[] = [];
    const afterGeo: OdrGeometry[] = [];

    for (const geo of road.planView) {
      const geoEnd = geo.s + geo.length;
      if (geoEnd <= this.splitS) {
        // Entirely before split point
        beforeGeo.push(structuredClone(geo));
      } else if (geo.s >= this.splitS) {
        // Entirely after split point — shift s values
        afterGeo.push({
          ...structuredClone(geo),
          s: geo.s - this.splitS,
        });
      } else {
        // Geometry spans the split point — split it
        const beforeLen = this.splitS - geo.s;
        const afterLen = geo.length - beforeLen;
        beforeGeo.push({
          ...structuredClone(geo),
          length: beforeLen,
        });
        afterGeo.push({
          ...structuredClone(geo),
          s: 0,
          length: afterLen,
        });
      }
    }

    // Partition lane sections
    const beforeLanes: OdrLaneSection[] = [];
    const afterLanes: OdrLaneSection[] = [];

    for (const ls of road.lanes) {
      if (ls.s < this.splitS) {
        beforeLanes.push(structuredClone(ls));
      } else {
        afterLanes.push({
          ...structuredClone(ls),
          s: ls.s - this.splitS,
        });
      }
    }

    // Ensure both halves have at least one lane section
    if (beforeLanes.length === 0 && road.lanes.length > 0) {
      beforeLanes.push({ ...structuredClone(road.lanes[0]), s: 0 });
    }
    if (afterLanes.length === 0 && road.lanes.length > 0) {
      afterLanes.push({
        ...structuredClone(road.lanes[road.lanes.length - 1]),
        s: 0,
      });
    }

    const newRoadLength = road.length - this.splitS;

    this.setDoc(
      produce(doc, (draft) => {
        const draftRoad = draft.roads[roadIdx];

        // Update original road (first half)
        draftRoad.length = this.splitS;
        draftRoad.planView = beforeGeo;
        draftRoad.lanes = beforeLanes;

        // Create new road (second half)
        const newRoad: OdrRoad = {
          id: this.newRoadId,
          name: `${draftRoad.name}_split`,
          length: newRoadLength,
          junction: draftRoad.junction,
          rule: draftRoad.rule,
          type: draftRoad.type ? structuredClone(draftRoad.type) : undefined,
          planView: afterGeo,
          elevationProfile: [],
          lateralProfile: [],
          laneOffset: [],
          lanes: afterLanes,
          objects: [],
          signals: [],
        };

        // Set up links: original -> new road -> original successor
        const originalSuccessor = this.previousRoad?.link?.successor
          ? structuredClone(this.previousRoad.link.successor)
          : undefined;

        // Original road now links to the new road as successor
        if (!draftRoad.link) draftRoad.link = {};
        draftRoad.link.successor = {
          elementType: 'road',
          elementId: this.newRoadId,
          contactPoint: 'start',
        };

        // New road links back to original as predecessor
        newRoad.link = {
          predecessor: {
            elementType: 'road',
            elementId: this.roadId,
            contactPoint: 'end',
          },
        };

        // If original had a successor, new road inherits it
        if (originalSuccessor) {
          newRoad.link.successor = originalSuccessor;
        }

        draft.roads.push(newRoad);
      }),
    );
    this.markDirtyRoad(this.roadId);
    this.markDirtyRoad(this.newRoadId);
  }

  undo(): void {
    if (!this.previousRoad) return;
    const prevRoad = this.previousRoad;

    this.setDoc(
      produce(this.getDoc(), (draft) => {
        // Restore original road
        const roadIdx = findRoadIndex(draft, this.roadId);
        if (roadIdx !== -1) {
          draft.roads[roadIdx] = prevRoad;
        }
        // Remove the split-off road
        const newRoadIdx = findRoadIndex(draft, this.newRoadId);
        if (newRoadIdx !== -1) {
          draft.roads.splice(newRoadIdx, 1);
        }
      }),
    );
    this.markDirtyRoad(this.roadId);
  }

  getNewRoadId(): string {
    return this.newRoadId;
  }
}

/**
 * Join two connected roads into one.
 * The second road is merged into the first, and the second road is removed.
 */
export class JoinRoadsCommand extends BaseCommand {
  private readonly firstRoadId: string;
  private readonly secondRoadId: string;
  private previousFirstRoad: OdrRoad | null = null;
  private previousSecondRoad: OdrRoad | null = null;
  private secondRoadIndex: number = -1;
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

  execute(): void {
    const doc = this.getDoc();
    const firstIdx = findRoadIndex(doc, this.firstRoadId);
    const secondIdx = findRoadIndex(doc, this.secondRoadId);
    if (firstIdx === -1 || secondIdx === -1) return;

    const firstRoad = doc.roads[firstIdx];
    const secondRoad = doc.roads[secondIdx];

    // Verify roads are connected (first road's successor is second road)
    const isConnected =
      firstRoad.link?.successor?.elementId === this.secondRoadId ||
      secondRoad.link?.predecessor?.elementId === this.firstRoadId;
    if (!isConnected) return;

    this.previousFirstRoad = structuredClone(firstRoad);
    this.previousSecondRoad = structuredClone(secondRoad);
    this.secondRoadIndex = secondIdx;

    const firstLength = firstRoad.length;

    this.setDoc(
      produce(doc, (draft) => {
        const draftFirst = draft.roads[firstIdx];

        // Append second road's geometry with shifted s values
        for (const geo of secondRoad.planView) {
          draftFirst.planView.push({
            ...structuredClone(geo),
            s: geo.s + firstLength,
          });
        }

        // Append second road's lane sections with shifted s values
        for (const ls of secondRoad.lanes) {
          draftFirst.lanes.push({
            ...structuredClone(ls),
            s: ls.s + firstLength,
          });
        }

        // Update total length
        draftFirst.length = firstLength + secondRoad.length;

        // Inherit second road's successor link
        if (secondRoad.link?.successor) {
          if (!draftFirst.link) draftFirst.link = {};
          draftFirst.link.successor = structuredClone(secondRoad.link.successor);
        } else {
          if (draftFirst.link) {
            delete draftFirst.link.successor;
            if (!draftFirst.link.predecessor) {
              draftFirst.link = undefined;
            }
          }
        }

        // Remove the second road
        const draftSecondIdx = draft.roads.findIndex((r) => r.id === this.secondRoadId);
        if (draftSecondIdx !== -1) {
          draft.roads.splice(draftSecondIdx, 1);
        }
      }),
    );
    this.markDirtyRoad(this.firstRoadId);
  }

  undo(): void {
    if (!this.previousFirstRoad || !this.previousSecondRoad) return;
    const prevFirst = this.previousFirstRoad;
    const prevSecond = this.previousSecondRoad;
    const prevSecondIdx = this.secondRoadIndex;

    this.setDoc(
      produce(this.getDoc(), (draft) => {
        // Restore first road
        const firstIdx = findRoadIndex(draft, this.firstRoadId);
        if (firstIdx !== -1) {
          draft.roads[firstIdx] = prevFirst;
        }
        // Re-insert second road at its original index
        draft.roads.splice(prevSecondIdx, 0, prevSecond);
      }),
    );
    this.markDirtyRoad(this.firstRoadId);
    this.markDirtyRoad(this.secondRoadId);
  }
}
