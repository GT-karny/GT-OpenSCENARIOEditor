/**
 * Types for esmini integration.
 */

export interface EsminiConfig {
  executablePath: string;
  headless: boolean;
  fixedTimestep: number;
  recordFilePath?: string;
}

export interface SimulationRequest {
  scenarioXml: string;
  roadNetworkPath?: string;
  /** Raw .xodr XML content for WASM mode (written to virtual FS) */
  xodrXml?: string;
  /** Catalog XML files keyed by catalog name for WASM mode */
  catalogXmls?: Record<string, string>;
  duration?: number;
  config?: Partial<EsminiConfig>;
}

export interface TrafficLightFrameState {
  signalId: number;
  state: string;
}

export interface VehicleLightFrameState {
  name: string;
  indicator: 'off' | 'left' | 'right' | 'warning';
  headLight: boolean;
  highBeam: boolean;
  brakeLight: boolean;
}

export interface SimulationFrame {
  time: number;
  objects: SimulationObjectState[];
  trafficLightStates?: TrafficLightFrameState[];
  vehicleLightStates?: VehicleLightFrameState[];
}

export interface SimulationObjectState {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  h: number;
  p: number;
  r: number;
  speed: number;
  wheel_angle?: number;
  wheel_rot?: number;
  model_id?: number;
  roadId?: number;
  laneId?: number;
  s?: number;
  t?: number;
}

export type SimulationStatus = 'idle' | 'running' | 'completed' | 'error';

export interface SimulationResult {
  status: SimulationStatus;
  frames: SimulationFrame[];
  duration: number;
  error?: string;
}

// --- StoryBoard introspection types (WASM esminiJS) ---

export type StoryBoardElementType =
  | 'storyboard'
  | 'story'
  | 'act'
  | 'maneuverGroup'
  | 'maneuver'
  | 'event'
  | 'action';

export type StoryBoardElementState = 'init' | 'standby' | 'running' | 'complete';

export interface StoryBoardEvent {
  name: string;
  elementType: StoryBoardElementType;
  state: StoryBoardElementState;
  fullPath: string;
  timestamp: number;
}

export interface ConditionEvent {
  name: string;
  timestamp: number;
}
