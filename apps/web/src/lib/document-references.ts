import type { StoreApi } from 'zustand/vanilla';
import type { ScenarioStore } from '@osce/scenario-engine';
import type { ScenarioDocument } from '@osce/shared';
import { computeRelativeFilePath } from './catalog-location-utils';

/**
 * Owns all logicFile (scenario → road) reference reconciliation. Keeping the
 * correction logic in a single module guarantees it is applied exactly once,
 * whether on scenario save, scenario Save-As, or road Save-As.
 *
 * Path convention: in-store paths are project-root-relative (e.g.
 * `xodr/highway.xodr`); serialization emits xosc-relative paths per the
 * OpenSCENARIO spec (e.g. `../xodr/highway.xodr`). Documents parsed from disk,
 * however, carry xosc-relative values in-store, so an in-store `logicFile`
 * may already be in either recognized form.
 */

export interface LogicFileReconcileResult {
  /** Document to serialize — a corrected clone when the reference needed rewriting. */
  doc: ScenarioDocument;
  /** True when the output logicFile differs from the input. */
  corrected: boolean;
  /** True when the input reference did not denote the session road under any recognized convention — surface a warning. */
  inconsistent: boolean;
  /** The xosc-relative path written into the corrected doc (set when corrected). */
  correctedPath?: string;
}

/**
 * Reconcile the scenario's `roadNetwork.logicFile` against the session road for
 * serialization, returning the document to write plus whether the input was
 * corrected and/or inconsistent.
 *
 * A rewrite is silent (`inconsistent: false`) when the input reference already
 * denotes the session road under a recognized convention:
 * - `actual === xodrRelativePath` — internal project-root-relative form, as set
 *   by the road Save-As sync or the file picker; or
 * - (only when `options.previousXoscRelativePath` is given, i.e. a scenario
 *   Save-As moved the file) `actual` was the correct xosc-relative path for the
 *   old location — recomputing it for the new location is expected.
 *
 * Anything else is `inconsistent: true`: the reference no longer denotes the
 * session road (e.g. the sync command was undone, or the reference was
 * hand-pointed elsewhere). The pair is still re-enforced — that correction has
 * always happened silently at save time; this makes it visible.
 *
 * The corrected document is a shallow clone (fresh doc / roadNetwork / logicFile
 * objects); the input is never mutated. Returns a no-op result when the road is
 * unverifiable (`xodrRelativePath` null) or the scenario has no `logicFile`.
 */
export function reconcileLogicFileForSave(
  doc: ScenarioDocument,
  xoscRelativePath: string,
  xodrRelativePath: string | null,
  options?: { previousXoscRelativePath?: string | null },
): LogicFileReconcileResult {
  // Unverifiable (no session road) or nothing to manage (no reference).
  if (!xodrRelativePath || !doc.roadNetwork?.logicFile) {
    return { doc, corrected: false, inconsistent: false };
  }

  const expected = computeRelativeFilePath(xoscRelativePath, xodrRelativePath);
  const actual = doc.roadNetwork.logicFile.filepath;

  // Already the expected xosc-relative form.
  if (actual === expected) {
    return { doc, corrected: false, inconsistent: false };
  }

  const previous = options?.previousXoscRelativePath;
  const consistent =
    actual === xodrRelativePath ||
    (previous != null && actual === computeRelativeFilePath(previous, xodrRelativePath));

  return {
    doc: {
      ...doc,
      roadNetwork: {
        ...doc.roadNetwork,
        logicFile: { filepath: expected },
      },
    },
    corrected: true,
    inconsistent: !consistent,
    correctedPath: expected,
  };
}

/**
 * After a road Save-As, re-point the open scenario's logicFile at the new path
 * through the undoable UpdateRoadNetwork command (the scenario going dirty is
 * the correct behavior — the reference is real document content).
 * Never invents a reference: scenarios without a logicFile are left alone.
 * Returns true when a command was applied.
 */
export function syncLogicFileAfterRoadSaveAs(
  scenarioApi: StoreApi<ScenarioStore>,
  newXodrRelativePath: string,
): boolean {
  const logicFile = scenarioApi.getState().document.roadNetwork?.logicFile;
  if (!logicFile || logicFile.filepath === newXodrRelativePath) return false;
  // Project-root-relative value (matches the picker / currentXodrPath
  // convention); reconcileLogicFileForSave converts it on serialization.
  scenarioApi.getState().updateRoadNetwork({ logicFile: { filepath: newXodrRelativePath } });
  return true;
}
