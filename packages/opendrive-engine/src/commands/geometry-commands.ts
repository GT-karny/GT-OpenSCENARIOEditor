/**
 * Commands for road geometry (planView) editing.
 */

import { produce } from 'immer';
import type { OpenDriveDocument, OdrGeometry } from '@osce/shared';
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
 * Create a default geometry segment with sensible defaults.
 */
function createDefaultGeometry(partial: Partial<OdrGeometry>): OdrGeometry {
  return {
    s: partial.s ?? 0,
    x: partial.x ?? 0,
    y: partial.y ?? 0,
    hdg: partial.hdg ?? 0,
    length: partial.length ?? 10,
    type: partial.type ?? 'line',
    curvature: partial.curvature,
    curvStart: partial.curvStart,
    curvEnd: partial.curvEnd,
    a: partial.a,
    b: partial.b,
    c: partial.c,
    d: partial.d,
    aU: partial.aU,
    bU: partial.bU,
    cU: partial.cU,
    dU: partial.dU,
    aV: partial.aV,
    bV: partial.bV,
    cV: partial.cV,
    dV: partial.dV,
    pRange: partial.pRange,
  };
}

/**
 * Add a geometry segment to a road's planView.
 */
export class AddGeometryCommand extends BaseCommand {
  private readonly roadId: string;
  private readonly geometry: OdrGeometry;
  private readonly index: number | undefined;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirtyRoad: MarkDirtyRoad;

  constructor(
    roadId: string,
    partial: Partial<OdrGeometry>,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirtyRoad: MarkDirtyRoad,
    index?: number,
  ) {
    super(`Add geometry to road: ${roadId}`);
    this.roadId = roadId;
    this.geometry = createDefaultGeometry(partial);
    this.index = index;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirtyRoad = markDirtyRoad;
  }

  execute(): void {
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const roadIdx = findRoadIndex(draft, this.roadId);
        if (roadIdx === -1) return;
        if (this.index !== undefined && this.index <= draft.roads[roadIdx].planView.length) {
          draft.roads[roadIdx].planView.splice(this.index, 0, this.geometry);
        } else {
          draft.roads[roadIdx].planView.push(this.geometry);
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
        const geoIdx = draft.roads[roadIdx].planView.findIndex(
          (g) =>
            g.s === this.geometry.s &&
            g.x === this.geometry.x &&
            g.y === this.geometry.y &&
            g.type === this.geometry.type,
        );
        if (geoIdx !== -1) {
          draft.roads[roadIdx].planView.splice(geoIdx, 1);
        }
      }),
    );
    this.markDirtyRoad(this.roadId);
  }

  getCreatedGeometry(): OdrGeometry {
    return this.geometry;
  }
}

/**
 * Remove a geometry segment by index from a road's planView.
 */
export class RemoveGeometryCommand extends BaseCommand {
  private readonly roadId: string;
  private readonly geometryIndex: number;
  private removedGeometry: OdrGeometry | null = null;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirtyRoad: MarkDirtyRoad;

  constructor(
    roadId: string,
    geometryIndex: number,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirtyRoad: MarkDirtyRoad,
  ) {
    super(`Remove geometry[${geometryIndex}] from road: ${roadId}`);
    this.roadId = roadId;
    this.geometryIndex = geometryIndex;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirtyRoad = markDirtyRoad;
  }

  execute(): void {
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;
    const planView = doc.roads[roadIdx].planView;
    if (this.geometryIndex < 0 || this.geometryIndex >= planView.length) return;
    this.removedGeometry = structuredClone(planView[this.geometryIndex]);

    this.setDoc(
      produce(doc, (draft) => {
        draft.roads[roadIdx].planView.splice(this.geometryIndex, 1);
      }),
    );
    this.markDirtyRoad(this.roadId);
  }

  undo(): void {
    if (!this.removedGeometry) return;
    const geo = this.removedGeometry;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const roadIdx = findRoadIndex(draft, this.roadId);
        if (roadIdx === -1) return;
        draft.roads[roadIdx].planView.splice(this.geometryIndex, 0, geo);
      }),
    );
    this.markDirtyRoad(this.roadId);
  }
}

/**
 * Update geometry segment properties (s, x, y, hdg, length, type-specific params).
 */
export class UpdateGeometryCommand extends BaseCommand {
  private readonly roadId: string;
  private readonly geometryIndex: number;
  private readonly updates: Partial<OdrGeometry>;
  private previousGeometry: OdrGeometry | null = null;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirtyRoad: MarkDirtyRoad;

  constructor(
    roadId: string,
    geometryIndex: number,
    updates: Partial<OdrGeometry>,
    getDoc: GetDoc,
    setDoc: SetDoc,
    markDirtyRoad: MarkDirtyRoad,
  ) {
    super(`Update geometry[${geometryIndex}] on road: ${roadId}`);
    this.roadId = roadId;
    this.geometryIndex = geometryIndex;
    this.updates = updates;
    this.getDoc = getDoc;
    this.setDoc = setDoc;
    this.markDirtyRoad = markDirtyRoad;
  }

  execute(): void {
    const doc = this.getDoc();
    const roadIdx = findRoadIndex(doc, this.roadId);
    if (roadIdx === -1) return;
    const planView = doc.roads[roadIdx].planView;
    if (this.geometryIndex < 0 || this.geometryIndex >= planView.length) return;
    this.previousGeometry = structuredClone(planView[this.geometryIndex]);

    this.setDoc(
      produce(doc, (draft) => {
        Object.assign(draft.roads[roadIdx].planView[this.geometryIndex], this.updates);
      }),
    );
    this.markDirtyRoad(this.roadId);
  }

  undo(): void {
    if (!this.previousGeometry) return;
    const prev = this.previousGeometry;
    this.setDoc(
      produce(this.getDoc(), (draft) => {
        const roadIdx = findRoadIndex(draft, this.roadId);
        if (roadIdx === -1) return;
        if (this.geometryIndex < draft.roads[roadIdx].planView.length) {
          draft.roads[roadIdx].planView[this.geometryIndex] = prev;
        }
      }),
    );
    this.markDirtyRoad(this.roadId);
  }
}
