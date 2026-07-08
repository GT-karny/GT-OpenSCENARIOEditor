import { describe, it, expect, beforeEach } from 'vitest';
import {
  AddGeometryCommand,
  RemoveGeometryCommand,
  UpdateGeometryCommand,
} from '../../commands/geometry-commands.js';
import { createTestDocument, createTestRoad, createMockGetSet } from '../helpers.js';
import { evaluateGeometry } from '@osce/opendrive';
import type { OpenDriveDocument, OdrGeometry } from '@osce/shared';

/** Narrow a geometry to a specific variant, failing the test if it does not match. */
function asVariant<T extends OdrGeometry['type']>(
  geo: OdrGeometry,
  type: T,
): Extract<OdrGeometry, { type: T }> {
  expect(geo.type).toBe(type);
  if (geo.type !== type) throw new Error(`expected ${type}`);
  return geo as Extract<OdrGeometry, { type: T }>;
}

describe('Geometry Commands', () => {
  let doc: OpenDriveDocument;
  let mock: ReturnType<typeof createMockGetSet>;

  beforeEach(() => {
    doc = createTestDocument();
    doc.roads.push(createTestRoad());
    mock = createMockGetSet(doc);
  });

  describe('AddGeometryCommand', () => {
    it('adds a geometry segment to a road planView', () => {
      const cmd = new AddGeometryCommand(
        'road-1',
        { s: 100, x: 100, y: 0, hdg: 0, length: 30, type: 'line' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      expect(result.roads[0].planView).toHaveLength(3);
      expect(result.roads[0].planView[2].s).toBe(100);
      expect(result.roads[0].planView[2].length).toBe(30);
      expect(result.roads[0].planView[2].type).toBe('line');
    });

    it('adds a geometry segment at a specific index', () => {
      const cmd = new AddGeometryCommand(
        'road-1',
        { s: 25, x: 25, y: 0, hdg: 0, length: 25, type: 'arc', curvature: 0.01 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
        1, // insert at index 1
      );
      cmd.execute();

      const result = mock.getLatest();
      expect(result.roads[0].planView).toHaveLength(3);
      expect(asVariant(result.roads[0].planView[1], 'arc').curvature).toBe(0.01);
    });

    it('uses default values for unspecified fields', () => {
      const cmd = new AddGeometryCommand(
        'road-1',
        {},
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      const added = result.roads[0].planView[2];
      // Placement (s, x, y, hdg) is re-chained onto the end of the prior segment;
      // the two seed line segments span s=0..100 along +x, so the appended
      // segment starts at s=100 / (100, 0) with unchanged heading.
      expect(added.s).toBe(100);
      expect(added.x).toBe(100);
      expect(added.y).toBe(0);
      expect(added.hdg).toBe(0);
      expect(added.length).toBe(10);
      expect(added.type).toBe('line');
    });

    it('marks the road as dirty', () => {
      const cmd = new AddGeometryCommand(
        'road-1',
        { s: 100, x: 100, y: 0, hdg: 0, length: 30, type: 'line' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getDirtyRoads()).toContain('road-1');
    });

    it('does nothing for non-existent road', () => {
      const cmd = new AddGeometryCommand(
        'nonexistent',
        { s: 0, x: 0, y: 0, hdg: 0, length: 10, type: 'line' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getLatest().roads[0].planView).toHaveLength(2);
    });

    it('undo removes the added geometry', () => {
      const cmd = new AddGeometryCommand(
        'road-1',
        { s: 100, x: 100, y: 0, hdg: 0, length: 30, type: 'line' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();
      expect(mock.getLatest().roads[0].planView).toHaveLength(3);

      cmd.undo();
      expect(mock.getLatest().roads[0].planView).toHaveLength(2);
    });

    it('getCreatedGeometry returns the created segment', () => {
      const cmd = new AddGeometryCommand(
        'road-1',
        { s: 100, x: 100, y: 0, hdg: 0, length: 30, type: 'arc', curvature: 0.05 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      const geo = cmd.getCreatedGeometry();
      expect(asVariant(geo, 'arc').curvature).toBe(0.05);
    });
  });

  describe('RemoveGeometryCommand', () => {
    it('removes a geometry segment by index', () => {
      const cmd = new RemoveGeometryCommand(
        'road-1',
        1,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      expect(result.roads[0].planView).toHaveLength(1);
      expect(result.roads[0].planView[0].s).toBe(0);
    });

    it('removes the first geometry segment', () => {
      const cmd = new RemoveGeometryCommand(
        'road-1',
        0,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      expect(result.roads[0].planView).toHaveLength(1);
      expect(result.roads[0].planView[0].s).toBe(50);
    });

    it('does nothing for invalid index', () => {
      const cmd = new RemoveGeometryCommand(
        'road-1',
        5,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getLatest().roads[0].planView).toHaveLength(2);
    });

    it('does nothing for negative index', () => {
      const cmd = new RemoveGeometryCommand(
        'road-1',
        -1,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getLatest().roads[0].planView).toHaveLength(2);
    });

    it('does nothing for non-existent road', () => {
      const cmd = new RemoveGeometryCommand(
        'nonexistent',
        0,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getLatest().roads[0].planView).toHaveLength(2);
    });

    it('marks the road as dirty', () => {
      const cmd = new RemoveGeometryCommand(
        'road-1',
        0,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getDirtyRoads()).toContain('road-1');
    });

    it('undo restores the removed geometry at correct index', () => {
      const cmd = new RemoveGeometryCommand(
        'road-1',
        0,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();
      expect(mock.getLatest().roads[0].planView).toHaveLength(1);

      cmd.undo();
      const result = mock.getLatest();
      expect(result.roads[0].planView).toHaveLength(2);
      expect(result.roads[0].planView[0].s).toBe(0);
      expect(result.roads[0].planView[1].s).toBe(50);
    });
  });

  describe('UpdateGeometryCommand', () => {
    it('updates geometry segment properties', () => {
      const cmd = new UpdateGeometryCommand(
        'road-1',
        0,
        { x: 10, y: 20, hdg: 1.57 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      expect(result.roads[0].planView[0].x).toBe(10);
      expect(result.roads[0].planView[0].y).toBe(20);
      expect(result.roads[0].planView[0].hdg).toBe(1.57);
      // Unchanged fields remain
      expect(result.roads[0].planView[0].s).toBe(0);
      expect(result.roads[0].planView[0].length).toBe(50);
    });

    it('can change geometry type and type-specific params', () => {
      const cmd = new UpdateGeometryCommand(
        'road-1',
        0,
        { type: 'arc', curvature: 0.02 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      expect(asVariant(result.roads[0].planView[0], 'arc').curvature).toBe(0.02);
    });

    it('can update spiral parameters', () => {
      // First make it a spiral
      const cmd1 = new UpdateGeometryCommand(
        'road-1',
        0,
        { type: 'spiral', curvStart: 0, curvEnd: 0.05 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd1.execute();

      const result = mock.getLatest();
      const spiral = asVariant(result.roads[0].planView[0], 'spiral');
      expect(spiral.curvStart).toBe(0);
      expect(spiral.curvEnd).toBe(0.05);
    });

    it('can update paramPoly3 parameters', () => {
      const cmd = new UpdateGeometryCommand(
        'road-1',
        0,
        {
          type: 'paramPoly3',
          aU: 0,
          bU: 1,
          cU: 0,
          dU: 0,
          aV: 0,
          bV: 0,
          cV: 1,
          dV: 0,
          pRange: 'normalized',
        },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      const pp = asVariant(result.roads[0].planView[0], 'paramPoly3');
      expect(pp.bU).toBe(1);
      expect(pp.cV).toBe(1);
      expect(pp.pRange).toBe('normalized');
    });

    it('does nothing for invalid geometry index', () => {
      const cmd = new UpdateGeometryCommand(
        'road-1',
        10,
        { x: 999 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      // Nothing changed
      expect(mock.getLatest().roads[0].planView[0].x).toBe(0);
    });

    it('does nothing for non-existent road', () => {
      const cmd = new UpdateGeometryCommand(
        'nonexistent',
        0,
        { x: 999 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getLatest().roads[0].planView[0].x).toBe(0);
    });

    it('marks the road as dirty', () => {
      const cmd = new UpdateGeometryCommand(
        'road-1',
        0,
        { x: 10 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getDirtyRoads()).toContain('road-1');
    });

    it('undo restores previous geometry state', () => {
      const originalX = mock.getLatest().roads[0].planView[0].x;
      const originalY = mock.getLatest().roads[0].planView[0].y;

      const cmd = new UpdateGeometryCommand(
        'road-1',
        0,
        { x: 999, y: 888, type: 'arc', curvature: 0.1 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();
      expect(mock.getLatest().roads[0].planView[0].x).toBe(999);

      cmd.undo();
      const result = mock.getLatest();
      const restored = result.roads[0].planView[0];
      expect(restored.x).toBe(originalX);
      expect(restored.y).toBe(originalY);
      expect(restored.type).toBe('line');
      // The restored line must not carry a leftover curvature field.
      expect((restored as { curvature?: number }).curvature).toBeUndefined();
    });

    it('undo does nothing if execute did not find the road', () => {
      const cmd = new UpdateGeometryCommand(
        'nonexistent',
        0,
        { x: 999 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();
      cmd.undo(); // should not throw

      expect(mock.getLatest().roads[0].planView[0].x).toBe(0);
    });
  });

  describe('undo/redo integration', () => {
    it('add then undo then redo restores geometry', () => {
      const cmd = new AddGeometryCommand(
        'road-1',
        { s: 100, x: 100, y: 0, hdg: 0, length: 30, type: 'line' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );

      cmd.execute();
      expect(mock.getLatest().roads[0].planView).toHaveLength(3);

      cmd.undo();
      expect(mock.getLatest().roads[0].planView).toHaveLength(2);

      cmd.execute(); // redo
      expect(mock.getLatest().roads[0].planView).toHaveLength(3);
    });

    it('remove then undo then redo cycle', () => {
      const cmd = new RemoveGeometryCommand(
        'road-1',
        0,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );

      cmd.execute();
      expect(mock.getLatest().roads[0].planView).toHaveLength(1);

      cmd.undo();
      expect(mock.getLatest().roads[0].planView).toHaveLength(2);

      cmd.execute(); // redo
      expect(mock.getLatest().roads[0].planView).toHaveLength(1);
    });

    it('update then undo then redo cycle', () => {
      const cmd = new UpdateGeometryCommand(
        'road-1',
        0,
        { x: 42, y: 84 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );

      cmd.execute();
      expect(mock.getLatest().roads[0].planView[0].x).toBe(42);

      cmd.undo();
      expect(mock.getLatest().roads[0].planView[0].x).toBe(0);

      cmd.execute(); // redo
      expect(mock.getLatest().roads[0].planView[0].x).toBe(42);
    });

    it('multiple sequential operations with undo', () => {
      // Add a segment
      const addCmd = new AddGeometryCommand(
        'road-1',
        { s: 100, x: 100, y: 0, hdg: 0, length: 30, type: 'arc', curvature: 0.02 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      addCmd.execute();
      expect(mock.getLatest().roads[0].planView).toHaveLength(3);

      // Update the new segment
      const updateCmd = new UpdateGeometryCommand(
        'road-1',
        2,
        { curvature: 0.05 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      updateCmd.execute();
      expect(asVariant(mock.getLatest().roads[0].planView[2], 'arc').curvature).toBe(0.05);

      // Undo update
      updateCmd.undo();
      expect(asVariant(mock.getLatest().roads[0].planView[2], 'arc').curvature).toBe(0.02);

      // Undo add
      addCmd.undo();
      expect(mock.getLatest().roads[0].planView).toHaveLength(2);
    });
  });

  describe('planView normalization (s-chain, poses, road.length)', () => {
    it('add appends and refreshes road.length to the segment-length sum', () => {
      // Seed road: two 50m lines, length 100.
      const cmd = new AddGeometryCommand(
        'road-1',
        { type: 'line', length: 30 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const road = mock.getLatest().roads[0];
      expect(road.planView).toHaveLength(3);
      expect(road.planView[2].s).toBe(100);
      expect(road.length).toBe(130);
    });

    it('remove middle re-chains the following segments and refreshes road.length', () => {
      // arc → line → line; removing the middle line must re-chain the trailing
      // line onto the arc's curved end pose.
      const doc = createTestDocument();
      doc.roads.push(
        createTestRoad({
          length: 120,
          planView: [
            { type: 'arc', s: 0, x: 0, y: 0, hdg: 0, length: 40, curvature: 0.02 },
            { type: 'line', s: 40, x: 0, y: 0, hdg: 0, length: 50 },
            { type: 'line', s: 90, x: 0, y: 0, hdg: 0, length: 30 },
          ],
        }),
      );
      const m = createMockGetSet(doc);

      new RemoveGeometryCommand('road-1', 1, m.getDoc, m.setDoc, m.markDirtyRoad).execute();

      const pv = m.getLatest().roads[0].planView;
      expect(pv).toHaveLength(2);
      // s is contiguous from the (kept) first segment's s.
      expect(pv[1].s).toBe(pv[0].s + pv[0].length);
      // Start pose of the trailing segment equals the end pose of the arc.
      const arcEnd = evaluateGeometry(pv[0].length, pv[0]);
      expect(pv[1].x).toBeCloseTo(arcEnd.x, 9);
      expect(pv[1].y).toBeCloseTo(arcEnd.y, 9);
      expect(pv[1].hdg).toBeCloseTo(arcEnd.hdg, 9);
      // road.length = firstS + Σ length = 0 + 40 + 30.
      expect(m.getLatest().roads[0].length).toBe(70);
    });

    it('remove terminal shrinks road.length', () => {
      // Seed road: two 50m lines, length 100.
      new RemoveGeometryCommand('road-1', 1, mock.getDoc, mock.setDoc, mock.markDirtyRoad).execute();

      const road = mock.getLatest().roads[0];
      expect(road.planView).toHaveLength(1);
      expect(road.length).toBe(50);
    });

    it('undo restores the exact prior planView and road.length', () => {
      const before = structuredClone(mock.getLatest().roads[0]);

      const cmd = new RemoveGeometryCommand(
        'road-1',
        1,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();
      expect(mock.getLatest().roads[0].length).toBe(50);

      cmd.undo();
      const restored = mock.getLatest().roads[0];
      expect(restored.planView).toEqual(before.planView);
      expect(restored.length).toBe(before.length);
    });

    it('update that changes a segment length re-chains and refreshes road.length', () => {
      // Grow the first of two 50m lines to 80m: the second must slide to s=80 and
      // road.length must become 80 + 50.
      const cmd = new UpdateGeometryCommand(
        'road-1',
        0,
        { length: 80 },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const road = mock.getLatest().roads[0];
      expect(road.planView[1].s).toBe(80);
      expect(road.planView[1].x).toBeCloseTo(80, 9);
      expect(road.length).toBe(130);
    });
  });
});
