import { describe, it, expect, beforeEach } from 'vitest';
import { createOpenDriveStore } from '../../store/opendrive-store.js';
import type { OpenDriveStore } from '../../store/opendrive-store.js';
import type { StoreApi } from 'zustand/vanilla';

describe('OpenDriveStore', () => {
  let store: StoreApi<OpenDriveStore>;
  let s: OpenDriveStore;

  beforeEach(() => {
    store = createOpenDriveStore();
    s = store.getState();
  });

  describe('createDocument', () => {
    it('creates a valid default document', () => {
      const doc = s.createDocument();
      expect(doc.header).toBeDefined();
      expect(doc.header.revMajor).toBe(1);
      expect(doc.header.revMinor).toBe(6);
      expect(doc.roads).toEqual([]);
      expect(doc.junctions).toEqual([]);
      expect(doc.controllers).toEqual([]);
      expect(store.getState().document).toEqual(doc);
    });

    it('clears undo/redo history', () => {
      s.addRoad({ name: 'R1' });
      s = store.getState();
      expect(s.canUndo()).toBe(true);
      s.createDocument();
      s = store.getState();
      expect(s.canUndo()).toBe(false);
    });
  });

  describe('loadDocument', () => {
    it('replaces the current document', () => {
      const doc = {
        header: { revMajor: 1, revMinor: 6, name: 'Loaded', date: '2025-01-01' },
        roads: [],
        controllers: [],
        junctions: [],
      };
      s.loadDocument(doc);
      s = store.getState();
      expect(s.getDocument().header.name).toBe('Loaded');
      expect(s.canUndo()).toBe(false);
    });
  });

  describe('road operations', () => {
    it('addRoad creates a road with defaults', () => {
      const road = s.addRoad({ name: 'MainRoad' });
      s = store.getState();
      expect(road.name).toBe('MainRoad');
      expect(road.id).toBeDefined();
      expect(road.length).toBe(100);
      expect(road.lanes).toHaveLength(1);
      expect(s.getDocument().roads).toHaveLength(1);
      expect(s.getDocument().roads[0].id).toBe(road.id);
    });

    it('removeRoad removes the road', () => {
      const road = s.addRoad({ name: 'R1' });
      s = store.getState();
      s.removeRoad(road.id);
      s = store.getState();
      expect(s.getDocument().roads).toHaveLength(0);
    });

    it('updateRoad updates road properties', () => {
      const road = s.addRoad({ name: 'R1' });
      s = store.getState();
      s.updateRoad(road.id, { name: 'RoadUpdated', length: 200 });
      s = store.getState();
      const updated = s.getDocument().roads[0];
      expect(updated.name).toBe('RoadUpdated');
      expect(updated.length).toBe(200);
    });

    it('tracks dirty road IDs', () => {
      const road = s.addRoad({ name: 'R1' });
      s = store.getState();
      const dirty = s.consumeDirtyRoadIds();
      expect(dirty.has(road.id)).toBe(true);
      // After consuming, the set should be empty
      s = store.getState();
      const dirty2 = s.consumeDirtyRoadIds();
      expect(dirty2.size).toBe(0);
    });
  });

  describe('lane operations', () => {
    it('addLane adds a lane to a road section', () => {
      const road = s.addRoad({ name: 'R1' });
      s = store.getState();
      s.addLane(road.id, 0, 'left', { type: 'shoulder' });
      s = store.getState();
      const section = s.getDocument().roads[0].lanes[0];
      expect(section.leftLanes).toHaveLength(2);
      expect(section.leftLanes[1].type).toBe('shoulder');
    });

    it('removeLane removes a lane', () => {
      const road = s.addRoad({ name: 'R1' });
      s = store.getState();
      const laneId = s.getDocument().roads[0].lanes[0].rightLanes[0].id;
      s.removeLane(road.id, 0, 'right', laneId);
      s = store.getState();
      expect(s.getDocument().roads[0].lanes[0].rightLanes).toHaveLength(0);
    });

    it('updateLane modifies a lane', () => {
      const road = s.addRoad({ name: 'R1' });
      s = store.getState();
      const laneId = s.getDocument().roads[0].lanes[0].leftLanes[0].id;
      s.updateLane(road.id, 0, 'left', laneId, { type: 'parking' });
      s = store.getState();
      expect(s.getDocument().roads[0].lanes[0].leftLanes[0].type).toBe('parking');
    });
  });

  describe('signal operations', () => {
    it('addSignal and removeSignal', () => {
      const road = s.addRoad({ name: 'R1' });
      s = store.getState();
      const signal = s.addSignal(road.id, { s: 50, t: 3, orientation: '+' });
      s = store.getState();
      expect(s.getDocument().roads[0].signals).toHaveLength(1);
      expect(signal.s).toBe(50);

      s.removeSignal(road.id, signal.id);
      s = store.getState();
      expect(s.getDocument().roads[0].signals).toHaveLength(0);
    });

    it('updateSignal modifies a signal', () => {
      const road = s.addRoad({ name: 'R1' });
      s = store.getState();
      const signal = s.addSignal(road.id, { s: 10, t: 2, orientation: '+' });
      s = store.getState();
      s.updateSignal(road.id, signal.id, { s: 25, name: 'StopSign' });
      s = store.getState();
      expect(s.getDocument().roads[0].signals[0].s).toBe(25);
      expect(s.getDocument().roads[0].signals[0].name).toBe('StopSign');
    });
  });

  describe('junction operations', () => {
    it('addJunction and removeJunction', () => {
      const junction = s.addJunction({ name: 'J1' });
      s = store.getState();
      expect(s.getDocument().junctions).toHaveLength(1);
      expect(junction.name).toBe('J1');

      s.removeJunction(junction.id);
      s = store.getState();
      expect(s.getDocument().junctions).toHaveLength(0);
    });

    it('addJunctionConnection', () => {
      const junction = s.addJunction({ name: 'J1' });
      s = store.getState();
      const conn = s.addJunctionConnection(junction.id, {
        incomingRoad: 'road1',
        connectingRoad: 'road2',
        contactPoint: 'start',
      });
      s = store.getState();
      expect(s.getDocument().junctions[0].connections).toHaveLength(1);
      expect(conn.incomingRoad).toBe('road1');
    });

    it('tracks dirty junction IDs', () => {
      const junction = s.addJunction({ name: 'J1' });
      s = store.getState();
      const dirty = s.consumeDirtyJunctionIds();
      expect(dirty.has(junction.id)).toBe(true);
      s = store.getState();
      expect(s.consumeDirtyJunctionIds().size).toBe(0);
    });
  });

  describe('controller operations', () => {
    it('addController and removeController', () => {
      const ctrl = s.addController({ name: 'Ctrl1' });
      s = store.getState();
      expect(s.getDocument().controllers).toHaveLength(1);
      expect(ctrl.name).toBe('Ctrl1');

      s.removeController(ctrl.id);
      s = store.getState();
      expect(s.getDocument().controllers).toHaveLength(0);
    });

    it('updateController', () => {
      const ctrl = s.addController({ name: 'Ctrl1' });
      s = store.getState();
      s.updateController(ctrl.id, { name: 'UpdatedCtrl' });
      s = store.getState();
      expect(s.getDocument().controllers[0].name).toBe('UpdatedCtrl');
    });
  });

  describe('header operations', () => {
    it('updateHeader changes header fields', () => {
      s.updateHeader({ name: 'TestMap', revMinor: 7 });
      s = store.getState();
      expect(s.getDocument().header.name).toBe('TestMap');
      expect(s.getDocument().header.revMinor).toBe(7);
    });
  });

  describe('undo/redo', () => {
    it('canUndo and canRedo reflect state', () => {
      expect(s.canUndo()).toBe(false);
      expect(s.canRedo()).toBe(false);

      s.addRoad({ name: 'R1' });
      s = store.getState();
      expect(s.canUndo()).toBe(true);
      expect(s.canRedo()).toBe(false);
    });

    it('undo reverses addRoad', () => {
      s.addRoad({ name: 'R1' });
      s = store.getState();
      expect(s.getDocument().roads).toHaveLength(1);

      s.undo();
      s = store.getState();
      expect(s.getDocument().roads).toHaveLength(0);
      expect(s.canRedo()).toBe(true);
    });

    it('redo restores undone operation', () => {
      s.addRoad({ name: 'R1' });
      s = store.getState();
      s.undo();
      s = store.getState();
      s.redo();
      s = store.getState();
      expect(s.getDocument().roads).toHaveLength(1);
    });

    it('undoAvailable/redoAvailable reactive state', () => {
      expect(store.getState().undoAvailable).toBe(false);
      expect(store.getState().redoAvailable).toBe(false);

      s.addRoad({ name: 'R1' });
      expect(store.getState().undoAvailable).toBe(true);

      store.getState().undo();
      expect(store.getState().undoAvailable).toBe(false);
      expect(store.getState().redoAvailable).toBe(true);
    });

    it('multiple operations undo/redo cycle', () => {
      s.addRoad({ name: 'A' });
      s = store.getState();
      s.addRoad({ name: 'B' });
      s = store.getState();
      s.addRoad({ name: 'C' });
      s = store.getState();
      expect(s.getDocument().roads).toHaveLength(3);

      s.undo();
      s = store.getState();
      expect(s.getDocument().roads).toHaveLength(2);

      s.undo();
      s = store.getState();
      expect(s.getDocument().roads).toHaveLength(1);

      s.redo();
      s = store.getState();
      expect(s.getDocument().roads).toHaveLength(2);

      // New operation clears redo stack
      s.addRoad({ name: 'D' });
      s = store.getState();
      expect(s.canRedo()).toBe(false);
      expect(s.getDocument().roads).toHaveLength(3);
    });

    it('undo header update', () => {
      s.updateHeader({ name: 'Original' });
      s = store.getState();
      s.updateHeader({ name: 'Changed' });
      s = store.getState();
      expect(s.getDocument().header.name).toBe('Changed');

      s.undo();
      s = store.getState();
      expect(s.getDocument().header.name).toBe('Original');
    });
  });
});
