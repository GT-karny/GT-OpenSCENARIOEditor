import { describe, it, expect } from 'vitest';
import { createViewerStore } from '../../store/viewer-store.js';

describe('createViewerStore', () => {
  it('creates store with default state', () => {
    const store = createViewerStore();
    const state = store.getState();
    expect(state.cameraMode).toBe('orbit');
    expect(state.showGrid).toBe(true);
    expect(state.showLaneIds).toBe(false);
    expect(state.showRoadIds).toBe(false);
    expect(state.showEntityLabels).toBe(true);
  });

  it('accepts initial preferences', () => {
    const store = createViewerStore({
      showGrid3D: false,
      showLaneIds: true,
      showRoadIds: true,
    });
    const state = store.getState();
    expect(state.showGrid).toBe(false);
    expect(state.showLaneIds).toBe(true);
    expect(state.showRoadIds).toBe(true);
  });

  it('toggles grid visibility', () => {
    const store = createViewerStore();
    expect(store.getState().showGrid).toBe(true);
    store.getState().toggleGrid();
    expect(store.getState().showGrid).toBe(false);
    store.getState().toggleGrid();
    expect(store.getState().showGrid).toBe(true);
  });

  it('sets camera mode', () => {
    const store = createViewerStore();
    store.getState().setCameraMode('topDown');
    expect(store.getState().cameraMode).toBe('topDown');
    store.getState().setCameraMode('orbit');
    expect(store.getState().cameraMode).toBe('orbit');
  });

  it('toggles label visibility', () => {
    const store = createViewerStore();
    expect(store.getState().showEntityLabels).toBe(true);
    store.getState().toggleEntityLabels();
    expect(store.getState().showEntityLabels).toBe(false);
  });

  describe('viewerMode', () => {
    it('defaults to edit mode', () => {
      const store = createViewerStore();
      expect(store.getState().viewerMode).toBe('edit');
    });

    it('switches to play mode and resets gizmo and hover', () => {
      const store = createViewerStore();
      store.getState().setGizmoMode('translate');
      store.getState().setHoverLaneInfo({
        roadId: '1',
        laneId: -1,
        s: 50,
        offset: 0,
        heading: 0,
        worldX: 50,
        worldY: -1.75,
        worldZ: 0,
        roadT: -1.75,
      });
      store.getState().setViewerMode('play');
      expect(store.getState().viewerMode).toBe('play');
      expect(store.getState().gizmoMode).toBe('off');
      expect(store.getState().hoverLaneInfo).toBeNull();
    });

    it('switches back to edit mode restoring gizmo to translate', () => {
      // Switching edit→play disables gizmo; switching back to edit restores it to 'translate'
      // so the user can immediately edit after returning from play mode.
      const store = createViewerStore();
      store.getState().setViewerMode('play');
      store.getState().setViewerMode('edit');
      expect(store.getState().viewerMode).toBe('edit');
      expect(store.getState().gizmoMode).toBe('translate');
    });
  });

  describe('snapToLane', () => {
    it('defaults to true', () => {
      const store = createViewerStore();
      expect(store.getState().snapToLane).toBe(true);
    });

    it('toggles snap', () => {
      const store = createViewerStore();
      store.getState().toggleSnapToLane();
      expect(store.getState().snapToLane).toBe(false);
      store.getState().toggleSnapToLane();
      expect(store.getState().snapToLane).toBe(true);
    });
  });

  describe('gizmoMode with place', () => {
    it('accepts place mode', () => {
      const store = createViewerStore();
      store.getState().setGizmoMode('place');
      expect(store.getState().gizmoMode).toBe('place');
    });
  });

  describe('hoverLaneInfo', () => {
    it('defaults to null', () => {
      const store = createViewerStore();
      expect(store.getState().hoverLaneInfo).toBeNull();
    });

    it('sets and clears hover info', () => {
      const store = createViewerStore();
      const info = {
        roadId: '1',
        laneId: -1,
        s: 50,
        offset: 0,
        heading: 0,
        worldX: 50,
        worldY: -1.75,
        worldZ: 0,
        roadT: -1.75,
      };
      store.getState().setHoverLaneInfo(info);
      expect(store.getState().hoverLaneInfo).toEqual(info);
      store.getState().setHoverLaneInfo(null);
      expect(store.getState().hoverLaneInfo).toBeNull();
    });
  });

  describe('temporary lanes and objects', () => {
    it('both default to true', () => {
      const store = createViewerStore();
      expect(store.getState().showTemporaryLanes).toBe(true);
      expect(store.getState().showObjects).toBe(true);
    });

    it('toggles flip each flag', () => {
      const store = createViewerStore();
      store.getState().toggleTemporaryLanes();
      expect(store.getState().showTemporaryLanes).toBe(false);
      store.getState().toggleTemporaryLanes();
      expect(store.getState().showTemporaryLanes).toBe(true);

      store.getState().toggleObjects();
      expect(store.getState().showObjects).toBe(false);
      store.getState().toggleObjects();
      expect(store.getState().showObjects).toBe(true);
    });

    it('seed from preferences', () => {
      const store = createViewerStore({ showTemporaryLanes: false, showObjects: false });
      expect(store.getState().showTemporaryLanes).toBe(false);
      expect(store.getState().showObjects).toBe(false);
    });
  });
});
