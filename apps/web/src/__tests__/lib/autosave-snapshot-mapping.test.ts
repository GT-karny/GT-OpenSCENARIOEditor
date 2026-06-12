import { describe, it, expect, vi } from 'vitest';
import { createDefaultDocument as createScenarioDoc } from '@osce/scenario-engine';
import { createDefaultDocument as createOpenDriveDoc } from '@osce/opendrive-engine';
import {
  buildSnapshot,
  applySnapshot,
  type RestoreTargets,
} from '../../lib/autosave/snapshot-mapping';
import type { AutosaveSnapshot } from '../../lib/autosave/types';

describe('buildSnapshot', () => {
  it('carries the documents, file name, and an explicit timestamp', () => {
    const scenario = createScenarioDoc();
    const opendrive = createOpenDriveDoc();

    const snapshot = buildSnapshot(
      { scenario, opendrive, fileName: 'demo.xosc' },
      1234,
    );

    expect(snapshot.savedAt).toBe(1234);
    expect(snapshot.scenario).toBe(scenario);
    expect(snapshot.opendrive).toBe(opendrive);
    expect(snapshot.fileName).toBe('demo.xosc');
  });

  it('preserves a null OpenDRIVE document and null file name', () => {
    const scenario = createScenarioDoc();
    const snapshot = buildSnapshot({ scenario, opendrive: null, fileName: null }, 0);
    expect(snapshot.opendrive).toBeNull();
    expect(snapshot.fileName).toBeNull();
  });

  it('defaults savedAt to the current time when omitted', () => {
    const before = Date.now();
    const snapshot = buildSnapshot({
      scenario: createScenarioDoc(),
      opendrive: null,
      fileName: null,
    });
    expect(snapshot.savedAt).toBeGreaterThanOrEqual(before);
    expect(snapshot.savedAt).toBeLessThanOrEqual(Date.now());
  });
});

describe('applySnapshot', () => {
  function makeTargets() {
    const calls: string[] = [];
    const targets: RestoreTargets = {
      loadScenario: vi.fn(() => calls.push('loadScenario')),
      setOpenDrive: vi.fn(() => calls.push('setOpenDrive')),
      setFileName: vi.fn(() => calls.push('setFileName')),
      markDirty: vi.fn(() => calls.push('markDirty')),
    };
    return { targets, calls };
  }

  it('restores scenario, OpenDRIVE, file name, then marks dirty', () => {
    const scenario = createScenarioDoc();
    const opendrive = createOpenDriveDoc();
    const snapshot: AutosaveSnapshot = {
      savedAt: 1,
      scenario,
      opendrive,
      fileName: 'demo.xosc',
    };
    const { targets, calls } = makeTargets();

    applySnapshot(snapshot, targets);

    expect(targets.loadScenario).toHaveBeenCalledWith(scenario);
    expect(targets.setOpenDrive).toHaveBeenCalledWith(opendrive);
    expect(targets.setFileName).toHaveBeenCalledWith('demo.xosc');
    expect(targets.markDirty).toHaveBeenCalledTimes(1);
    // Dirty must be marked after the documents are loaded.
    expect(calls).toEqual(['loadScenario', 'setOpenDrive', 'setFileName', 'markDirty']);
  });

  it('clears the OpenDRIVE document when the snapshot had none', () => {
    const snapshot: AutosaveSnapshot = {
      savedAt: 1,
      scenario: createScenarioDoc(),
      opendrive: null,
      fileName: null,
    };
    const { targets } = makeTargets();

    applySnapshot(snapshot, targets);

    expect(targets.setOpenDrive).toHaveBeenCalledWith(null);
    expect(targets.setFileName).toHaveBeenCalledWith(null);
  });
});
