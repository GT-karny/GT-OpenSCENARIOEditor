import type { RoadNetwork, TrafficSignalController, TrafficSignalPhase, TrafficSignalState } from '@osce/shared';
import type { RawXml } from '../utils/xml-helpers.js';
import { generateId } from '@osce/shared';
import { strAttr, numAttr, optNumAttr, optStrAttr, child, children } from '../utils/xml-helpers.js';

export function parseRoadNetwork(raw: RawXml | undefined): RoadNetwork {
  if (!raw) return {};
  const logicFile = child(raw, 'LogicFile');
  const sceneGraphFile = child(raw, 'SceneGraphFile');
  const trafficSignals = child(raw, 'TrafficSignals');
  return {
    logicFile: logicFile ? { filepath: strAttr(logicFile, 'filepath') } : undefined,
    sceneGraphFile: sceneGraphFile ? { filepath: strAttr(sceneGraphFile, 'filepath') } : undefined,
    trafficSignals: child(trafficSignals, 'TrafficSignalController')
      ? children(trafficSignals, 'TrafficSignalController').map(parseTrafficSignalController)
      : undefined,
  };
}

function parseTrafficSignalController(raw: RawXml): TrafficSignalController {
  return {
    id: generateId(),
    name: strAttr(raw, 'name'),
    delay: optNumAttr(raw, 'delay'),
    reference: optStrAttr(raw, 'reference'),
    phases: children(raw, 'Phase').map(parseTrafficSignalPhase),
  };
}

function parseTrafficSignalPhase(raw: RawXml): TrafficSignalPhase {
  return {
    name: strAttr(raw, 'name'),
    duration: numAttr(raw, 'duration'),
    trafficSignalStates: children(raw, 'TrafficSignalState').map(parseTrafficSignalState),
  };
}

function parseTrafficSignalState(raw: RawXml): TrafficSignalState {
  return {
    trafficSignalId: strAttr(raw, 'trafficSignalId'),
    state: strAttr(raw, 'state'),
  };
}
