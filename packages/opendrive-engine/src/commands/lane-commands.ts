/**
 * Commands for lane CRUD operations and lane section splitting.
 */

import { current } from 'immer';
import type { OdrLane, OdrLaneSection } from '@osce/shared';
import { PatchCommand } from './patch-command.js';
import type { GetDoc, SetDoc, MarkDirtyRoad } from './road-commands.js';
import { findRoadIndex } from '../operations/road-operations.js';
import { createDefaultLane } from '../store/defaults.js';

export class AddLaneCommand extends PatchCommand {
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

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      const section = draft.roads[roadIdx].lanes[this.sectionIdx];
      if (!section) return;
      const target = this.side === 'left' ? section.leftLanes : section.rightLanes;
      target.push(this.lane);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.roadId);
  }

  getCreatedLane(): OdrLane {
    return this.lane;
  }
}

export class RemoveLaneCommand extends PatchCommand {
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

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      const section = draft.roads[roadIdx].lanes[this.sectionIdx];
      if (!section) return;
      const target = this.side === 'left' ? section.leftLanes : section.rightLanes;
      const idx = target.findIndex((l) => l.id === this.laneId);
      if (idx !== -1) target.splice(idx, 1);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.roadId);
  }
}

export class UpdateLaneCommand extends PatchCommand {
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

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      const section = draft.roads[roadIdx].lanes[this.sectionIdx];
      if (!section) return;
      const target = this.side === 'left' ? section.leftLanes : section.rightLanes;
      const draftLane = target.find((l) => l.id === this.laneId);
      if (draftLane) Object.assign(draftLane, this.updates);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.roadId);
  }
}

export class SplitLaneSectionCommand extends PatchCommand {
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

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      const road = draft.roads[roadIdx];
      const section = road.lanes[this.sectionIdx];
      if (!section) return;

      // Validate split position is within the section range.
      if (this.splitS <= section.s) return;

      // Determine section end: next section's s or road length.
      const nextSection = road.lanes[this.sectionIdx + 1];
      const sectionEnd = nextSection ? nextSection.s : road.length;
      if (this.splitS >= sectionEnd) return;

      // Create the new section as a clone of the original with updated s.
      // `current` produces a plain (non-draft) snapshot, safe to structuredClone.
      const newSection: OdrLaneSection = {
        ...structuredClone(current(section)),
        s: this.splitS,
      };
      road.lanes.splice(this.sectionIdx + 1, 0, newSection);
    });
  }

  protected markSideEffects(): void {
    this.markDirty(this.roadId);
  }
}
