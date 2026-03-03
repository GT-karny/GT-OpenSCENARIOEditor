/**
 * Types for esmini WASM Worker communication.
 *
 * These types define the message protocol between the main thread
 * and the Web Worker that runs the esmini WASM module.
 */

// --- Raw WASM types (match C++ embind structs) ---

export interface WasmScenarioObjectState {
  name: string;
  id: number;
  model_id: number;
  ctrl_type: number;
  timestamp: number;
  x: number;
  y: number;
  z: number;
  h: number;
  p: number;
  r: number;
  road_id: number;
  junction_id: number;
  t: number;
  lane_id: number;
  lane_offset: number;
  s: number;
  speed: number;
  center_offset_x: number;
  center_offset_y: number;
  center_offset_z: number;
  width: number;
  length: number;
  height: number;
  object_type: number;
  object_category: number;
  wheel_angle: number;
  wheel_rot: number;
}

export interface WasmStoryBoardEvent {
  name: string;
  type: number; // ElementType: 1=STORY_BOARD, 2=STORY, 3=ACT, 4=MANEUVER_GROUP, 5=MANEUVER, 6=EVENT, 7=ACTION
  state: number; // State: 0=INIT, 1=STANDBY, 2=RUNNING, 3=COMPLETE
  fullPath: string; // "::" separated hierarchical path
  timestamp: number;
}

export interface WasmConditionEvent {
  name: string;
  timestamp: number;
}

export interface WasmOpenScenarioConfig {
  max_loop: number;
  min_time_step: number;
  max_time_step: number;
  dt: number;
}

// --- Worker message protocol ---

export type WorkerRequest =
  | { type: 'load'; xoscXml: string; xodrData?: string; catalogs?: Record<string, string>; config?: Partial<WasmOpenScenarioConfig> }
  | { type: 'step'; dt: number }
  | { type: 'play'; speed: number; fps: number }
  | { type: 'pause' }
  | { type: 'dispose' };

export type WorkerResponse =
  | {
      type: 'loaded';
      numberOfObjects: number;
    }
  | {
      type: 'frame';
      simulationTime: number;
      objects: WasmScenarioObjectState[];
      storyBoardEvents: WasmStoryBoardEvent[];
      conditionEvents: WasmConditionEvent[];
      isComplete: boolean;
    }
  | {
      type: 'completed';
      simulationTime: number;
    }
  | {
      type: 'batch-completed';
      frames: Array<{ simulationTime: number; objects: WasmScenarioObjectState[] }>;
      storyBoardEvents: WasmStoryBoardEvent[];
      conditionEvents: WasmConditionEvent[];
      duration: number;
    }
  | {
      type: 'error';
      message: string;
    };
