/**
 * GT_Sim WebSocket streaming contract — the 5 live streams the fork frontend
 * uses, frozen as types for WP1 (client implementation).
 *
 * Streams (path is relative to the injected WS base URL/host):
 *  - OSI   `/ws/osi/{jobId}`      — recv: ground_truth + host_vehicle_data
 *  - VD    `/ws/vd/{jobId}`       — recv: virtual_driver_telemetry
 *  - SV    `/ws/sv/{jobId}`       — recv: scenario_variables
 *  - PRE   `/ws/presets/{projId}` — recv: presets_changed
 *  - IN    `/ws/input/{jobId}`    — SEND-only: GtSimInputCommand @ 30 Hz
 *
 * The host is INJECTED: build every URL from a base URL argument (the fork
 * hard-coded `window.location.host`; that is replaced here). See the
 * `gtSim*WsUrl` builders.
 */

import type { VdTelemetryFrame } from '../client/gt-sim-api-types.js';

/** WebSocket connection state (mirrors the fork's `useWebSocketStream`). */
export type GtSimWsConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Shared JSON envelope for every received stream frame. `type` selects the
 * payload; `type: 'end'` signals stream completion; a truthy `error` signals a
 * stream-level error. Endpoint payload fields arrive through the index
 * signature and are narrowed by the discriminated message unions below.
 */
export interface GtSimWsEnvelope {
  type?: string;
  error?: unknown;
  [key: string]: unknown;
}

// --- OSI stream (/ws/osi/{jobId}) ---

/** A tracked object in an OSI GroundTruth frame. */
export interface GtSimOsiObject {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  h: number;
  speed: number;
  head_light: string;
  indicator: string;
  brake_light: string;
  obj_type: string;
  vehicle_class: string;
  length: number;
  width: number;
}

/** A traffic-light state in an OSI GroundTruth frame. */
export interface GtSimOsiTrafficLight {
  id: number;
  x: number;
  y: number;
  z: number;
  h: number;
  /** 'red' | 'yellow' | 'green' | 'unknown' | ... */
  color: string;
  /** 'off' | 'constant' | 'flashing' | 'counting' | ... */
  mode: string;
  icon: number;
}

/** OSI GroundTruth frame (`type: 'ground_truth'`). */
export interface GtSimGroundTruthMessage {
  type: 'ground_truth';
  sim_time: number;
  objects: GtSimOsiObject[];
  /** Omitted on frames that carry no lights (overlay should hold last value). */
  traffic_lights?: GtSimOsiTrafficLight[];
}

/** Host-vehicle dynamics frame (`type: 'host_vehicle_data'`). */
export interface GtSimHostVehicleDataMessage {
  type: 'host_vehicle_data';
  sim_time: number;
  throttle: number;
  brake: number;
  steering_angle: number;
  gear: number;
  rpm: number;
  torque: number;
  speed: number;
}

export type GtSimOsiMessage = GtSimGroundTruthMessage | GtSimHostVehicleDataMessage;

// --- VD stream (/ws/vd/{jobId}) ---

/**
 * Live VirtualDriver telemetry (`type: 'virtual_driver_telemetry'`). The
 * payload is a `VdTelemetryFrame` (identical shape to recorded replay, so the
 * same overlay/chart components drive both live and replay).
 */
export type GtSimVdMessage = { type: 'virtual_driver_telemetry' } & VdTelemetryFrame;

// --- SV stream (/ws/sv/{jobId}) ---

/** Scenario-variables snapshot (`type: 'scenario_variables'`). */
export interface GtSimScenarioVariablesMessage {
  type: 'scenario_variables';
  variables: Record<string, unknown>;
  sim_time: number;
}

// --- Presets stream (/ws/presets/{projectId}) ---

/**
 * External preset-file change notice (`type: 'presets_changed'`). Optional
 * `scenario_stem` scopes the change to one scenario within the project.
 */
export interface GtSimPresetsChangedMessage {
  type: 'presets_changed';
  scenario_stem?: string;
}

// --- Input stream (/ws/input/{jobId}) — SEND only ---

/**
 * Manual-override button bitmask sent in `GtSimInputCommand.buttons`.
 * Matches the fork's `BTN` constants (VdManualOverridePanel).
 */
export const GT_SIM_INPUT_BUTTONS = {
  OVERRIDE: 1 << 0,
  INDICATOR_LEFT: 1 << 1,
  INDICATOR_RIGHT: 1 << 2,
  HAZARD: 1 << 6,
} as const;

export type GtSimInputButton = keyof typeof GT_SIM_INPUT_BUTTONS;

/** Send rate for the input stream (Hz). */
export const GT_SIM_INPUT_SEND_HZ = 30;

/** Payload pushed to `/ws/input/{jobId}` at `GT_SIM_INPUT_SEND_HZ`. */
export interface GtSimInputCommand {
  /** Steering, normalized [-1, 1]. */
  steering: number;
  /** Throttle, normalized [0, 1]. */
  throttle: number;
  /** Brake, normalized [0, 1]. */
  brake: number;
  /** `GT_SIM_INPUT_BUTTONS` bitmask. */
  buttons: number;
}

// --- URL builders (host injected via wsBaseUrl, e.g. `ws://127.0.0.1:8000`) ---

function join(wsBaseUrl: string, path: string): string {
  return `${wsBaseUrl.replace(/\/+$/, '')}${path}`;
}

/** `{wsBaseUrl}/ws/osi/{jobId}` */
export function gtSimOsiWsUrl(wsBaseUrl: string, jobId: string): string {
  return join(wsBaseUrl, `/ws/osi/${encodeURIComponent(jobId)}`);
}

/** `{wsBaseUrl}/ws/vd/{jobId}` */
export function gtSimVdWsUrl(wsBaseUrl: string, jobId: string): string {
  return join(wsBaseUrl, `/ws/vd/${encodeURIComponent(jobId)}`);
}

/** `{wsBaseUrl}/ws/sv/{jobId}` */
export function gtSimSvWsUrl(wsBaseUrl: string, jobId: string): string {
  return join(wsBaseUrl, `/ws/sv/${encodeURIComponent(jobId)}`);
}

/** `{wsBaseUrl}/ws/presets/{projectId}` */
export function gtSimPresetsWsUrl(wsBaseUrl: string, projectId: string): string {
  return join(wsBaseUrl, `/ws/presets/${encodeURIComponent(projectId)}`);
}

/** `{wsBaseUrl}/ws/input/{jobId}` */
export function gtSimInputWsUrl(wsBaseUrl: string, jobId: string): string {
  return join(wsBaseUrl, `/ws/input/${encodeURIComponent(jobId)}`);
}
