import { describe, it, expect, vi } from 'vitest';
import { createDefaultDocument as createScenarioDoc } from '@osce/scenario-engine';
import { createDefaultDocument as createOpenDriveDoc } from '@osce/opendrive-engine';
import type { CatalogDocument, ParameterValueDistributionDocument } from '@osce/shared';
import {
  buildSnapshot,
  applySnapshot,
  migrateSnapshot,
  type RestoreTargets,
} from '../../lib/autosave/snapshot-mapping';
import type {
  AutosaveCatalogEntry,
  AutosaveSnapshot,
  AutosaveSnapshotV1,
} from '../../lib/autosave/types';

function catalogDoc(name: string): CatalogDocument {
  return {
    id: name,
    fileHeader: { revMajor: 1, revMinor: 3, date: '2026-01-01', description: '', author: '' },
    catalogName: name,
    catalogType: 'vehicle',
    entries: [],
  };
}

function distributionDoc(): ParameterValueDistributionDocument {
  return {
    id: 'd',
    fileHeader: { revMajor: 1, revMinor: 3, date: '2026-01-01', description: '', author: '' },
    scenarioFilepath: 'base.xosc',
    distribution: { kind: 'deterministic', entries: [] },
  };
}

const catalogs: AutosaveCatalogEntry[] = [
  { name: 'Vehicles', doc: catalogDoc('Vehicles'), sourcePath: 'Catalogs/Vehicles.xosc' },
];

describe('buildSnapshot', () => {
  it('carries all documents, file name, version, and an explicit timestamp', () => {
    const scenario = createScenarioDoc();
    const opendrive = createOpenDriveDoc();
    const distribution = distributionDoc();

    const snapshot = buildSnapshot(
      { scenario, opendrive, catalogs, distribution, fileName: 'demo.xosc' },
      1234,
    );

    expect(snapshot.version).toBe(2);
    expect(snapshot.savedAt).toBe(1234);
    expect(snapshot.scenario).toBe(scenario);
    expect(snapshot.opendrive).toBe(opendrive);
    expect(snapshot.catalogs).toBe(catalogs);
    expect(snapshot.distribution).toBe(distribution);
    expect(snapshot.fileName).toBe('demo.xosc');
  });

  it('preserves empty catalogs, null distribution, null OpenDRIVE, and null file name', () => {
    const scenario = createScenarioDoc();
    const snapshot = buildSnapshot(
      { scenario, opendrive: null, catalogs: [], distribution: null, fileName: null },
      0,
    );
    expect(snapshot.opendrive).toBeNull();
    expect(snapshot.catalogs).toEqual([]);
    expect(snapshot.distribution).toBeNull();
    expect(snapshot.fileName).toBeNull();
  });

  it('defaults savedAt to the current time when omitted', () => {
    const before = Date.now();
    const snapshot = buildSnapshot({
      scenario: createScenarioDoc(),
      opendrive: null,
      catalogs: [],
      distribution: null,
      fileName: null,
    });
    expect(snapshot.savedAt).toBeGreaterThanOrEqual(before);
    expect(snapshot.savedAt).toBeLessThanOrEqual(Date.now());
  });
});

describe('migrateSnapshot', () => {
  it('upgrades a v1 record (no version) to v2 with empty catalogs and no distribution', () => {
    const v1: AutosaveSnapshotV1 = {
      savedAt: 7,
      scenario: createScenarioDoc(),
      opendrive: null,
      fileName: 'legacy.xosc',
    };
    const migrated = migrateSnapshot(v1);
    expect(migrated.version).toBe(2);
    expect(migrated.catalogs).toEqual([]);
    expect(migrated.distribution).toBeNull();
    // Carried-over fields are preserved.
    expect(migrated.savedAt).toBe(7);
    expect(migrated.fileName).toBe('legacy.xosc');
    expect(migrated.scenario).toBe(v1.scenario);
  });

  it('returns a v2 record unchanged', () => {
    const v2: AutosaveSnapshot = {
      version: 2,
      savedAt: 1,
      scenario: createScenarioDoc(),
      opendrive: null,
      catalogs,
      distribution: distributionDoc(),
      fileName: null,
    };
    expect(migrateSnapshot(v2)).toBe(v2);
  });
});

describe('applySnapshot', () => {
  function makeTargets() {
    const calls: string[] = [];
    const targets: RestoreTargets = {
      loadScenario: vi.fn(() => calls.push('loadScenario')),
      setOpenDrive: vi.fn(() => calls.push('setOpenDrive')),
      restoreCatalogs: vi.fn(() => calls.push('restoreCatalogs')),
      restoreDistribution: vi.fn(() => calls.push('restoreDistribution')),
      setFileName: vi.fn(() => calls.push('setFileName')),
      markDirty: vi.fn(() => calls.push('markDirty')),
    };
    return { targets, calls };
  }

  it('restores every document, then marks dirty last', () => {
    const scenario = createScenarioDoc();
    const opendrive = createOpenDriveDoc();
    const distribution = distributionDoc();
    const snapshot: AutosaveSnapshot = {
      version: 2,
      savedAt: 1,
      scenario,
      opendrive,
      catalogs,
      distribution,
      fileName: 'demo.xosc',
    };
    const { targets, calls } = makeTargets();

    applySnapshot(snapshot, targets);

    expect(targets.loadScenario).toHaveBeenCalledWith(scenario);
    expect(targets.setOpenDrive).toHaveBeenCalledWith(opendrive);
    expect(targets.restoreCatalogs).toHaveBeenCalledWith(catalogs);
    expect(targets.restoreDistribution).toHaveBeenCalledWith(distribution);
    expect(targets.setFileName).toHaveBeenCalledWith('demo.xosc');
    expect(targets.markDirty).toHaveBeenCalledTimes(1);
    // Dirty must be marked after every document is loaded.
    expect(calls).toEqual([
      'loadScenario',
      'setOpenDrive',
      'restoreCatalogs',
      'restoreDistribution',
      'setFileName',
      'markDirty',
    ]);
  });

  it('clears the OpenDRIVE document and passes empty/null side-documents through', () => {
    const snapshot: AutosaveSnapshot = {
      version: 2,
      savedAt: 1,
      scenario: createScenarioDoc(),
      opendrive: null,
      catalogs: [],
      distribution: null,
      fileName: null,
    };
    const { targets } = makeTargets();

    applySnapshot(snapshot, targets);

    expect(targets.setOpenDrive).toHaveBeenCalledWith(null);
    expect(targets.restoreCatalogs).toHaveBeenCalledWith([]);
    expect(targets.restoreDistribution).toHaveBeenCalledWith(null);
    expect(targets.setFileName).toHaveBeenCalledWith(null);
  });
});
