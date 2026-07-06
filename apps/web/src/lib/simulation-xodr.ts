import { XodrSerializer } from '@osce/opendrive';
import { useEditorStore } from '../stores/editor-store';
import type { RoadNetworkRawXml } from '../stores/editor-store';
import { getOpenDriveStoreApi } from '../hooks/use-opendrive-store';

/**
 * Result of resolving the OpenDRIVE payload for a simulation run.
 *
 * `degraded` is true when the verbatim editor XML was not valid for the current
 * model and we re-serialized from the parsed road model instead. Callers must
 * surface a warning when `degraded` is true so a re-derived road is never used
 * silently (danger sequence #2 permanent fix — this warning stays until the
 * OpenDRIVE 1.9-P2 lossless round-trip lands; do not remove it).
 */
export interface SimulationXodr {
  xml: string | undefined;
  degraded: boolean;
}

/** Live OpenDRIVE command-history revision. */
function currentRoadRevision(): number {
  return getOpenDriveStoreApi().getState().getCommandHistory().getRevision();
}

/**
 * THE validity rule for the verbatim xodr cache — every consumer (imperative or
 * reactive) must decide through this single predicate so the rule can never
 * drift between call sites.
 */
export function isRawXmlValid(
  cache: RoadNetworkRawXml | null,
  revision: number,
): cache is RoadNetworkRawXml {
  return cache !== null && cache.validForRevision === revision;
}

/**
 * The verbatim xodr text, or null when the model has moved off the revision the
 * text was captured at. Validity is revision-derived, never nulled on edit: an
 * undo back to `validForRevision` (e.g. back to the load baseline) re-validates
 * the cached text automatically.
 */
export function getValidRoadXml(): string | null {
  const cache = useEditorStore.getState().roadNetworkRawXml;
  return isRawXmlValid(cache, currentRoadRevision()) ? cache.text : null;
}

/**
 * Resolve the OpenDRIVE XML to hand to the simulator, with a fallback so
 * simulation never runs against a stale/null road network.
 *
 * Priority:
 *  1. Verbatim editor XML — the authoritative, on-disk-equivalent source, used
 *     as-is while it is still valid for the current revision.
 *  2. Parsed model (`roadNetwork`) — re-serialized on the fly when the verbatim
 *     text is invalid for the current revision. Flagged `degraded` so the caller
 *     can warn.
 *  3. Neither — no road network is loaded; returns `undefined` (not degraded).
 */
export function getSimulationXodr(): SimulationXodr {
  const raw = getValidRoadXml();
  if (raw !== null) return { xml: raw, degraded: false };

  const { roadNetwork } = useEditorStore.getState();
  if (roadNetwork) {
    const xml = new XodrSerializer().serializeFormatted(roadNetwork);
    return { xml, degraded: true };
  }

  return { xml: undefined, degraded: false };
}
