import { describe, it, expect, beforeEach } from 'vitest';
import type { Route, Position } from '@osce/shared';
import { useRouteEditStore } from '../../stores/route-edit-store';

function lanePos(roadId: string, laneId: string, s: number): Position {
  return { type: 'lanePosition', roadId, laneId, s };
}

function worldPos(x: number, y: number): Position {
  return { type: 'worldPosition', x, y };
}

function makeRoute(): Route {
  return {
    id: 'r1',
    name: 'Route 1',
    closed: false,
    waypoints: [
      { position: lanePos('1', '-1', 0), routeStrategy: 'shortest' },
      { position: lanePos('1', '-1', 50), routeStrategy: 'shortest' },
    ],
  };
}

const store = useRouteEditStore;

beforeEach(() => {
  store.getState().exitRouteEditMode();
});

describe('route-edit-store divergent CRUD', () => {
  it('enter/exit toggles active and clones the working copy', () => {
    const route = makeRoute();
    store.getState().enterRouteEditMode({ type: 'action', actionId: 'a1' }, route);
    expect(store.getState().active).toBe(true);
    expect(store.getState().editingRoute).not.toBe(route);
    expect(store.getState().editingRoute?.waypoints.length).toBe(2);

    store.getState().exitRouteEditMode();
    expect(store.getState().active).toBe(false);
    expect(store.getState().editingRoute).toBeNull();
  });

  it('addWaypoint appends and selects the new waypoint', () => {
    store.getState().enterRouteEditMode({ type: 'action' }, makeRoute());
    store.getState().addWaypoint(worldPos(10, 10));
    expect(store.getState().editingRoute?.waypoints.length).toBe(3);
    expect(store.getState().selectedWaypointIndex).toBe(2);
  });

  it('insertWaypoint inserts after the given index', () => {
    store.getState().enterRouteEditMode({ type: 'action' }, makeRoute());
    store.getState().insertWaypoint(0, worldPos(5, 5));
    expect(store.getState().editingRoute?.waypoints.length).toBe(3);
    expect(store.getState().selectedWaypointIndex).toBe(1);
    expect(store.getState().editingRoute?.waypoints[1].position).toEqual(worldPos(5, 5));
  });

  it('removeWaypoint deletes and adjusts selection', () => {
    store.getState().enterRouteEditMode({ type: 'action' }, makeRoute());
    store.getState().selectWaypoint(1);
    store.getState().removeWaypoint(0);
    expect(store.getState().editingRoute?.waypoints.length).toBe(1);
    // Selection shifts down since removed index < selection.
    expect(store.getState().selectedWaypointIndex).toBe(0);
  });

  it('removeWaypoint ignores out-of-range index', () => {
    store.getState().enterRouteEditMode({ type: 'action' }, makeRoute());
    const before = store.getState().history.past.length;
    store.getState().removeWaypoint(99);
    expect(store.getState().editingRoute?.waypoints.length).toBe(2);
    expect(store.getState().history.past.length).toBe(before);
  });

  it('warns on duplicate consecutive waypoints (same road/lane/s)', () => {
    store.getState().enterRouteEditMode({ type: 'action' }, makeRoute());
    store.getState().addWaypoint(lanePos('1', '-1', 50)); // same as waypoint index 1
    const warnings = store.getState().warnings;
    expect(warnings.some((w) => w.includes('same position'))).toBe(true);
  });

  it('warns when fewer than 2 waypoints remain', () => {
    store.getState().enterRouteEditMode({ type: 'action' }, makeRoute());
    store.getState().removeWaypoint(0);
    expect(store.getState().warnings).toContain('Route requires at least 2 waypoints');
  });

  it('undo/redo restore waypoint edits', () => {
    store.getState().enterRouteEditMode({ type: 'action' }, makeRoute());
    store.getState().addWaypoint(worldPos(10, 10));
    expect(store.getState().editingRoute?.waypoints.length).toBe(3);
    store.getState().undoRouteEdit();
    expect(store.getState().editingRoute?.waypoints.length).toBe(2);
    store.getState().redoRouteEdit();
    expect(store.getState().editingRoute?.waypoints.length).toBe(3);
  });

  it('commitRoute returns a deep clone', () => {
    store.getState().enterRouteEditMode({ type: 'action' }, makeRoute());
    const committed = store.getState().commitRoute();
    expect(committed?.waypoints.length).toBe(2);
    committed!.waypoints.push({ position: worldPos(1, 1), routeStrategy: 'shortest' });
    expect(store.getState().editingRoute?.waypoints.length).toBe(2);
  });

  it('setLaneChangeAware(false) clears markers', () => {
    store.getState().enterRouteEditMode({ type: 'action' }, makeRoute());
    store.getState().setLaneChangeMarkers([
      { x: 0, y: 0, z: 0, roadId: '1', fromLane: -1, toLane: -2, s: 10 },
    ]);
    store.getState().setLaneChangeAware(false);
    expect(store.getState().laneChangeMarkers).toEqual([]);
    expect(store.getState().laneChangeAware).toBe(false);
  });
});
