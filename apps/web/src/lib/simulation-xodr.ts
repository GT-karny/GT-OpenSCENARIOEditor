import { XodrSerializer } from '@osce/opendrive';
import { useEditorStore } from '../stores/editor-store';

/**
 * Result of resolving the OpenDRIVE payload for a simulation run.
 *
 * `degraded` is true when the raw editor XML was unavailable and we had to
 * re-serialize from the parsed road model instead (see danger sequence #2:
 * editing a road can null out `roadNetworkXml`). Callers should surface a
 * warning to the user when `degraded` is true so a stale/re-derived road is
 * never used silently.
 */
export interface SimulationXodr {
  xml: string | undefined;
  degraded: boolean;
}

/**
 * Resolve the OpenDRIVE XML to hand to the simulator, with a fallback so
 * simulation never runs against a stale/null road network.
 *
 * Priority:
 *  1. Raw editor XML (`roadNetworkXml`) — the authoritative, on-disk-equivalent
 *     source. Used verbatim when present.
 *  2. Parsed model (`roadNetwork`) — re-serialized on the fly when the raw XML
 *     is missing. Flagged `degraded` so the caller can warn.
 *  3. Neither — no road network is loaded; returns `undefined` (not degraded).
 */
export function getSimulationXodr(): SimulationXodr {
  const state = useEditorStore.getState();

  if (state.roadNetworkXml) {
    return { xml: state.roadNetworkXml, degraded: false };
  }

  if (state.roadNetwork) {
    const xml = new XodrSerializer().serializeFormatted(state.roadNetwork);
    return { xml, degraded: true };
  }

  return { xml: undefined, degraded: false };
}
