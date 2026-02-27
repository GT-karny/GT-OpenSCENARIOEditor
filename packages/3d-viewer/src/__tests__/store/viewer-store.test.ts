import { describe, it, expect } from 'vitest';
import { createViewerStore } from '../../store/viewer-store.js';
import type { SimulationFrame } from '@osce/shared';

describe('createViewerStore', () => {
  it('creates store with default state', () => {
    const store = createViewerStore();
    const state = store.getState();
    expect(state.cameraMode).toBe('orbit');
    expect(state.showGrid).toBe(true);
    expect(state.showLaneIds).toBe(false);
    expect(state.showRoadIds).toBe(false);
    expect(state.showEntityLabels).toBe(true);
    expect(state.playback.status).toBe('idle');
    expect(state.playback.currentTime).toBe(0);
    expect(state.playback.frames).toHaveLength(0);
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

  it('manages playback state', () => {
    const store = createViewerStore();
    const frames: SimulationFrame[] = [
      { time: 0, objects: [] },
      { time: 1.0, objects: [] },
      { time: 2.0, objects: [] },
    ];

    store.getState().setPlaybackFrames(frames);
    expect(store.getState().playback.frames).toHaveLength(3);
    expect(store.getState().playback.duration).toBe(2.0);
    expect(store.getState().playback.status).toBe('idle');

    store.getState().setPlaybackStatus('playing');
    expect(store.getState().playback.status).toBe('playing');

    store.getState().setPlaybackTime(1.5);
    expect(store.getState().playback.currentTime).toBe(1.5);

    store.getState().resetPlayback();
    expect(store.getState().playback.status).toBe('idle');
    expect(store.getState().playback.frames).toHaveLength(0);
  });

  it('toggles label visibility', () => {
    const store = createViewerStore();
    expect(store.getState().showEntityLabels).toBe(true);
    store.getState().toggleEntityLabels();
    expect(store.getState().showEntityLabels).toBe(false);
  });
});
