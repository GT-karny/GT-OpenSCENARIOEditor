import { describe, it, expect, vi } from 'vitest';
import type { StoreApi } from 'zustand/vanilla';
import type { ScenarioStore } from '@osce/scenario-engine';
import type { ScenarioDocument } from '@osce/shared';
import {
  reconcileLogicFileForSave,
  syncLogicFileAfterRoadSaveAs,
} from '../../lib/document-references';

// Realistic session paths (both project-root-relative; the xosc lives one
// directory below the root). computeRelativeFilePath(XOSC, XODR) === EXPECTED.
const XOSC = 'scenarios/main.xosc';
const XODR = 'xodr/highway.xodr';
const EXPECTED = '../xodr/highway.xodr';

/** Minimal ScenarioDocument carrying only the roadNetwork.logicFile under test. */
function makeDoc(logicFilePath?: string): ScenarioDocument {
  return {
    roadNetwork: logicFilePath ? { logicFile: { filepath: logicFilePath } } : {},
  } as unknown as ScenarioDocument;
}

describe('reconcileLogicFileForSave', () => {
  it('(a) no xodr path → no-op, returns the same doc', () => {
    const doc = makeDoc(EXPECTED);
    const result = reconcileLogicFileForSave(doc, XOSC, null);
    expect(result).toEqual({ doc, corrected: false, inconsistent: false });
    expect(result.doc).toBe(doc);
  });

  it('(b) no logicFile → no-op', () => {
    const doc = makeDoc();
    const result = reconcileLogicFileForSave(doc, XOSC, XODR);
    expect(result.corrected).toBe(false);
    expect(result.inconsistent).toBe(false);
    expect(result.doc).toBe(doc);
  });

  it('(c) actual === expected → no-op', () => {
    const doc = makeDoc(EXPECTED);
    const result = reconcileLogicFileForSave(doc, XOSC, XODR);
    expect(result.corrected).toBe(false);
    expect(result.inconsistent).toBe(false);
    expect(result.doc).toBe(doc);
  });

  it('(d) actual === xodrRelativePath (internal root-relative form) → corrected, not inconsistent', () => {
    const doc = makeDoc(XODR);
    const result = reconcileLogicFileForSave(doc, XOSC, XODR);
    expect(result.corrected).toBe(true);
    expect(result.inconsistent).toBe(false);
    expect(result.correctedPath).toBe(EXPECTED);
    expect(result.doc.roadNetwork.logicFile?.filepath).toBe(EXPECTED);
  });

  it('(e) actual correct for previousXoscRelativePath (move case) → corrected, not inconsistent', () => {
    // The old location was deeper; its correct xosc-relative path had two ups.
    const previous = 'scenarios/sub/main.xosc';
    const oldRelative = '../../xodr/highway.xodr';
    const doc = makeDoc(oldRelative);
    const result = reconcileLogicFileForSave(doc, XOSC, XODR, {
      previousXoscRelativePath: previous,
    });
    expect(result.corrected).toBe(true);
    expect(result.inconsistent).toBe(false);
    expect(result.correctedPath).toBe(EXPECTED);
  });

  it('(f) unrelated reference → corrected and inconsistent, correctedPath === expected', () => {
    const doc = makeDoc('totally/wrong.xodr');
    const result = reconcileLogicFileForSave(doc, XOSC, XODR);
    expect(result.corrected).toBe(true);
    expect(result.inconsistent).toBe(true);
    expect(result.correctedPath).toBe(EXPECTED);
    expect(result.doc.roadNetwork.logicFile?.filepath).toBe(EXPECTED);
  });

  it('(g) in-place save (no previous) with a would-be-previous form → inconsistent', () => {
    // Same value as (e), but without previousXoscRelativePath the move exemption
    // does not apply, so the divergence is surfaced.
    const doc = makeDoc('../../xodr/highway.xodr');
    const result = reconcileLogicFileForSave(doc, XOSC, XODR);
    expect(result.corrected).toBe(true);
    expect(result.inconsistent).toBe(true);
  });

  it('(h) never mutates the input; corrected doc is a distinct object graph', () => {
    const doc = makeDoc('totally/wrong.xodr');
    const originalRoadNetwork = doc.roadNetwork;
    const result = reconcileLogicFileForSave(doc, XOSC, XODR);
    // Input untouched.
    expect(doc.roadNetwork).toBe(originalRoadNetwork);
    expect(doc.roadNetwork.logicFile?.filepath).toBe('totally/wrong.xodr');
    // Output is a fresh graph.
    expect(result.doc).not.toBe(doc);
    expect(result.doc.roadNetwork).not.toBe(doc.roadNetwork);
    expect(result.doc.roadNetwork.logicFile?.filepath).toBe(EXPECTED);
  });
});

describe('syncLogicFileAfterRoadSaveAs', () => {
  function fakeApi(document: ScenarioDocument) {
    const updateRoadNetwork = vi.fn();
    const api = {
      getState: () => ({ document, updateRoadNetwork }),
    } as unknown as StoreApi<ScenarioStore>;
    return { api, updateRoadNetwork };
  }

  it('no logicFile → false, command not applied', () => {
    const { api, updateRoadNetwork } = fakeApi(makeDoc());
    expect(syncLogicFileAfterRoadSaveAs(api, 'xodr/new.xodr')).toBe(false);
    expect(updateRoadNetwork).not.toHaveBeenCalled();
  });

  it('already at the new path → false, command not applied', () => {
    const { api, updateRoadNetwork } = fakeApi(makeDoc('xodr/new.xodr'));
    expect(syncLogicFileAfterRoadSaveAs(api, 'xodr/new.xodr')).toBe(false);
    expect(updateRoadNetwork).not.toHaveBeenCalled();
  });

  it('differing path → true, applies UpdateRoadNetwork with the new filepath', () => {
    const { api, updateRoadNetwork } = fakeApi(makeDoc('xodr/old.xodr'));
    expect(syncLogicFileAfterRoadSaveAs(api, 'xodr/new.xodr')).toBe(true);
    expect(updateRoadNetwork).toHaveBeenCalledWith({ logicFile: { filepath: 'xodr/new.xodr' } });
  });
});
