/**
 * Types for the 3D viewer local state.
 */

import type { SimulationFrame } from '@osce/shared';

export type CameraMode = 'orbit' | 'topDown';
export type ViewerMode = 'edit' | 'play';
export type GizmoMode = 'translate' | 'rotate' | 'place' | 'off';

export interface PlaybackState {
  status: 'idle' | 'playing' | 'paused';
  currentTime: number;
  duration: number;
  frames: SimulationFrame[];
}

/** Information about the lane under the mouse cursor during hover */
export interface HoverLaneInfo {
  roadId: string;
  laneId: number;
  s: number;
  offset: number;
  heading: number;
  worldX: number;
  worldY: number;
}

export interface ViewerState {
  cameraMode: CameraMode;
  showGrid: boolean;
  showLaneIds: boolean;
  showRoadIds: boolean;
  showEntityLabels: boolean;
  playback: PlaybackState;

  /** Top-level viewer interaction mode (edit = full editing, play = view-only) */
  viewerMode: ViewerMode;

  /** Gizmo mode for entity manipulation */
  gizmoMode: GizmoMode;
  /** Reverse driving direction when snapping to lane */
  reverseDirection: boolean;

  /** Snap to lane center on placement (ON = LanePosition, OFF = WorldPosition) */
  snapToLane: boolean;

  /** Current hover lane info for placement overlay (null when not hovering a lane) */
  hoverLaneInfo: HoverLaneInfo | null;

  /** Entity name to follow with camera (null = no follow) */
  followTargetEntity: string | null;

  /** Fly controls speed multiplier (1.0 = default, range 0.1–5.0) */
  flySpeed: number;
}

export interface ViewerActions {
  setCameraMode: (mode: CameraMode) => void;
  setViewerMode: (mode: ViewerMode) => void;
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
  toggleSnapToLane: () => void;
  setHoverLaneInfo: (info: HoverLaneInfo | null) => void;

  setFollowTarget: (entityName: string | null) => void;
  setFlySpeed: (speed: number) => void;
}

export type ViewerStore = ViewerState & ViewerActions;
