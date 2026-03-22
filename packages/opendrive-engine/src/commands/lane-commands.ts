/**
 * Commands for lane CRUD operations and lane section splitting.
 */

import { produce } from 'immer';
import type { OdrLane, OdrLaneSection } from '@osce/shared';
import { BaseCommand } from './base-command.js';
import type { GetDoc, SetDoc, MarkDirtyRoad } from './road-commands.js';
import { findRoadIndex } from '../operations/road-operations.js';
import { createDefaultLane } from '../store/defaults.js';

export class AddLaneCommand extends BaseCommand {
  private readonly roadId: string;
  private readonly sectionIdx: number;
  private readonly side: 'left' | 'right';
  private readonly lane: OdrLane;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(
    roadId: string,
    sectionIdx: number,
    side: 'left' | 'right',
    partial: Partial<OdrLane>,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyRoad,
  ) {
    super(`Add lane to road ${roadId} section ${sectionIdx} (${side})`);
    this.roadId = roadId;
    this.sectionIdx = sectionIdx;
    this.side = side;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;

    // Determine lane ID from existing lanes if not provided
    const doc = getDoc();
    const roadIdx = findRoadIndex(doc, roadId);
    const section = roadIdx !== -1 ? doc.roads[roadIdx].lanes[sectionIdx] : undefined;
    const lanes = section ? (side === 'left' ? section.leftLanes : section.rightLanes) : [];
    const sign = side === 'left' ? 1 : -1;
    const newId = partial.id ?? sign * (lanes.length + 1);

    this.lane = {
      ...createDefaultLane(newId, partial.type ?? 'driving'),
      ...partial,
      id: newId,
    };
  }

  execute(): void {
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;
    const section = doc.roads[roadIdx].lanes[this.sectionIdx];
    if (!section) return;

    this.setDoc(
      produce(doc, (draft) => {
        const target =
          this.side === 'left'
            ? draft.roads[roadIdx].lanes[this.sectionIdx].leftLanes
            : draft.roads[roadIdx].lanes[this.sectionIdx].rightLanes;
        target.push(this.lane);
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
        const target =
          this.side === 'left'
            ? draft.roads[roadIdx].lanes[this.sectionIdx].leftLanes
            : draft.roads[roadIdx].lanes[this.sectionIdx].rightLanes;
        const idx = target.findIndex((l) => l.id === this.lane.id);
        if (idx !== -1) target.splice(idx, 1);
      }),
    );
    this.markDirty(this.roadId);
  }

  getCreatedLane(): OdrLane {
    return this.lane;
  }
}

export class RemoveLaneCommand extends BaseCommand {
  private removedLane: OdrLane | null = null;
  private removedIndex = -1;
  private readonly roadId: string;
  private readonly sectionIdx: number;
  private readonly side: 'left' | 'right';
  private readonly laneId: number;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(
    roadId: string,
    sectionIdx: number,
    side: 'left' | 'right',
    laneId: number,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyRoad,
  ) {
    super(`Remove lane ${laneId} from road ${roadId}`);
    this.roadId = roadId;
    this.sectionIdx = sectionIdx;
    this.side = side;
    this.laneId = laneId;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  execute(): void {
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;
    const section = doc.roads[roadIdx].lanes[this.sectionIdx];
    if (!section) return;

    const lanes = this.side === 'left' ? section.leftLanes : section.rightLanes;
    this.removedIndex = lanes.findIndex((l) => l.id === this.laneId);
    if (this.removedIndex !== -1) {
      this.removedLane = structuredClone(lanes[this.removedIndex]);
    }

    this.setDoc(
      produce(doc, (draft) => {
        const target =
          this.side === 'left'
            ? draft.roads[roadIdx].lanes[this.sectionIdx].leftLanes
            : draft.roads[roadIdx].lanes[this.sectionIdx].rightLanes;
        if (this.removedIndex !== -1) target.splice(this.removedIndex, 1);
      }),
    );
    this.markDirty(this.roadId);
  }

  undo(): void {
    if (!this.removedLane || this.removedIndex === -1) return;
    const lane = this.removedLane;
    const idx = this.removedIndex;
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;

    this.setDoc(
      produce(doc, (draft) => {
        const target =
          this.side === 'left'
            ? draft.roads[roadIdx].lanes[this.sectionIdx].leftLanes
            : draft.roads[roadIdx].lanes[this.sectionIdx].rightLanes;
        target.splice(idx, 0, lane);
      }),
    );
    this.markDirty(this.roadId);
  }
}

export class UpdateLaneCommand extends BaseCommand {
  private previousLane: OdrLane | null = null;
  private readonly roadId: string;
  private readonly sectionIdx: number;
  private readonly side: 'left' | 'right';
  private readonly laneId: number;
  private readonly updates: Partial<OdrLane>;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(
    roadId: string,
    sectionIdx: number,
    side: 'left' | 'right',
    laneId: number,
    updates: Partial<OdrLane>,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyRoad,
  ) {
    super(`Update lane ${laneId} on road ${roadId}`);
    this.roadId = roadId;
    this.sectionIdx = sectionIdx;
    this.side = side;
    this.laneId = laneId;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  execute(): void {
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;
    const section = doc.roads[roadIdx].lanes[this.sectionIdx];
    if (!section) return;

    const lanes = this.side === 'left' ? section.leftLanes : section.rightLanes;
    const lane = lanes.find((l) => l.id === this.laneId);
    if (!lane) return;

    this.previousLane = structuredClone(lane);

    this.setDoc(
      produce(doc, (draft) => {
        const target =
          this.side === 'left'
            ? draft.roads[roadIdx].lanes[this.sectionIdx].leftLanes
            : draft.roads[roadIdx].lanes[this.sectionIdx].rightLanes;
        const draftLane = target.find((l) => l.id === this.laneId);
        if (draftLane) Object.assign(draftLane, this.updates);
      }),
    );
    this.markDirty(this.roadId);
  }

  undo(): void {
    if (!this.previousLane) return;
    const prev = this.previousLane;
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;

    this.setDoc(
      produce(doc, (draft) => {
        const target =
          this.side === 'left'
            ? draft.roads[roadIdx].lanes[this.sectionIdx].leftLanes
            : draft.roads[roadIdx].lanes[this.sectionIdx].rightLanes;
        const idx = target.findIndex((l) => l.id === this.laneId);
        if (idx !== -1) target[idx] = prev;
      }),
    );
    this.markDirty(this.roadId);
  }
}

export class SplitLaneSectionCommand extends BaseCommand {
  private previousSections: OdrLaneSection[] | null = null;
  private readonly roadId: string;
  private readonly sectionIdx: number;
  private readonly splitS: number;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirty: MarkDirtyRoad;

  constructor(
    roadId: string,
    sectionIdx: number,
    splitS: number,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirty: MarkDirtyRoad,
  ) {
    super(`Split lane section at s=${splitS} on road ${roadId}`);
    this.roadId = roadId;
    this.sectionIdx = sectionIdx;
    this.splitS = splitS;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirty = markDirty;
  }

  execute(): void {
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;
    const road = doc.roads[roadIdx];
    const section = road.lanes[this.sectionIdx];
    if (!section) return;

    // Validate split position is within the section range
    if (this.splitS <= section.s) return;

    // Determine section end: next section's s or road length
    const nextSection = road.lanes[this.sectionIdx + 1];
    const sectionEnd = nextSection ? nextSection.s : road.length;
    if (this.splitS >= sectionEnd) return;

    this.previousSections = structuredClone(road.lanes);

    // Create the new section as a clone of the original with updated s
    const newSection: OdrLaneSection = {
      ...structuredClone(section),
      s: this.splitS,
    };

    this.setDoc(
      produce(doc, (draft) => {
        draft.roads[roadIdx].lanes.splice(this.sectionIdx + 1, 0, newSection);
      }),
    );
    this.markDirty(this.roadId);
  }

  undo(): void {
    if (!this.previousSections) return;
    const prev = this.previousSections;
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;

    this.setDoc(
      produce(doc, (draft) => {
        draft.roads[roadIdx].lanes = prev;
      }),
    );
    this.markDirty(this.roadId);
  }
}
