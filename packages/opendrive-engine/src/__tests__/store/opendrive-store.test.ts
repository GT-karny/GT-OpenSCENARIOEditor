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

  /**
   * Redo coverage per operation category.
   *
   * Regression guard for the bug where inline command objects used
   * `execute: () => {}` no-ops: after undo, redo restored NOTHING while still
   * moving the undo/redo stacks, corrupting state and history.
   *
   * Pattern for every case:
   *   apply op  -> capture state A (deep clone)
   *   undo      -> capture state B (deep clone)
   *   redo      -> expect document deep-equals A
   *   undo      -> expect document deep-equals B
   */
  describe('redo restores state (per operation category)', () => {
    const snapshot = (): unknown => structuredClone(store.getState().getDocument());

    /** Run the full A/B redo cycle and assert symmetry. */
    function expectRedoCycle(): void {
      const stateA = snapshot();

      store.getState().undo();
      const stateB = snapshot();
      // Undo must actually change something for this to be a meaningful test.
      expect(stateB).not.toEqual(stateA);

      store.getState().redo();
      expect(snapshot()).toEqual(stateA);

      store.getState().undo();
      expect(snapshot()).toEqual(stateB);
    }

    describe('lanes', () => {
      it('redo re-applies addLane', () => {
        const road = s.addRoad({ name: 'R1' });
        s.addLane(road.id, 0, 'left', { type: 'shoulder' });
        expectRedoCycle();
      });

      it('redo re-applies removeLane', () => {
        const road = s.addRoad({ name: 'R1' });
        const laneId = store.getState().getDocument().roads[0].lanes[0].rightLanes[0].id;
        s.removeLane(road.id, 0, 'right', laneId);
        expectRedoCycle();
      });

      it('redo re-applies updateLane', () => {
        const road = s.addRoad({ name: 'R1' });
        const laneId = store.getState().getDocument().roads[0].lanes[0].leftLanes[0].id;
        s.updateLane(road.id, 0, 'left', laneId, { type: 'parking' });
        expectRedoCycle();
      });
    });

    describe('junctions', () => {
      it('redo re-applies addJunction', () => {
        s.addJunction({ name: 'J1' });
        expectRedoCycle();
      });

      it('redo re-applies removeJunction', () => {
        const j = s.addJunction({ name: 'J1' });
        s.removeJunction(j.id);
        expectRedoCycle();
      });

      it('redo re-applies updateJunction', () => {
        const j = s.addJunction({ name: 'J1' });
        s.updateJunction(j.id, { name: 'J1-renamed', type: 'default' });
        expectRedoCycle();
      });

      it('redo re-applies addJunctionConnection', () => {
        const j = s.addJunction({ name: 'J1' });
        s.addJunctionConnection(j.id, {
          incomingRoad: 'road1',
          connectingRoad: 'road2',
          contactPoint: 'start',
        });
        expectRedoCycle();
      });
    });

    describe('signals', () => {
      it('redo re-applies addSignal', () => {
        const road = s.addRoad({ name: 'R1' });
        s.addSignal(road.id, { s: 50, t: 3, orientation: '+' });
        expectRedoCycle();
      });

      it('redo re-applies removeSignal', () => {
        const road = s.addRoad({ name: 'R1' });
        const sig = s.addSignal(road.id, { s: 50, t: 3, orientation: '+' });
        s.removeSignal(road.id, sig.id);
        expectRedoCycle();
      });

      it('redo re-applies updateSignal', () => {
        const road = s.addRoad({ name: 'R1' });
        const sig = s.addSignal(road.id, { s: 10, t: 2, orientation: '+' });
        s.updateSignal(road.id, sig.id, { s: 25, name: 'StopSign' });
        expectRedoCycle();
      });
    });

    describe('objects', () => {
      it('redo re-applies addObject', () => {
        const road = s.addRoad({ name: 'R1' });
        s.addObject(road.id, { type: 'pole', name: 'p1', s: 5, t: 1 });
        expectRedoCycle();
      });

      it('redo re-applies removeObject', () => {
        const road = s.addRoad({ name: 'R1' });
        const obj = s.addObject(road.id, { type: 'pole', name: 'p1', s: 5, t: 1 });
        s.removeObject(road.id, obj.id);
        expectRedoCycle();
      });
    });

    describe('controllers', () => {
      it('redo re-applies addController', () => {
        s.addController({ name: 'Ctrl1' });
        expectRedoCycle();
      });

      it('redo re-applies removeController', () => {
        const c = s.addController({ name: 'Ctrl1' });
        s.removeController(c.id);
        expectRedoCycle();
      });

      it('redo re-applies updateController', () => {
        const c = s.addController({ name: 'Ctrl1' });
        s.updateController(c.id, { name: 'UpdatedCtrl' });
        expectRedoCycle();
      });
    });

    describe('setRoadLink', () => {
      it('redo re-applies a successor link', () => {
        const r1 = s.addRoad({ name: 'R1' });
        const r2 = s.addRoad({ name: 'R2' });
        s.setRoadLink(r1.id, 'successor', {
          elementType: 'road',
          elementId: r2.id,
          contactPoint: 'start',
        });
        expectRedoCycle();
      });

      it('redo re-applies clearing a link', () => {
        const r1 = s.addRoad({ name: 'R1' });
        const r2 = s.addRoad({ name: 'R2' });
        s.setRoadLink(r1.id, 'successor', {
          elementType: 'road',
          elementId: r2.id,
          contactPoint: 'start',
        });
        // Clearing is the operation under test (its own undo step).
        s.setRoadLink(r1.id, 'successor', undefined);
        expectRedoCycle();
      });
    });

    describe('batch collapse', () => {
      it('redo re-applies a collapsed batch as a single step', () => {
        const road = s.addRoad({ name: 'R1' });

        s.beginBatch('Add two lanes');
        s.addLane(road.id, 0, 'left', { type: 'shoulder' });
        s.addLane(road.id, 0, 'right', { type: 'sidewalk' });
        s.endBatch();

        // The batch must be one undo step, not two.
        s = store.getState();
        const leftAfter = store.getState().getDocument().roads[0].lanes[0].leftLanes.length;
        const rightAfter = store.getState().getDocument().roads[0].lanes[0].rightLanes.length;
        expect(leftAfter).toBe(2);
        expect(rightAfter).toBe(2);

        // Single undo reverts BOTH lane additions.
        store.getState().undo();
        expect(store.getState().getDocument().roads[0].lanes[0].leftLanes).toHaveLength(1);
        expect(store.getState().getDocument().roads[0].lanes[0].rightLanes).toHaveLength(1);
        expect(store.getState().canRedo()).toBe(true);

        // Single redo re-applies BOTH.
        store.getState().redo();
        expect(store.getState().getDocument().roads[0].lanes[0].leftLanes).toHaveLength(2);
        expect(store.getState().getDocument().roads[0].lanes[0].rightLanes).toHaveLength(2);
      });

      it('redo of a collapsed batch is deep-equal symmetric', () => {
        const road = s.addRoad({ name: 'R1' });
        s = store.getState();

        s.beginBatch('Mutate road then add lane');
        s.updateRoad(road.id, { length: 222 });
        s.addLane(road.id, 0, 'left', { type: 'shoulder' });
        s.endBatch();

        expectRedoCycle();
      });

      it('empty batch leaves history untouched', () => {
        s.addRoad({ name: 'R1' });
        s = store.getState();
        const before = structuredClone(store.getState().getDocument());

        s.beginBatch('No-op batch');
        s.endBatch();

        s = store.getState();
        // No new redo entry, document unchanged, undo still targets addRoad.
        expect(store.getState().getDocument()).toEqual(before);
        s.undo();
        expect(store.getState().getDocument().roads).toHaveLength(0);
      });
    });
  });
});
