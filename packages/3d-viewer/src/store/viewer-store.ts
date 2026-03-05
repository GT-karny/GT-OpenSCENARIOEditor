/**
 * Zustand store for viewer-local state (camera mode, display toggles, playback).
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { EditorPreferences, SimulationFrame } from '@osce/shared';
import type {
  CameraMode,
  GizmoMode,
  HoverLaneInfo,
  PlaybackState,
  ViewerMode,
  ViewerStore,
} from './viewer-types.js';

const DEFAULT_PLAYBACK: PlaybackState = {
  status: 'idle',
  currentTime: 0,
  duration: 0,
  frames: [],
};

/**
 * Create a new viewer store with optional initial preferences.
 */
export function createViewerStore(preferences?: Partial<EditorPreferences>) {
  return createStore<ViewerStore>()((set) => ({
    // State
    cameraMode: 'orbit' as CameraMode,
    showGrid: preferences?.showGrid3D ?? true,
    showLaneIds: preferences?.showLaneIds ?? false,
    showRoadIds: preferences?.showRoadIds ?? false,
    showEntityLabels: true,
    playback: { ...DEFAULT_PLAYBACK },

    viewerMode: 'edit' as ViewerMode,
    gizmoMode: 'translate' as GizmoMode,
    reverseDirection: false,
    snapToLane: true,
    hoverLaneInfo: null as HoverLaneInfo | null,
    followTargetEntity: null,
    flySpeed: 1,

    // Actions
    setCameraMode: (mode: CameraMode) => set({ cameraMode: mode }),

    setViewerMode: (mode: ViewerMode) =>
      set(
        mode === 'play'
          ? { viewerMode: mode, gizmoMode: 'off' as GizmoMode, hoverLaneInfo: null }
          : { viewerMode: mode, gizmoMode: 'translate' as GizmoMode },
      ),

    toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
    toggleLaneIds: () => set((s) => ({ showLaneIds: !s.showLaneIds })),
    toggleRoadIds: () => set((s) => ({ showRoadIds: !s.showRoadIds })),
    toggleEntityLabels: () => set((s) => ({ showEntityLabels: !s.showEntityLabels })),

    setPlaybackFrames: (frames: SimulationFrame[]) =>
      set({
        playback: {
          status: 'idle',
          currentTime: 0,
          duration: frames.length > 0 ? frames[frames.length - 1].time : 0,
          frames,
        },
      }),

    setPlaybackStatus: (status: PlaybackState['status']) =>
      set((s) => ({ playback: { ...s.playback, status } })),

    setPlaybackTime: (time: number) =>
      set((s) => ({ playback: { ...s.playback, currentTime: time } })),

    resetPlayback: () => set({ playback: { ...DEFAULT_PLAYBACK } }),

    setGizmoMode: (mode: GizmoMode) => set({ gizmoMode: mode }),
    toggleReverseDirection: () => set((s) => ({ reverseDirection: !s.reverseDirection })),
    toggleSnapToLane: () => set((s) => ({ snapToLane: !s.snapToLane })),
    setHoverLaneInfo: (info: HoverLaneInfo | null) => set({ hoverLaneInfo: info }),

    setFollowTarget: (entityName: string | null) => set({ followTargetEntity: entityName }),
    setFlySpeed: (speed: number) => set({ flySpeed: speed }),
  }));
}

/** React hook to access the viewer store. Requires a store instance. */
export function useViewerStore<T>(
  store: ReturnType<typeof createViewerStore>,
  selector: (state: ViewerStore) => T,
): T {
  return useStore(store, selector);
}
