/**
 * Commands for road geometry (planView) editing.
 */

import type {
  OpenDriveDocument,
  OdrRoad,
  OdrGeometry,
  OdrGeometryBase,
  OdrGeometryUpdate,
} from '@osce/shared';
import { evaluateGeometry } from '@osce/opendrive';
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
 * Re-establish the planView invariants after a segment insert/remove/resize and
 * refresh `road.length`.
 *
 * Every command that mutates the number of segments (or a segment's length)
 * would otherwise leave a stale `road.s`-chain, discontinuous start poses, and a
 * `road.length` that no longer equals the reference line — all of which serialize
 * to a schema-invalid / geometrically broken xodr. Normalizing here means every
 * caller inherits the invariant without duplicating the math.
 *
 * The first segment keeps its authored placement (`s`, `x`, `y`, `hdg` — normally
 * the road origin at s=0). Each following segment is re-chained: its `s` is the
 * running arc length and its start pose is the end pose of the previous segment.
 * Segment shapes (curvature / poly coefficients / length) are preserved; only
 * placement is recomputed.
 */
function normalizePlanView(road: OdrRoad): void {
  const planView = road.planView;
  if (planView.length === 0) {
    road.length = 0;
    return;
  }

  let s = planView[0].s;
  for (let i = 1; i < planView.length; i++) {
    const prev = planView[i - 1];
    s += prev.length;
    const end = evaluateGeometry(prev.length, prev);
    const geom = planView[i];
    geom.s = s;
    geom.x = end.x;
    geom.y = end.y;
    geom.hdg = end.hdg;
  }

  // road.length spans from the first segment's s to the end of the last.
  road.length = s + planView[planView.length - 1].length;
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
export class AddGeometryCommand extends PatchCommand {
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

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      const road = draft.roads[roadIdx];
      if (this.index !== undefined && this.index <= road.planView.length) {
        road.planView.splice(this.index, 0, this.geometry);
      } else {
        road.planView.push(this.geometry);
      }
      normalizePlanView(road);
    });
  }

  protected markSideEffects(): void {
    this.markDirtyRoad(this.roadId);
  }

  getCreatedGeometry(): OdrGeometry {
    return this.geometry;
  }
}

/**
 * Remove a geometry segment by index from a road's planView.
 */
export class RemoveGeometryCommand extends PatchCommand {
  private readonly roadId: string;
  private readonly geometryIndex: number;
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

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      const road = draft.roads[roadIdx];
      if (this.geometryIndex < 0 || this.geometryIndex >= road.planView.length) return;
      road.planView.splice(this.geometryIndex, 1);
      normalizePlanView(road);
    });
  }

  protected markSideEffects(): void {
    this.markDirtyRoad(this.roadId);
  }
}

/**
 * Update geometry segment properties (s, x, y, hdg, length, type-specific params).
 */
export class UpdateGeometryCommand extends PatchCommand {
  private readonly roadId: string;
  private readonly geometryIndex: number;
  private readonly updates: OdrGeometryUpdate;
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

  apply(): void {
    this.mutate(this.getDoc, this.setDoc, (draft) => {
      const roadIdx = findRoadIndex(draft, this.roadId);
      if (roadIdx === -1) return;
      const road = draft.roads[roadIdx];
      if (this.geometryIndex < 0 || this.geometryIndex >= road.planView.length) return;
      Object.assign(road.planView[this.geometryIndex], this.updates);
      // An update can change a segment's length (or its first-segment placement),
      // so re-chain the following segments and refresh road.length as well.
      normalizePlanView(road);
    });
  }

  protected markSideEffects(): void {
    this.markDirtyRoad(this.roadId);
  }
}
