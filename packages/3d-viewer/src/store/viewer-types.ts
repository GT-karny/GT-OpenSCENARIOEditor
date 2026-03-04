/**
 * Types for the 3D viewer local state.
 */

import type { SimulationFrame } from '@osce/shared';

export type CameraMode = 'orbit' | 'topDown';
export type GizmoMode = 'translate' | 'rotate' | 'off';
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

  /** Gizmo mode for entity manipulation */
  gizmoMode: GizmoMode;
  /** Reverse driving direction when snapping to lane */
  reverseDirection: boolean;

  /** Entity name to follow with camera (null = no follow) */
  followTargetEntity: string | null;

  /** Fly controls speed multiplier (1.0 = default, range 0.1–5.0) */
  flySpeed: number;
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

  setGizmoMode: (mode: GizmoMode) => void;
  toggleReverseDirection: () => void;

  setFollowTarget: (entityName: string | null) => void;
  setFlySpeed: (speed: number) => void;
}

export type ViewerStore = ViewerState & ViewerActions;
