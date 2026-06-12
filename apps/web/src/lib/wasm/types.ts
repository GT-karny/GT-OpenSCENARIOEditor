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

export interface WasmTrafficLightState {
  id: number;
  state: string;
}

export interface WasmVehicleLightState {
  id: number;
  name: string;
  head_light: string;
  high_beam: string;
  indicator: string; // 'off' | 'left' | 'right' | 'warning'
  brake_light: string;
  fog_light: string;
  reversing_light: string;
  warning_light: string;
}

export interface WasmOpenScenarioConfig {
  max_loop: number;
  min_time_step: number;
  max_time_step: number;
  dt: number;
}

// --- RoadManager WASM types (match C++ RMPositionResult) ---

export interface WasmRMPositionResult {
  x: number;
  y: number;
  z: number;
  h: number;
  p: number;
  r: number;
  road_id: number;
  lane_id: number;
  s: number;
  t: number;
  offset: number;
  return_code: number; // 0 = OK, negative = error
}

// --- Route pathfinding types ---

export interface WasmRMPathPoint {
  x: number;
  y: number;
  z: number;
  h: number;
  road_id: number;
  lane_id: number;
  s: number;
}

// --- Lane-change-aware route types (match C++ GTRouteJS.calculateRoute) ---

/** A lane change required while driving along one road of the route. */
export interface WasmGTLaneChange {
  road_id: number;
  s: number; // road-entry s; change should complete before road end
  from_lane: number; // lane entered on this road
  to_lane: number; // lane needed to connect onward
}

/** Result of GTRouteJS.calculateRoute (lane-change-aware routing). */
export interface WasmGTRouteResult {
  found: boolean;
  length: number; // total route length in meters, -1 when not found
  waypoints: WasmRMPathPoint[];
  laneChanges: WasmGTLaneChange[];
}

// --- Worker message protocol ---

export type WorkerRequest =
  // Simulation messages
  | { type: 'load'; xoscXml: string; xodrData?: string; catalogs?: Record<string, string>; config?: Partial<WasmOpenScenarioConfig> }
  | { type: 'play'; speed: number; fps: number }
  | { type: 'pause' }
  | { type: 'dispose' }
  // RoadManager messages
  | { type: 'rm-load-odr'; xodrXml: string }
  | { type: 'rm-lane-to-world'; roadId: number; laneId: number; s: number; offset: number; requestId: string }
  | { type: 'rm-world-to-lane'; x: number; y: number; requestId: string }
  | { type: 'rm-track-to-world'; roadId: number; s: number; t: number; requestId: string }
  | { type: 'rm-road-length'; roadId: number; requestId: string }
  | { type: 'rm-lane-width'; roadId: number; laneId: number; s: number; requestId: string }
  | { type: 'rm-road-count'; requestId: string }
  | { type: 'rm-lane-count'; roadId: number; s: number; requestId: string }
  // Route pathfinding messages
  | { type: 'rm-calculate-path'; startRoadId: number; startLaneId: number; startS: number; endRoadId: number; endLaneId: number; endS: number; sampleInterval: number; requestId: string }
  // Lane-change-aware route messages (GTRouteJS)
  | { type: 'gt-calculate-route'; startRoadId: number; startLaneId: number; startS: number; endRoadId: number; endLaneId: number; endS: number; strategy: number; requestId: string };

export type WorkerResponse =
  | {
      type: 'loaded';
      numberOfObjects: number;
    }
  | {
      type: 'batch-completed';
      frames: Array<{ simulationTime: number; objects: WasmScenarioObjectState[]; trafficLightStates: WasmTrafficLightState[]; vehicleLightStates: WasmVehicleLightState[] }>;
      storyBoardEvents: WasmStoryBoardEvent[];
      conditionEvents: WasmConditionEvent[];
      duration: number;
    }
  | {
      type: 'error';
      message: string;
    }
  // RoadManager responses
  | { type: 'rm-loaded' }
  | { type: 'rm-position'; requestId: string; result: WasmRMPositionResult }
  | { type: 'rm-scalar'; requestId: string; value: number }
  | { type: 'rm-path'; requestId: string; points: WasmRMPathPoint[] }
  | { type: 'gt-route'; requestId: string; result: WasmGTRouteResult }
  | { type: 'rm-error'; requestId?: string; message: string };
