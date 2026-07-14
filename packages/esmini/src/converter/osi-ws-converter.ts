/**
 * Convert a GT_Sim OSI WebSocket `ground_truth` message (lightweight JSON, not
 * protobuf) to the editor's `SimulationFrame`.
 *
 * The gRPC path already has `ground-truth-converter.ts` (protobuf →
 * `SimulationFrame`), but it only fills `time` + `objects`. The WS path additionally
 * carries per-object light strings and per-lamp traffic-light phases, so this
 * converter also fills `trafficLightStates` and `vehicleLightStates` — the
 * fields the editor's `@osce/3d-viewer` (`SimulationOverlay`,
 * `TrafficSignalGroup`) reads for light effects.
 *
 * Wire light-string vocabulary (GT_Sim `web/backend/api/osi_stream.py`):
 *  - object `head_light`   : 'on' | 'off'
 *  - object `indicator`    : 'off' | 'left' | 'right' | 'warning'
 *  - object `brake_light`  : 'off' | 'normal' | 'strong'
 *  - traffic_light `color` : 'red' | 'yellow' | 'green' | 'blue' | 'white' | 'other' | 'unknown'
 *  - traffic_light `mode`  : 'off' | 'constant' | 'flashing' | 'counting' | 'other' | 'unknown'
 *
 * Pure functions — no side effects, no state.
 */

import type {
  SimulationFrame,
  SimulationObjectState,
  TrafficLightFrameState,
  VehicleLightFrameState,
} from '@osce/shared';
import type {
  GtSimGroundTruthMessage,
  GtSimOsiObject,
  GtSimOsiTrafficLight,
} from '../streaming/types.js';

const INDICATOR_VALUES = new Set(['off', 'left', 'right', 'warning']);

/** Convert an OSI WS `ground_truth` message to a `SimulationFrame`. */
export function convertOsiGroundTruthMessage(msg: GtSimGroundTruthMessage): SimulationFrame {
  // Hot path (GroundTruth arrives at up to ~100 Hz): one pass over the objects,
  // computing the name fallback once per object.
  const source = msg.objects ?? [];
  const objects: SimulationObjectState[] = new Array(source.length);
  const vehicleLightStates: VehicleLightFrameState[] = new Array(source.length);
  for (let i = 0; i < source.length; i++) {
    const obj = source[i];
    const name = objectName(obj);
    objects[i] = toObjectState(obj, name);
    vehicleLightStates[i] = toVehicleLights(obj, name);
  }

  const frame: SimulationFrame = {
    time: msg.sim_time ?? 0,
    objects,
    vehicleLightStates,
  };
  // Only attach traffic-light states when the frame actually carried them, so a
  // frame that omits the field doesn't clear a held overlay (mirrors the fork's
  // useOsiStream "hold last value" behaviour).
  if (msg.traffic_lights !== undefined) {
    frame.trafficLightStates = msg.traffic_lights.map(convertTrafficLight);
  }
  return frame;
}

/** Display name of an OSI WS object (`object_{id}` fallback). */
function objectName(obj: GtSimOsiObject): string {
  return obj.name || `object_${obj.id}`;
}

function toObjectState(obj: GtSimOsiObject, name: string): SimulationObjectState {
  return {
    id: obj.id,
    name,
    x: obj.x,
    y: obj.y,
    z: obj.z,
    h: obj.h,
    // The WS payload carries no pitch/roll (2.5D scene); default to level.
    p: 0,
    r: 0,
    speed: obj.speed,
  };
}

function toVehicleLights(obj: GtSimOsiObject, name: string): VehicleLightFrameState {
  const indicator = INDICATOR_VALUES.has(obj.indicator)
    ? (obj.indicator as VehicleLightFrameState['indicator'])
    : 'off';
  return {
    name,
    indicator,
    headLight: obj.head_light === 'on',
    // The OSI WS object carries no distinct high-beam field (osi_stream.py maps
    // head_light to a single on/off). High beam is not available on this path.
    highBeam: false,
    brakeLight: obj.brake_light !== 'off',
  };
}

/** Convert a single OSI WS object to `SimulationObjectState`. */
export function convertOsiObject(obj: GtSimOsiObject): SimulationObjectState {
  return toObjectState(obj, objectName(obj));
}

/** Extract a `VehicleLightFrameState` from an OSI WS object's light strings. */
export function convertVehicleLights(obj: GtSimOsiObject): VehicleLightFrameState {
  return toVehicleLights(obj, objectName(obj));
}

/**
 * Convert an OSI WS traffic-light lamp to a `TrafficLightFrameState`.
 *
 * `state` uses the lamp colour name when lit ('red'/'yellow'/'green'/...), or
 * 'off' when the mode is off — the vocabulary `@osce/3d-viewer`'s
 * `parse-traffic-light-state.ts` understands. NOTE: `signalId` here is the OSI
 * object id, which is NOT the OpenDRIVE signal id the 3d-viewer keys on; the
 * OSI-id -> OpenDRIVE-signal-id mapping is a Phase 2 concern (see final report).
 * Flashing mode collapses to the steady colour on this path.
 */
export function convertTrafficLight(tl: GtSimOsiTrafficLight): TrafficLightFrameState {
  return {
    signalId: tl.id,
    state: tl.mode === 'off' ? 'off' : tl.color,
  };
}
