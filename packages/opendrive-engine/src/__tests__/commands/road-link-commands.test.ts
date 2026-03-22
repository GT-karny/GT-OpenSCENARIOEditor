import { describe, it, expect, beforeEach } from 'vitest';
import {
  SetRoadLinkCommand,
  SplitRoadCommand,
  JoinRoadsCommand,
} from '../../commands/road-link-commands.js';
import { createTestDocument, createTestRoad, createMockGetSet } from '../helpers.js';
import type { OpenDriveDocument, OdrRoad } from '@osce/shared';

describe('Road Link Commands', () => {
  let doc: OpenDriveDocument;
  let mock: ReturnType<typeof createMockGetSet>;

  beforeEach(() => {
    doc = createTestDocument();
    doc.roads.push(createTestRoad({ id: 'road-1', name: 'Road1' }));
    doc.roads.push(createTestRoad({ id: 'road-2', name: 'Road2' }));
    mock = createMockGetSet(doc);
  });

  describe('SetRoadLinkCommand', () => {
    it('sets a successor link on a road', () => {
      const cmd = new SetRoadLinkCommand(
        'road-1',
        'successor',
        { elementType: 'road', elementId: 'road-2', contactPoint: 'start' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      expect(result.roads[0].link?.successor?.elementId).toBe('road-2');
      expect(result.roads[0].link?.successor?.contactPoint).toBe('start');
    });

    it('sets a predecessor link on a road', () => {
      const cmd = new SetRoadLinkCommand(
        'road-2',
        'predecessor',
        { elementType: 'road', elementId: 'road-1', contactPoint: 'end' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      expect(result.roads[1].link?.predecessor?.elementId).toBe('road-1');
      expect(result.roads[1].link?.predecessor?.contactPoint).toBe('end');
    });

    it('sets a junction link', () => {
      const cmd = new SetRoadLinkCommand(
        'road-1',
        'successor',
        { elementType: 'junction', elementId: 'junction-1' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      expect(result.roads[0].link?.successor?.elementType).toBe('junction');
      expect(result.roads[0].link?.successor?.elementId).toBe('junction-1');
    });

    it('clears a link when linkElement is undefined', () => {
      // First set a link
      const setCmd = new SetRoadLinkCommand(
        'road-1',
        'successor',
        { elementType: 'road', elementId: 'road-2', contactPoint: 'start' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      setCmd.execute();
      expect(mock.getLatest().roads[0].link?.successor).toBeDefined();

      // Then clear it
      const clearCmd = new SetRoadLinkCommand(
        'road-1',
        'successor',
        undefined,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      clearCmd.execute();
      // When both predecessor and successor are cleared, link should be undefined
      expect(mock.getLatest().roads[0].link).toBeUndefined();
    });

    it('marks the road as dirty', () => {
      const cmd = new SetRoadLinkCommand(
        'road-1',
        'successor',
        { elementType: 'road', elementId: 'road-2', contactPoint: 'start' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getDirtyRoads()).toContain('road-1');
    });

    it('undo restores previous link state', () => {
      const cmd = new SetRoadLinkCommand(
        'road-1',
        'successor',
        { elementType: 'road', elementId: 'road-2', contactPoint: 'start' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();
      expect(mock.getLatest().roads[0].link?.successor).toBeDefined();

      cmd.undo();
      expect(mock.getLatest().roads[0].link).toBeUndefined();
    });

    it('undo restores existing predecessor when successor is changed', () => {
      // Set predecessor first
      const predCmd = new SetRoadLinkCommand(
        'road-1',
        'predecessor',
        { elementType: 'road', elementId: 'road-2', contactPoint: 'end' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      predCmd.execute();

      // Set successor
      const succCmd = new SetRoadLinkCommand(
        'road-1',
        'successor',
        { elementType: 'road', elementId: 'road-2', contactPoint: 'start' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      succCmd.execute();
      expect(mock.getLatest().roads[0].link?.successor).toBeDefined();
      expect(mock.getLatest().roads[0].link?.predecessor).toBeDefined();

      // Undo successor — predecessor should remain
      succCmd.undo();
      expect(mock.getLatest().roads[0].link?.successor).toBeUndefined();
      expect(mock.getLatest().roads[0].link?.predecessor?.elementId).toBe('road-2');
    });

    it('does nothing for non-existent road', () => {
      const cmd = new SetRoadLinkCommand(
        'nonexistent',
        'successor',
        { elementType: 'road', elementId: 'road-2', contactPoint: 'start' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getLatest().roads[0].link).toBeUndefined();
      expect(mock.getLatest().roads[1].link).toBeUndefined();
    });
  });

  describe('SplitRoadCommand', () => {
    it('splits a road at the midpoint', () => {
      const cmd = new SplitRoadCommand(
        'road-1',
        50,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      // Original road is shortened
      expect(result.roads[0].length).toBe(50);
      expect(result.roads[0].planView).toHaveLength(1);
      expect(result.roads[0].planView[0].length).toBe(50);

      // New road is created
      expect(result.roads).toHaveLength(3); // road-1, road-2, new split road
      const newRoad = result.roads.find((r: OdrRoad) => r.id === cmd.getNewRoadId());
      expect(newRoad).toBeDefined();
      expect(newRoad!.length).toBe(50);
      expect(newRoad!.planView).toHaveLength(1);
    });

    it('sets up proper links between split roads', () => {
      const cmd = new SplitRoadCommand(
        'road-1',
        50,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      const originalRoad = result.roads[0];
      const newRoad = result.roads.find((r: OdrRoad) => r.id === cmd.getNewRoadId())!;

      // Original road's successor is the new road
      expect(originalRoad.link?.successor?.elementId).toBe(cmd.getNewRoadId());
      expect(originalRoad.link?.successor?.contactPoint).toBe('start');

      // New road's predecessor is the original road
      expect(newRoad.link?.predecessor?.elementId).toBe('road-1');
      expect(newRoad.link?.predecessor?.contactPoint).toBe('end');
    });

    it('splits geometry that spans the split point', () => {
      // Create a road with a single long geometry spanning the split
      doc.roads[0] = createTestRoad({
        id: 'road-1',
        length: 100,
        planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
      });
      mock = createMockGetSet(doc);

      const cmd = new SplitRoadCommand(
        'road-1',
        40,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      expect(result.roads[0].planView[0].length).toBe(40);

      const newRoad = result.roads.find((r: OdrRoad) => r.id === cmd.getNewRoadId())!;
      expect(newRoad.planView[0].s).toBe(0);
      expect(newRoad.planView[0].length).toBe(60);
    });

    it('does nothing for split at s=0', () => {
      const cmd = new SplitRoadCommand(
        'road-1',
        0,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getLatest().roads).toHaveLength(2);
    });

    it('does nothing for split at road length', () => {
      const cmd = new SplitRoadCommand(
        'road-1',
        100,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getLatest().roads).toHaveLength(2);
    });

    it('does nothing for non-existent road', () => {
      const cmd = new SplitRoadCommand(
        'nonexistent',
        50,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getLatest().roads).toHaveLength(2);
    });

    it('marks both roads as dirty', () => {
      const cmd = new SplitRoadCommand(
        'road-1',
        50,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getDirtyRoads()).toContain('road-1');
      expect(mock.getDirtyRoads()).toContain(cmd.getNewRoadId());
    });

    it('undo restores the original road and removes the split road', () => {
      const originalPlanView = structuredClone(doc.roads[0].planView);
      const cmd = new SplitRoadCommand(
        'road-1',
        50,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();
      expect(mock.getLatest().roads).toHaveLength(3);

      cmd.undo();
      const result = mock.getLatest();
      expect(result.roads).toHaveLength(2);
      expect(result.roads[0].length).toBe(100);
      expect(result.roads[0].planView).toEqual(originalPlanView);
    });

    it('preserves successor link when splitting a linked road', () => {
      // Set road-1's successor to road-2
      const linkCmd = new SetRoadLinkCommand(
        'road-1',
        'successor',
        { elementType: 'road', elementId: 'road-2', contactPoint: 'start' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      linkCmd.execute();

      const splitCmd = new SplitRoadCommand(
        'road-1',
        50,
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      splitCmd.execute();

      const result = mock.getLatest();
      const newRoad = result.roads.find((r: OdrRoad) => r.id === splitCmd.getNewRoadId())!;

      // New road inherits the original successor
      expect(newRoad.link?.successor?.elementId).toBe('road-2');
    });
  });

  describe('JoinRoadsCommand', () => {
    beforeEach(() => {
      // Set up road-1 -> road-2 connection
      const linkCmd = new SetRoadLinkCommand(
        'road-1',
        'successor',
        { elementType: 'road', elementId: 'road-2', contactPoint: 'start' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      linkCmd.execute();

      const linkCmd2 = new SetRoadLinkCommand(
        'road-2',
        'predecessor',
        { elementType: 'road', elementId: 'road-1', contactPoint: 'end' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      linkCmd2.execute();
    });

    it('joins two connected roads', () => {
      const cmd = new JoinRoadsCommand(
        'road-1',
        'road-2',
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      expect(result.roads).toHaveLength(1);
      expect(result.roads[0].id).toBe('road-1');
      expect(result.roads[0].length).toBe(200); // 100 + 100
    });

    it('merges geometry from both roads', () => {
      const cmd = new JoinRoadsCommand(
        'road-1',
        'road-2',
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      // road-1 had 2 geo segments, road-2 had 2 geo segments
      expect(result.roads[0].planView).toHaveLength(4);
      // Second road's geometry s values should be shifted by first road's length
      expect(result.roads[0].planView[2].s).toBe(100); // 0 + 100
      expect(result.roads[0].planView[3].s).toBe(150); // 50 + 100
    });

    it('merges lane sections from both roads', () => {
      const cmd = new JoinRoadsCommand(
        'road-1',
        'road-2',
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      const result = mock.getLatest();
      // Each road had 1 lane section
      expect(result.roads[0].lanes).toHaveLength(2);
      expect(result.roads[0].lanes[1].s).toBe(100);
    });

    it('does nothing for unconnected roads', () => {
      // Remove the connection
      doc = createTestDocument();
      doc.roads.push(createTestRoad({ id: 'road-1', name: 'Road1' }));
      doc.roads.push(createTestRoad({ id: 'road-2', name: 'Road2' }));
      mock = createMockGetSet(doc);

      const cmd = new JoinRoadsCommand(
        'road-1',
        'road-2',
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getLatest().roads).toHaveLength(2);
    });

    it('does nothing for non-existent road', () => {
      const cmd = new JoinRoadsCommand(
        'nonexistent',
        'road-2',
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getLatest().roads).toHaveLength(2);
    });

    it('marks the joined road as dirty', () => {
      mock = createMockGetSet(mock.getLatest()); // reset dirty tracking
      const cmd = new JoinRoadsCommand(
        'road-1',
        'road-2',
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();

      expect(mock.getDirtyRoads()).toContain('road-1');
    });

    it('undo restores both roads', () => {
      const originalDoc = structuredClone(mock.getLatest());
      const cmd = new JoinRoadsCommand(
        'road-1',
        'road-2',
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      cmd.execute();
      expect(mock.getLatest().roads).toHaveLength(1);

      cmd.undo();
      const result = mock.getLatest();
      expect(result.roads).toHaveLength(2);
      expect(result.roads[0].id).toBe('road-1');
      expect(result.roads[1].id).toBe('road-2');
      expect(result.roads[0].length).toBe(originalDoc.roads[0].length);
      expect(result.roads[1].length).toBe(originalDoc.roads[1].length);
    });

    it('inherits second road successor link', () => {
      // Add a third road and link road-2 -> road-3
      doc = structuredClone(mock.getLatest());
      doc.roads.push(createTestRoad({ id: 'road-3', name: 'Road3' }));
      mock = createMockGetSet(doc);

      const linkCmd = new SetRoadLinkCommand(
        'road-2',
        'successor',
        { elementType: 'road', elementId: 'road-3', contactPoint: 'start' },
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      linkCmd.execute();

      const joinCmd = new JoinRoadsCommand(
        'road-1',
        'road-2',
        mock.getDoc,
        mock.setDoc,
        mock.markDirtyRoad,
      );
      joinCmd.execute();

      const result = mock.getLatest();
      // Joined road should inherit road-2's successor (road-3)
      expect(result.roads[0].link?.successor?.elementId).toBe('road-3');
    });
  });
});
