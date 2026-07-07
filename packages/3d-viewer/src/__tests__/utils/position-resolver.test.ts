import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { resolvePositionToWorld } from '../../utils/position-resolver.js';
import type { OpenDriveDocument, Position } from '@osce/shared';
import { XodrParser } from '@osce/opendrive';
import { makeStraightRoadDoc, makeStraightRoadDocWithLaneOffset } from '../helpers.js';

/** Flat straight road with a constant superelevation roll (and optional elevation). */
function makeSuperelevatedDoc(rollA: number, elevA = 0): OpenDriveDocument {
  const doc = makeStraightRoadDoc();
  doc.roads[0].elevationProfile = [{ s: 0, a: elevA, b: 0, c: 0, d: 0 }];
  doc.roads[0].lateralProfile = [{ s: 0, a: rollA, b: 0, c: 0, d: 0 }];
  return doc;
}

/** The real authored crossSectionSurface fixture (tOffset -0.375 + crossfall ±0.02). */
function crossFallDoc(): OpenDriveDocument {
  const xml = readFileSync(
    resolve(
      __dirname,
      '../../../../../test-fixtures/opendrive-v1.9/Ex_CrossSectionSurface_CrossFall_LeftTurn_1.xodr',
    ),
    'utf-8',
  );
  return new XodrParser().parse(xml);
}

describe('resolvePositionToWorld', () => {
  describe('WorldPosition', () => {
    it('resolves directly with all fields', () => {
      const pos: Position = { type: 'worldPosition', x: 10, y: 20, z: 5, h: 1.5 };
      const result = resolvePositionToWorld(pos, null);
      expect(result).toEqual({ x: 10, y: 20, z: 5, h: 1.5 });
    });

    it('defaults z and h to 0 when omitted', () => {
      const pos: Position = { type: 'worldPosition', x: 10, y: 20 };
      const result = resolvePositionToWorld(pos, null);
      expect(result).toEqual({ x: 10, y: 20, z: 0, h: 0 });
    });
  });

  describe('LanePosition', () => {
    it('resolves using opendrive geometry', () => {
      const odrDoc = makeStraightRoadDoc();
      const pos: Position = {
        type: 'lanePosition',
        roadId: '1',
        laneId: '-1',
        s: 50,
      };
      const result = resolvePositionToWorld(pos, odrDoc);
      expect(result).not.toBeNull();
      // On a straight road at s=50, x should be ~50
      expect(result!.x).toBeCloseTo(50, 0);
      // Right lane (id=-1) should have negative y (in OpenDRIVE convention)
      expect(result!.y).toBeLessThan(0);
      expect(result!.h).toBeCloseTo(0, 5);
    });

    it('resolves left lane with positive y', () => {
      const odrDoc = makeStraightRoadDoc();
      const pos: Position = {
        type: 'lanePosition',
        roadId: '1',
        laneId: '1',
        s: 50,
      };
      const result = resolvePositionToWorld(pos, odrDoc);
      expect(result).not.toBeNull();
      expect(result!.y).toBeGreaterThan(0);
    });

    it('returns null when road not found', () => {
      const odrDoc = makeStraightRoadDoc();
      const pos: Position = {
        type: 'lanePosition',
        roadId: '999',
        laneId: '-1',
        s: 50,
      };
      expect(resolvePositionToWorld(pos, odrDoc)).toBeNull();
    });

    it('returns null when odrDoc is null', () => {
      const pos: Position = {
        type: 'lanePosition',
        roadId: '1',
        laneId: '-1',
        s: 50,
      };
      expect(resolvePositionToWorld(pos, null)).toBeNull();
    });
  });

  describe('LanePosition with laneOffset', () => {
    it('applies laneOffset to right lane center position', () => {
      const odrDoc = makeStraightRoadDocWithLaneOffset(3.5);
      const pos: Position = {
        type: 'lanePosition',
        roadId: '1',
        laneId: '-1',
        s: 50,
      };
      const result = resolvePositionToWorld(pos, odrDoc);
      expect(result).not.toBeNull();
      // Without offset: right lane center at y = -1.75
      // With laneOffset a=3.5: center shifts by +3.5 → y ≈ +1.75
      expect(result!.y).toBeCloseTo(1.75, 1);
    });

    it('applies laneOffset to left lane center position', () => {
      const odrDoc = makeStraightRoadDocWithLaneOffset(3.5);
      const pos: Position = {
        type: 'lanePosition',
        roadId: '1',
        laneId: '1',
        s: 50,
      };
      const result = resolvePositionToWorld(pos, odrDoc);
      expect(result).not.toBeNull();
      // Without offset: left lane center at y = +1.75
      // With laneOffset a=3.5: center shifts by +3.5 → y ≈ +5.25
      expect(result!.y).toBeCloseTo(5.25, 1);
    });

    it('zero laneOffset produces same result as no laneOffset', () => {
      const docNoOff = makeStraightRoadDoc();
      const docZeroOff = makeStraightRoadDocWithLaneOffset(0);
      const pos: Position = {
        type: 'lanePosition',
        roadId: '1',
        laneId: '-1',
        s: 50,
      };
      const r1 = resolvePositionToWorld(pos, docNoOff);
      const r2 = resolvePositionToWorld(pos, docZeroOff);
      expect(r1).not.toBeNull();
      expect(r2).not.toBeNull();
      expect(r1!.y).toBeCloseTo(r2!.y, 5);
    });
  });

  describe('RoadPosition', () => {
    it('resolves using road reference line and t offset', () => {
      const odrDoc = makeStraightRoadDoc();
      const pos: Position = {
        type: 'roadPosition',
        roadId: '1',
        s: 25,
        t: 3.0,
      };
      const result = resolvePositionToWorld(pos, odrDoc);
      expect(result).not.toBeNull();
      expect(result!.x).toBeCloseTo(25, 0);
      expect(result!.y).toBeCloseTo(3.0, 1);
    });
  });

  describe('Relative positions', () => {
    it('returns null for relativeWorldPosition', () => {
      const pos: Position = {
        type: 'relativeWorldPosition',
        entityRef: 'Ego',
        dx: 10,
        dy: 5,
      };
      expect(resolvePositionToWorld(pos, null)).toBeNull();
    });

    it('returns null for relativeObjectPosition', () => {
      const pos: Position = {
        type: 'relativeObjectPosition',
        entityRef: 'Ego',
        dx: 10,
        dy: 5,
      };
      expect(resolvePositionToWorld(pos, null)).toBeNull();
    });

    it('returns null for relativeLanePosition', () => {
      const pos: Position = {
        type: 'relativeLanePosition',
        entityRef: 'Ego',
        dLane: 1,
      };
      expect(resolvePositionToWorld(pos, null)).toBeNull();
    });
  });

  describe('Unsupported positions', () => {
    it('returns null for geoPosition', () => {
      const pos: Position = {
        type: 'geoPosition',
        latitude: 48.0,
        longitude: 11.0,
      };
      expect(resolvePositionToWorld(pos, null)).toBeNull();
    });
  });

  // The road mesh now banks (superelevation roll + crossSectionSurface height),
  // so the resolvers must place reference points ON that banked surface, not on
  // the flat centerline — matching lane-boundary.ts's stToXyz math exactly.
  describe('superelevation banking', () => {
    it('places a road position on the banked surface (z += t·sin(roll), lateral t·cos(roll))', () => {
      const roll = 0.1;
      const doc = makeSuperelevatedDoc(roll, 2);
      const r = resolvePositionToWorld({ type: 'roadPosition', roadId: '1', s: 50, t: 3 }, doc)!;
      expect(r).not.toBeNull();
      expect(r.y).toBeCloseTo(3 * Math.cos(roll), 5); // lateral shrinks
      expect(r.z).toBeCloseTo(2 + 3 * Math.sin(roll), 5); // rises onto the bank
      expect(r.roll).toBeCloseTo(roll, 6); // model-tilt roll preserved
    });

    it('places a lane position on the banked surface (lane center t = -1.75)', () => {
      const roll = 0.1;
      const doc = makeSuperelevatedDoc(roll, 2);
      const r = resolvePositionToWorld({ type: 'lanePosition', roadId: '1', laneId: '-1', s: 50 }, doc)!;
      const t = -1.75; // right lane, 3.5m wide → center at -1.75
      expect(r.y).toBeCloseTo(t * Math.cos(roll), 4);
      expect(r.z).toBeCloseTo(2 + t * Math.sin(roll), 4);
      expect(r.roll).toBeCloseTo(roll, 6);
    });

    it('matches the velodrome banking numbers (t=-9, roll=-60° → z ≈ +7.79)', () => {
      const roll = -Math.PI / 3;
      const doc = makeSuperelevatedDoc(roll, 0);
      const r = resolvePositionToWorld({ type: 'roadPosition', roadId: '1', s: 50, t: -9 }, doc)!;
      expect(r.z).toBeCloseTo(7.79, 2); // -9·sin(-60°) = +7.794
      expect(r.y).toBeCloseTo(-4.5, 2); // -9·cos(-60°) = -4.5
    });
  });

  describe('crossSectionSurface banking', () => {
    it('offsets a road position by the height field and keeps roll at 0', () => {
      const doc = crossFallDoc();
      const center = resolvePositionToWorld({ type: 'roadPosition', roadId: '1', s: 0, t: 0 }, doc)!;
      // tOffset base at (s=0, t=0); the surface is a height field, not a rotation.
      expect(center.z).toBeCloseTo(-0.375, 3);
      expect(center.roll).toBe(0);
    });

    it('tilts opposite directions left vs right of the reference line', () => {
      const doc = crossFallDoc();
      const center = resolvePositionToWorld({ type: 'roadPosition', roadId: '1', s: 0, t: 0 }, doc)!;
      const left = resolvePositionToWorld({ type: 'roadPosition', roadId: '1', s: 0, t: 5 }, doc)!;
      const right = resolvePositionToWorld({ type: 'roadPosition', roadId: '1', s: 0, t: -5 }, doc)!;
      expect(left.z - center.z).toBeLessThan(0);
      expect(right.z - center.z).toBeGreaterThan(0);
      // A height field does not shrink the lateral offset (no rotation): the t=5
      // point stays a full 5 m from the centerline in the XY plane.
      const dxy = Math.hypot(left.x - center.x, left.y - center.y);
      expect(dxy).toBeCloseTo(5, 6);
    });
  });
});
