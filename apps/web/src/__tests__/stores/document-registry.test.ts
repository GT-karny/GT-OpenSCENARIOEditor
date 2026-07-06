/**
 * DocumentRegistry — derived-dirty semantics (S1-2, semantics table 1-B).
 *
 * Drives a real scenario engine store through the registry to prove that dirty
 * is derived from the command-history revision, not a hand-set flag: editing
 * makes it dirty, undoing back to the save point makes it clean again, and
 * save/load capture a fresh clean baseline.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createScenarioStore } from '@osce/scenario-engine';
import type { StoreApi } from 'zustand/vanilla';
import type { ScenarioStore } from '@osce/scenario-engine';
import type { CatalogEntry } from '@osce/shared';
import { parseCatalogXml } from '@osce/openscenario';
import { useDocumentRegistry, initDocumentRegistry } from '../../stores/document-registry';
import { useCatalogStore } from '../../stores/catalog-store';

let scenarioApi: StoreApi<ScenarioStore>;
let cleanup: () => void;

const registry = () => useDocumentRegistry.getState();

beforeEach(() => {
  scenarioApi = createScenarioStore();
  cleanup = initDocumentRegistry(scenarioApi);
});

afterEach(() => cleanup());

describe('DocumentRegistry derived dirty', () => {
  it('a freshly initialized document is clean', () => {
    // File load / File>New land here: revision 0 == savedRevision 0.
    expect(registry().isDirty('scenario')).toBe(false);
    expect(registry().anyDirty()).toBe(false);
  });

  it('markLoaded keeps a just-loaded document clean', () => {
    registry().markLoaded('scenario');
    expect(registry().isDirty('scenario')).toBe(false);
  });

  it('an edit makes the document dirty', () => {
    registry().markLoaded('scenario');
    scenarioApi.getState().addEntity({ name: 'ego' });
    expect(registry().isDirty('scenario')).toBe(true);
    expect(registry().dirtyKinds()).toContain('scenario');
  });

  it('undoing back to the save point restores clean (core revision value)', () => {
    registry().markLoaded('scenario');
    scenarioApi.getState().addEntity({ name: 'ego' });
    expect(registry().isDirty('scenario')).toBe(true);

    scenarioApi.getState().undo();
    expect(registry().isDirty('scenario')).toBe(false);
  });

  it('markSaved captures a new clean baseline mid-history', () => {
    registry().markLoaded('scenario');
    scenarioApi.getState().addEntity({ name: 'a' });
    // Save at this position: dirty clears without any undo.
    registry().markSaved('scenario');
    expect(registry().isDirty('scenario')).toBe(false);

    // A further edit is dirty again; undoing to the save point clears it.
    scenarioApi.getState().addEntity({ name: 'b' });
    expect(registry().isDirty('scenario')).toBe(true);
    scenarioApi.getState().undo();
    expect(registry().isDirty('scenario')).toBe(false);
  });

  it('markRestoredDirty forces dirty until the next save (autosave recovery)', () => {
    registry().markLoaded('scenario');
    registry().markRestoredDirty('scenario');
    expect(registry().isDirty('scenario')).toBe(true);
    // A save clears the recovery-dirty sentinel.
    registry().markSaved('scenario');
    expect(registry().isDirty('scenario')).toBe(false);
  });
});

const CATALOG_XML = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="3" date="2026-07-06" description="test" author="test"/>
  <Catalog name="Cat">
    <Vehicle name="car0" vehicleCategory="car">
      <ParameterDeclarations/>
      <BoundingBox>
        <Center x="1.4" y="0.0" z="0.75"/>
        <Dimensions width="2.0" length="5.04" height="1.5"/>
      </BoundingBox>
      <Performance maxSpeed="69.4" maxAcceleration="5" maxDeceleration="10"/>
      <Axles>
        <FrontAxle maxSteering="0.52" wheelDiameter="0.8" trackWidth="1.68" positionX="2.98" positionZ="0.4"/>
        <RearAxle maxSteering="0.0" wheelDiameter="0.8" trackWidth="1.68" positionX="0" positionZ="0.4"/>
      </Axles>
      <Properties/>
    </Vehicle>
  </Catalog>
</OpenSCENARIO>`;
const CATALOG_ENTRY = parseCatalogXml(CATALOG_XML).entries[0];

describe('DocumentRegistry — catalog kind', () => {
  beforeEach(() => useCatalogStore.getState().resetAll());

  it('liveRevision derives the catalog kind through the real catalog store', () => {
    useCatalogStore.getState().loadCatalog(CATALOG_XML, 'Cat.xosc');
    expect(registry().isDirty('catalog')).toBe(false);

    useCatalogStore.getState().addEntry('Cat', {
      ...CATALOG_ENTRY,
      definition: { ...CATALOG_ENTRY.definition, name: 'added' },
    } as CatalogEntry);
    expect(registry().isDirty('catalog')).toBe(true);
    expect(registry().dirtyKinds()).toContain('catalog');
  });

  it('markSaved captures a clean baseline; undo past it re-dirties', () => {
    useCatalogStore.getState().loadCatalog(CATALOG_XML, 'Cat.xosc');
    useCatalogStore.getState().addEntry('Cat', {
      ...CATALOG_ENTRY,
      definition: { ...CATALOG_ENTRY.definition, name: 'added' },
    } as CatalogEntry);

    registry().markSaved('catalog');
    expect(registry().isDirty('catalog')).toBe(false);

    useCatalogStore.getState().undoCatalog();
    expect(registry().isDirty('catalog')).toBe(true);
  });

  it('markLoaded keeps a just-loaded catalog clean', () => {
    useCatalogStore.getState().loadCatalog(CATALOG_XML, 'Cat.xosc');
    registry().markLoaded('catalog');
    expect(registry().isDirty('catalog')).toBe(false);
  });
});
