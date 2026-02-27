import { describe, it, expect } from 'vitest';
import { resolvePositionToWorld } from '../../utils/position-resolver.js';
import type { Position } from '@osce/shared';
import { makeStraightRoadDoc } from '../helpers.js';

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
});
