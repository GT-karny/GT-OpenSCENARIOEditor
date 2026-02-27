/**
 * Types for the 3D viewer local state.
 */

import type { SimulationFrame } from '@osce/shared';

export type CameraMode = 'orbit' | 'topDown';

export interface PlaybackState {
  status: 'idle' | 'playing' | 'paused';
  currentTime: number;
  duration: number;
  frames: SimulationFrame[];
}

export interface ViewerState {
  cameraMode: CameraMode;
  showGrid: boolean;
  showLaneIds: boolean;
  showRoadIds: boolean;
  showEntityLabels: boolean;
  playback: PlaybackState;
}

export interface ViewerActions {
  setCameraMode: (mode: CameraMode) => void;
  toggleGrid: () => void;
  toggleLaneIds: () => void;
  toggleRoadIds: () => void;
  toggleEntityLabels: () => void;
  setPlaybackFrames: (frames: SimulationFrame[]) => void;
  setPlaybackStatus: (status: PlaybackState['status']) => void;
  setPlaybackTime: (time: number) => void;
  resetPlayback: () => void;
}

export type ViewerStore = ViewerState & ViewerActions;
