/**
 * catalog-store — CommandHistory-based undo + per-catalog derived dirty (S3 D1/D2).
 *
 * Exercises the store through its public actions (the components' surface) and
 * checks both the store-level per-catalog dirty (`isCatalogDirty` /
 * `dirtyCatalogNames`) and the registry kind-level dirty that the StatusBar
 * renders. The registry is wired with a real scenario store so the catalog
 * subscription mirrors live revisions, exactly as the app does at mount.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseCatalogXml } from '@osce/openscenario';
import { createScenarioStore } from '@osce/scenario-engine';
import type { CatalogEntry } from '@osce/shared';
import { useCatalogStore } from '../../stores/catalog-store';
import { useDocumentRegistry, initDocumentRegistry } from '../../stores/document-registry';

const store = () => useCatalogStore.getState();
const registry = () => useDocumentRegistry.getState();

let cleanup: () => void;

beforeEach(() => {
  // Wiring the registry activates the catalog subscription (revision mirroring).
  cleanup = initDocumentRegistry(createScenarioStore());
  store().resetAll();
});

afterEach(() => cleanup());

function vehicleCatalogXml(name: string, entryNames: string[] = ['car0']): string {
  const vehicles = entryNames
    .map(
      (n) => `
    <Vehicle name="${n}" vehicleCategory="car">
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
    </Vehicle>`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="3" date="2026-07-06" description="test" author="test"/>
  <Catalog name="${name}">${vehicles}
  </Catalog>
</OpenSCENARIO>`;
}

// A parsed vehicle entry reused as a template so tests need not hand-build the
// full VehicleDefinition shape.
const TEMPLATE = parseCatalogXml(vehicleCatalogXml('Tmpl', ['tmpl'])).entries[0];
function entry(name: string): CatalogEntry {
  return { ...TEMPLATE, definition: { ...TEMPLATE.definition, name } } as CatalogEntry;
}

const loadA = () => store().loadCatalog(vehicleCatalogXml('A'), 'A.xosc');
const loadB = () => store().loadCatalog(vehicleCatalogXml('B'), 'B.xosc');

describe('catalog-store — load is born clean', () => {
  it('a freshly loaded catalog is clean and the kind reads clean', () => {
    loadA();
    expect(store().isCatalogDirty('A')).toBe(false);
    expect(store().dirtyCatalogNames()).toEqual([]);
    expect(registry().isDirty('catalog')).toBe(false);
  });
});

describe('catalog-store — scenario 1: save then undo goes dirty again', () => {
  it('edit A → save A → clean; undo → dirty (disk ahead)', () => {
    loadA();
    store().addEntry('A', entry('a1'));
    expect(store().isCatalogDirty('A')).toBe(true);
    expect(registry().isDirty('catalog')).toBe(true);

    store().markCatalogSaved('A');
    expect(store().isCatalogDirty('A')).toBe(false);
    expect(registry().isDirty('catalog')).toBe(false);

    store().undoCatalog();
    expect(store().isCatalogDirty('A')).toBe(true);
    expect(store().dirtyCatalogNames()).toEqual(['A']);
    expect(registry().isDirty('catalog')).toBe(true);
  });
});

describe('catalog-store — scenario 2: per-catalog save isolation', () => {
  it('edit A, edit B → save A leaves B dirty; save B cleans the kind', () => {
    loadA();
    loadB();
    store().addEntry('A', entry('a1'));
    store().addEntry('B', entry('b1'));
    expect(store().dirtyCatalogNames().sort()).toEqual(['A', 'B']);

    store().markCatalogSaved('A');
    expect(store().dirtyCatalogNames()).toEqual(['B']);
    expect(registry().isDirty('catalog')).toBe(true); // kind still dirty (B)

    store().markCatalogSaved('B');
    expect(store().dirtyCatalogNames()).toEqual([]);
    expect(registry().isDirty('catalog')).toBe(false);
  });
});

describe('catalog-store — scenario 3: reload from disk reverts dirty', () => {
  it('edit A → reload A → clean and kind re-baselined', () => {
    loadA();
    store().addEntry('A', entry('a1'));
    expect(store().isCatalogDirty('A')).toBe(true);

    loadA(); // reload over the dirty catalog = revert-to-disk
    expect(store().isCatalogDirty('A')).toBe(false);
    expect(registry().isDirty('catalog')).toBe(false);
  });
});

describe('catalog-store — scenario 4: additive load must not clear dirty', () => {
  it('edit A → load B → A stays dirty', () => {
    loadA();
    store().addEntry('A', entry('a1'));
    loadB();
    expect(store().isCatalogDirty('A')).toBe(true);
    expect(store().dirtyCatalogNames()).toEqual(['A']);
    expect(registry().isDirty('catalog')).toBe(true);
  });
});

describe('catalog-store — scenario 5: unload is undoable', () => {
  it('unload dirty A → kind clean; undo → A restored with its edit, dirty again', () => {
    loadA();
    store().addEntry('A', entry('a1'));
    const editedCount = store().catalogs.get('A')!.entries.length;

    store().unloadCatalog('A');
    expect(store().catalogs.has('A')).toBe(false);
    expect(store().dirtyCatalogNames()).toEqual([]); // ghost excluded
    expect(registry().isDirty('catalog')).toBe(false);

    store().undoCatalog();
    expect(store().catalogs.has('A')).toBe(true);
    expect(store().catalogs.get('A')!.entries.length).toBe(editedCount); // edit preserved
    expect(store().isCatalogDirty('A')).toBe(true);
    expect(registry().isDirty('catalog')).toBe(true);
  });
});

describe('catalog-store — scenario 6: undo is defensive when the catalog is gone', () => {
  it('undo of a command whose catalog was removed out-of-band does not crash', () => {
    loadA();
    store().addEntry('A', entry('a1'));
    // Remove A without a command (simulates the catalog being gone at undo time).
    useCatalogStore.setState({ catalogs: new Map() });

    expect(() => store().undoCatalog()).not.toThrow();
    expect(store().catalogs.size).toBe(0); // not resurrected, Map unchanged
  });
});

describe('catalog-store — scenario 7: rawXml round-trips through undo', () => {
  it('load A with xml → edit drops rawXml → undo restores it', () => {
    const xml = vehicleCatalogXml('A');
    store().loadCatalog(xml, 'A.xosc');
    expect(store().rawXmls.has('A')).toBe(true);

    store().addEntry('A', entry('a1'));
    expect(store().rawXmls.has('A')).toBe(false); // verbatim invalidated

    store().undoCatalog();
    expect(store().rawXmls.get('A')).toBe(xml); // lossless path restored
  });
});

describe('catalog-store — scenario 8: one undo step per action, undo restores prior state', () => {
  const steps = () => store().getCommandHistory().getUndoStack().length;

  it('addEntry: one step; undo restores entries', () => {
    loadA();
    const before = store().catalogs.get('A')!.entries.length;
    const s0 = steps();
    store().addEntry('A', entry('added'));
    expect(steps()).toBe(s0 + 1);
    expect(store().catalogs.get('A')!.entries.length).toBe(before + 1);
    store().undoCatalog();
    expect(store().catalogs.get('A')!.entries.length).toBe(before);
  });

  it('updateEntry: one step; undo restores the prior entry', () => {
    loadA();
    const originalName = store().catalogs.get('A')!.entries[0].definition.name;
    const s0 = steps();
    store().updateEntry('A', 0, entry('renamed'));
    expect(steps()).toBe(s0 + 1);
    expect(store().catalogs.get('A')!.entries[0].definition.name).toBe('renamed');
    store().undoCatalog();
    expect(store().catalogs.get('A')!.entries[0].definition.name).toBe(originalName);
  });

  it('removeEntry: one step; undo restores the removed entry', () => {
    store().loadCatalog(vehicleCatalogXml('A', ['a', 'b']), 'A.xosc');
    const before = store().catalogs.get('A')!.entries.length;
    const s0 = steps();
    store().removeEntry('A', 0);
    expect(steps()).toBe(s0 + 1);
    expect(store().catalogs.get('A')!.entries.length).toBe(before - 1);
    store().undoCatalog();
    expect(store().catalogs.get('A')!.entries.length).toBe(before);
  });

  it('duplicateEntry: one step; undo removes the clone', () => {
    loadA();
    const before = store().catalogs.get('A')!.entries.length;
    const s0 = steps();
    store().duplicateEntry('A', 0);
    expect(steps()).toBe(s0 + 1);
    expect(store().catalogs.get('A')!.entries.length).toBe(before + 1);
    store().undoCatalog();
    expect(store().catalogs.get('A')!.entries.length).toBe(before);
  });

  it('updateCatalogName: one step; undo restores the old name', () => {
    loadA();
    const s0 = steps();
    store().updateCatalogName('A', 'A2');
    expect(steps()).toBe(s0 + 1);
    expect(store().catalogs.has('A2')).toBe(true);
    expect(store().catalogs.has('A')).toBe(false);
    store().undoCatalog();
    expect(store().catalogs.has('A')).toBe(true);
    expect(store().catalogs.has('A2')).toBe(false);
  });
});
