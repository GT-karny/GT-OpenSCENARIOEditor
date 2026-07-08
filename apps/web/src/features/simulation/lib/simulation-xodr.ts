import { XodrSerializer } from '@osce/opendrive';
import { useEditorStore } from '../../../stores/editor-store';
import type { RoadNetworkRawXml } from '../../../stores/editor-store';
import { getOpenDriveStoreApi } from '../../../hooks/use-opendrive-store';

/**
 * Result of resolving the OpenDRIVE payload for a simulation run.
 *
 * Historically this also carried a flag that toasted a warning when the
 * verbatim editor XML had to be re-serialized from the parsed model. That
 * warning was removed on 2026-07-07 by owner decision: OpenDRIVE 1.9-P2 closed
 * the known re-serialization losses, so the re-serialized path is no longer a
 * lossy fallback worth warning about. The resolution below is unchanged; only
 * the warning semantics are gone.
 */
export interface SimulationXodr {
  xml: string | undefined;
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
 *     text is invalid for the current revision.
 *  3. Neither — no road network is loaded; returns `undefined`.
 */
export function getSimulationXodr(): SimulationXodr {
  const raw = getValidRoadXml();
  if (raw !== null) return { xml: raw };

  const { roadNetwork } = useEditorStore.getState();
  if (roadNetwork) {
    return { xml: new XodrSerializer().serializeFormatted(roadNetwork) };
  }

  return { xml: undefined };
}
