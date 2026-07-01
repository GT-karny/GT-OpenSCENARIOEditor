/**
 * Commands for road geometry (planView) editing.
 */

import { produce } from 'immer';
import type {
  OpenDriveDocument,
  OdrGeometry,
  OdrGeometryBase,
  OdrGeometryUpdate,
} from '@osce/shared';
import { BaseCommand } from '@osce/scenario-engine';

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
 *
 * Builds a concrete discriminated-union variant from the partial input,
 * filling type-specific parameters with neutral (straight) defaults so the
 * result always satisfies the variant's required fields.
 */
function createDefaultGeometry(partial: OdrGeometryUpdate): OdrGeometry {
  const base: OdrGeometryBase = {
    s: partial.s ?? 0,
    x: partial.x ?? 0,
    y: partial.y ?? 0,
    hdg: partial.hdg ?? 0,
    length: partial.length ?? 10,
  };

  switch (partial.type) {
    case 'arc':
      return { ...base, type: 'arc', curvature: partial.curvature ?? 0 };
    case 'spiral':
      return {
        ...base,
        type: 'spiral',
        curvStart: partial.curvStart ?? 0,
        curvEnd: partial.curvEnd ?? 0,
      };
    case 'poly3':
      return {
        ...base,
        type: 'poly3',
        a: partial.a ?? 0,
        b: partial.b ?? 0,
        c: partial.c ?? 0,
        d: partial.d ?? 0,
      };
    case 'paramPoly3':
      return {
        ...base,
        type: 'paramPoly3',
        aU: partial.aU ?? 0,
        bU: partial.bU ?? 0,
        cU: partial.cU ?? 0,
        dU: partial.dU ?? 0,
        aV: partial.aV ?? 0,
        bV: partial.bV ?? 0,
        cV: partial.cV ?? 0,
        dV: partial.dV ?? 0,
        pRange: partial.pRange ?? 'arcLength',
      };
    case 'line':
    default:
      return { ...base, type: 'line' };
  }
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
    partial: OdrGeometryUpdate,
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
  private readonly updates: OdrGeometryUpdate;
  private previousGeometry: OdrGeometry | null = null;
  private readonly getDoc: GetDoc;
  private readonly setDoc: SetDoc;
  private readonly markDirtyRoad: MarkDirtyRoad;

  constructor(
    roadId: string,
    geometryIndex: number,
    updates: OdrGeometryUpdate,
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
