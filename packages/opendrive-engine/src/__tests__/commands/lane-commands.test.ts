import { describe, it, expect, beforeEach } from 'vitest';
import type { OpenDriveDocument } from '@osce/shared';
import {
  AddLaneCommand,
  RemoveLaneCommand,
  UpdateLaneCommand,
  SplitLaneSectionCommand,
} from '../../commands/lane-commands.js';
import { AddRoadCommand } from '../../commands/road-commands.js';
import { CommandHistory } from '@osce/scenario-engine';
import { createDefaultDocument } from '../../store/defaults.js';

describe('Lane Commands', () => {
  let doc: OpenDriveDocument;
  let history: CommandHistory;
  const dirtyIds = new Set<string>();

  const getDoc = () => doc;
  const setDoc = (d: OpenDriveDocument) => {
    doc = d;
  };
  const markDirty = (id: string) => {
    dirtyIds.add(id);
  };

  let roadId: string;

  beforeEach(() => {
    doc = createDefaultDocument();
    history = new CommandHistory();
    dirtyIds.clear();

    // Add a road with a default lane section for lane tests
    const addRoad = new AddRoadCommand({ name: 'TestRoad', length: 100 }, getDoc, setDoc, markDirty);
    history.execute(addRoad);
    roadId = addRoad.getCreatedRoad().id;
  });

  describe('AddLaneCommand', () => {
    it('adds a lane to the left side', () => {
      const cmd = new AddLaneCommand(roadId, 0, 'left', { type: 'shoulder' }, getDoc, setDoc, markDirty);
      history.execute(cmd);

      const section = doc.roads[0].lanes[0];
      expect(section.leftLanes).toHaveLength(2);
      expect(section.leftLanes[1].type).toBe('shoulder');
      expect(dirtyIds.has(roadId)).toBe(true);
    });

    it('adds a lane to the right side', () => {
      const cmd = new AddLaneCommand(roadId, 0, 'right', { type: 'sidewalk' }, getDoc, setDoc, markDirty);
      history.execute(cmd);

      const section = doc.roads[0].lanes[0];
      expect(section.rightLanes).toHaveLength(2);
      expect(section.rightLanes[1].type).toBe('sidewalk');
    });

    it('assigns correct lane IDs automatically', () => {
      // Left lanes get positive IDs
      const leftCmd = new AddLaneCommand(roadId, 0, 'left', {}, getDoc, setDoc, markDirty);
      history.execute(leftCmd);
      expect(leftCmd.getCreatedLane().id).toBe(2); // existing left lane has id=1

      // Right lanes get negative IDs
      const rightCmd = new AddLaneCommand(roadId, 0, 'right', {}, getDoc, setDoc, markDirty);
      history.execute(rightCmd);
      expect(rightCmd.getCreatedLane().id).toBe(-2); // existing right lane has id=-1
    });

    it('undo removes the added lane', () => {
      const cmd = new AddLaneCommand(roadId, 0, 'left', { type: 'shoulder' }, getDoc, setDoc, markDirty);
      history.execute(cmd);
      expect(doc.roads[0].lanes[0].leftLanes).toHaveLength(2);

      history.undo();
      expect(doc.roads[0].lanes[0].leftLanes).toHaveLength(1);
    });

    it('redo re-adds the lane', () => {
      const cmd = new AddLaneCommand(roadId, 0, 'right', { type: 'parking' }, getDoc, setDoc, markDirty);
      history.execute(cmd);

      history.undo();
      expect(doc.roads[0].lanes[0].rightLanes).toHaveLength(1);

      history.redo();
      expect(doc.roads[0].lanes[0].rightLanes).toHaveLength(2);
      expect(doc.roads[0].lanes[0].rightLanes[1].type).toBe('parking');
    });

    it('does nothing for non-existent road', () => {
      const cmd = new AddLaneCommand('non-existent', 0, 'left', {}, getDoc, setDoc, markDirty);
      history.execute(cmd);
      // Should not throw, document unchanged
      expect(doc.roads[0].lanes[0].leftLanes).toHaveLength(1);
    });
  });

  describe('RemoveLaneCommand', () => {
    it('removes a lane by id', () => {
      const section = doc.roads[0].lanes[0];
      expect(section.leftLanes).toHaveLength(1);

      const cmd = new RemoveLaneCommand(roadId, 0, 'left', 1, getDoc, setDoc, markDirty);
      history.execute(cmd);

      expect(doc.roads[0].lanes[0].leftLanes).toHaveLength(0);
    });

    it('undo restores the removed lane', () => {
      const cmd = new RemoveLaneCommand(roadId, 0, 'left', 1, getDoc, setDoc, markDirty);
      history.execute(cmd);
      expect(doc.roads[0].lanes[0].leftLanes).toHaveLength(0);

      history.undo();
      expect(doc.roads[0].lanes[0].leftLanes).toHaveLength(1);
      expect(doc.roads[0].lanes[0].leftLanes[0].id).toBe(1);
    });

    it('does nothing for non-existent lane', () => {
      const cmd = new RemoveLaneCommand(roadId, 0, 'left', 999, getDoc, setDoc, markDirty);
      history.execute(cmd);
      expect(doc.roads[0].lanes[0].leftLanes).toHaveLength(1);
    });
  });

  describe('UpdateLaneCommand', () => {
    it('updates lane properties', () => {
      const cmd = new UpdateLaneCommand(
        roadId,
        0,
        'left',
        1,
        { type: 'shoulder' },
        getDoc,
        setDoc,
        markDirty,
      );
      history.execute(cmd);

      expect(doc.roads[0].lanes[0].leftLanes[0].type).toBe('shoulder');
    });

    it('undo restores previous lane state', () => {
      const cmd = new UpdateLaneCommand(
        roadId,
        0,
        'right',
        -1,
        { type: 'border' },
        getDoc,
        setDoc,
        markDirty,
      );
      history.execute(cmd);
      expect(doc.roads[0].lanes[0].rightLanes[0].type).toBe('border');

      history.undo();
      expect(doc.roads[0].lanes[0].rightLanes[0].type).toBe('driving');
    });

    it('does nothing for non-existent lane', () => {
      const cmd = new UpdateLaneCommand(
        roadId,
        0,
        'left',
        999,
        { type: 'shoulder' },
        getDoc,
        setDoc,
        markDirty,
      );
      history.execute(cmd);
      // Original lane unchanged
      expect(doc.roads[0].lanes[0].leftLanes[0].type).toBe('driving');
    });

    it('updates the center lane (id=0) instead of dropping the edit', () => {
      // Regression: center lane edits were routed to `right` and silently
      // discarded because rightLanes never contains id=0.
      expect(doc.roads[0].lanes[0].centerLane.type).toBe('none');

      const cmd = new UpdateLaneCommand(
        roadId,
        0,
        'center',
        0,
        { type: 'shoulder', roadMarks: [{ sOffset: 0, type: 'broken', color: 'white' }] },
        getDoc,
        setDoc,
        markDirty,
      );
      history.execute(cmd);

      const center = doc.roads[0].lanes[0].centerLane;
      expect(center.type).toBe('shoulder');
      expect(center.roadMarks[0].type).toBe('broken');
      expect(center.roadMarks[0].color).toBe('white');
      // Side lanes must be untouched.
      expect(doc.roads[0].lanes[0].leftLanes[0].type).toBe('driving');
      expect(doc.roads[0].lanes[0].rightLanes[0].type).toBe('driving');
      expect(dirtyIds.has(roadId)).toBe(true);
    });

    it('undo restores previous center-lane state', () => {
      const cmd = new UpdateLaneCommand(
        roadId,
        0,
        'center',
        0,
        { type: 'shoulder', roadMarks: [{ sOffset: 0, type: 'broken', color: 'white' }] },
        getDoc,
        setDoc,
        markDirty,
      );
      history.execute(cmd);
      expect(doc.roads[0].lanes[0].centerLane.type).toBe('shoulder');

      history.undo();
      expect(doc.roads[0].lanes[0].centerLane.type).toBe('none');
      expect(doc.roads[0].lanes[0].centerLane.roadMarks[0].type).toBe('solid');
      expect(doc.roads[0].lanes[0].centerLane.roadMarks[0].color).toBe('yellow');

      history.redo();
      expect(doc.roads[0].lanes[0].centerLane.type).toBe('shoulder');
      expect(doc.roads[0].lanes[0].centerLane.roadMarks[0].color).toBe('white');
    });

    it('center update leaves left/right lanes byte-identical', () => {
      const leftBefore = structuredClone(doc.roads[0].lanes[0].leftLanes);
      const rightBefore = structuredClone(doc.roads[0].lanes[0].rightLanes);

      const cmd = new UpdateLaneCommand(
        roadId,
        0,
        'center',
        0,
        { type: 'border' },
        getDoc,
        setDoc,
        markDirty,
      );
      history.execute(cmd);

      expect(doc.roads[0].lanes[0].leftLanes).toEqual(leftBefore);
      expect(doc.roads[0].lanes[0].rightLanes).toEqual(rightBefore);
    });
  });

  describe('SplitLaneSectionCommand', () => {
    it('splits a lane section at a given s-position', () => {
      expect(doc.roads[0].lanes).toHaveLength(1);

      const cmd = new SplitLaneSectionCommand(roadId, 0, 50, getDoc, setDoc, markDirty);
      history.execute(cmd);

      expect(doc.roads[0].lanes).toHaveLength(2);
      expect(doc.roads[0].lanes[0].s).toBe(0);
      expect(doc.roads[0].lanes[1].s).toBe(50);
    });

    it('clones lane configuration into new section', () => {
      // First add an extra lane
      const addLane = new AddLaneCommand(roadId, 0, 'left', { type: 'shoulder' }, getDoc, setDoc, markDirty);
      history.execute(addLane);

      const cmd = new SplitLaneSectionCommand(roadId, 0, 30, getDoc, setDoc, markDirty);
      history.execute(cmd);

      const newSection = doc.roads[0].lanes[1];
      expect(newSection.leftLanes).toHaveLength(2);
      expect(newSection.rightLanes).toHaveLength(1);
      expect(newSection.centerLane.id).toBe(0);
    });

    it('undo removes the split', () => {
      const cmd = new SplitLaneSectionCommand(roadId, 0, 50, getDoc, setDoc, markDirty);
      history.execute(cmd);
      expect(doc.roads[0].lanes).toHaveLength(2);

      history.undo();
      expect(doc.roads[0].lanes).toHaveLength(1);
      expect(doc.roads[0].lanes[0].s).toBe(0);
    });

    it('does nothing when split position is at section start', () => {
      const cmd = new SplitLaneSectionCommand(roadId, 0, 0, getDoc, setDoc, markDirty);
      history.execute(cmd);
      expect(doc.roads[0].lanes).toHaveLength(1);
    });

    it('does nothing when split position is at or beyond section end', () => {
      const cmd = new SplitLaneSectionCommand(roadId, 0, 100, getDoc, setDoc, markDirty);
      history.execute(cmd);
      expect(doc.roads[0].lanes).toHaveLength(1);
    });

    it('does nothing when split position is before section start', () => {
      // First split at 50, then try to split first section at -1
      const split1 = new SplitLaneSectionCommand(roadId, 0, 50, getDoc, setDoc, markDirty);
      history.execute(split1);

      const cmd = new SplitLaneSectionCommand(roadId, 0, -1, getDoc, setDoc, markDirty);
      history.execute(cmd);
      expect(doc.roads[0].lanes).toHaveLength(2);
    });

    it('respects next section boundary when splitting', () => {
      // Split at 50 first
      const split1 = new SplitLaneSectionCommand(roadId, 0, 50, getDoc, setDoc, markDirty);
      history.execute(split1);
      expect(doc.roads[0].lanes).toHaveLength(2);

      // Now split the first section at 30 (within [0, 50))
      const split2 = new SplitLaneSectionCommand(roadId, 0, 30, getDoc, setDoc, markDirty);
      history.execute(split2);
      expect(doc.roads[0].lanes).toHaveLength(3);
      expect(doc.roads[0].lanes[0].s).toBe(0);
      expect(doc.roads[0].lanes[1].s).toBe(30);
      expect(doc.roads[0].lanes[2].s).toBe(50);
    });

    it('redo re-applies the split', () => {
      const cmd = new SplitLaneSectionCommand(roadId, 0, 50, getDoc, setDoc, markDirty);
      history.execute(cmd);

      history.undo();
      expect(doc.roads[0].lanes).toHaveLength(1);

      history.redo();
      expect(doc.roads[0].lanes).toHaveLength(2);
      expect(doc.roads[0].lanes[1].s).toBe(50);
    });
  });

  describe('Mixed lane operations with undo/redo', () => {
    it('supports mixed add/update/remove operations', () => {
      // Add a lane
      const addCmd = new AddLaneCommand(
        roadId,
        0,
        'left',
        { type: 'shoulder' },
        getDoc,
        setDoc,
        markDirty,
      );
      history.execute(addCmd);
      const laneId = addCmd.getCreatedLane().id;

      // Update it
      const updateCmd = new UpdateLaneCommand(
        roadId,
        0,
        'left',
        laneId,
        { type: 'border' },
        getDoc,
        setDoc,
        markDirty,
      );
      history.execute(updateCmd);
      expect(doc.roads[0].lanes[0].leftLanes[1].type).toBe('border');

      // Undo update
      history.undo();
      expect(doc.roads[0].lanes[0].leftLanes[1].type).toBe('shoulder');

      // Undo add
      history.undo();
      expect(doc.roads[0].lanes[0].leftLanes).toHaveLength(1);

      // Redo both
      history.redo();
      history.redo();
      expect(doc.roads[0].lanes[0].leftLanes).toHaveLength(2);
      expect(doc.roads[0].lanes[0].leftLanes[1].type).toBe('border');
    });
  });
});
