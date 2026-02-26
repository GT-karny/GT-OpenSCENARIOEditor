import type { RoadNetwork } from '@osce/shared';
import { buildAttrs } from '../utils/xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildRoadNetwork(rn: RoadNetwork): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};
  if (rn.logicFile) {
    result.LogicFile = buildAttrs({ filepath: rn.logicFile.filepath });
  }
  if (rn.sceneGraphFile) {
    result.SceneGraphFile = buildAttrs({ filepath: rn.sceneGraphFile.filepath });
  }
  if (rn.trafficSignals && rn.trafficSignals.length > 0) {
    result.TrafficSignalController = rn.trafficSignals.map((tsc) => ({
      ...buildAttrs({
        name: tsc.name,
        delay: tsc.delay,
        reference: tsc.reference,
      }),
      Phase: tsc.phases.map((phase) => ({
        ...buildAttrs({ name: phase.name, duration: phase.duration }),
        TrafficSignalState: phase.trafficSignalStates.map((tss) =>
          buildAttrs({ trafficSignalId: tss.trafficSignalId, state: tss.state }),
        ),
      })),
    }));
  }
  return result;
}
