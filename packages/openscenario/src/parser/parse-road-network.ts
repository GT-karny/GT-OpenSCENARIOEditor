import type { RoadNetwork, TrafficSignalController, TrafficSignalPhase, TrafficSignalState } from '@osce/shared';
import { ensureArray } from '../utils/ensure-array.js';
import { generateId } from '../utils/uuid.js';
import { strAttr, numAttr, optNumAttr, optStrAttr } from '../utils/xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseRoadNetwork(raw: any): RoadNetwork {
  if (!raw) return {};
  return {
    logicFile: raw.LogicFile
      ? { filepath: strAttr(raw.LogicFile, 'filepath') }
      : undefined,
    sceneGraphFile: raw.SceneGraphFile
      ? { filepath: strAttr(raw.SceneGraphFile, 'filepath') }
      : undefined,
    trafficSignals: raw.TrafficSignalController
      ? ensureArray(raw.TrafficSignalController).map(parseTrafficSignalController)
      : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTrafficSignalController(raw: any): TrafficSignalController {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    delay: optNumAttr(raw, 'delay'),
    reference: optStrAttr(raw, 'reference'),
    phases: ensureArray(raw?.TrafficSignalPhase).map(parseTrafficSignalPhase),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTrafficSignalPhase(raw: any): TrafficSignalPhase {
  return {
    name: strAttr(raw, 'name'),
    duration: numAttr(raw, 'duration'),
    trafficSignalStates: ensureArray(raw?.TrafficSignalState).map(parseTrafficSignalState),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTrafficSignalState(raw: any): TrafficSignalState {
  return {
    trafficSignalId: strAttr(raw, 'trafficSignalId'),
    state: strAttr(raw, 'state'),
  };
}
