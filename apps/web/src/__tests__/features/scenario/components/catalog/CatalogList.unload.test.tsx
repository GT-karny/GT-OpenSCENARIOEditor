/**
 * CatalogList — unload confirmation (S3 review fix 1).
 *
 * Unloading a dirty catalog silently drops its unsaved edits from every save
 * guard, so the X button must confirm first. Clean catalogs still unload
 * immediately. Dirtiness is driven through the real store (loadCatalog +
 * addEntry) so the guard is exercised end-to-end.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { parseCatalogXml } from '@osce/openscenario';
import type { CatalogEntry } from '@osce/shared';
import { initTestI18n, renderWithProviders } from '../../../../helpers/render-with-providers';
import { CatalogList } from '../../../../../features/scenario/components/catalog/CatalogList';
import { useCatalogStore } from '../../../../../stores/catalog-store';

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

// A parsed vehicle entry reused as a template so the test need not hand-build a
// full VehicleDefinition (mirrors the catalog-store test).
const TEMPLATE = parseCatalogXml(vehicleCatalogXml('Tmpl', ['tmpl'])).entries[0];
function entry(name: string): CatalogEntry {
  return { ...TEMPLATE, definition: { ...TEMPLATE.definition, name } } as CatalogEntry;
}

const store = () => useCatalogStore.getState();

beforeAll(async () => {
  await initTestI18n();
});

beforeEach(() => {
  store().resetAll();
});

// This suite does not enable vitest globals, so RTL's auto-cleanup is not
// registered; unmount between tests so rendered rows do not accumulate.
afterEach(() => cleanup());

describe('CatalogList — unload confirmation', () => {
  it('unloads a clean catalog immediately, without a confirmation dialog', () => {
    store().loadCatalog(vehicleCatalogXml('Clean'), 'Clean.xosc');
    expect(store().isCatalogDirty('Clean')).toBe(false);

    renderWithProviders(<CatalogList />);
    fireEvent.click(screen.getByTitle('Unload Catalog'));

    expect(screen.queryByText('Unload catalog?')).not.toBeInTheDocument();
    expect(store().catalogs.has('Clean')).toBe(false);
  });

  it('prompts before unloading a dirty catalog; Cancel keeps it loaded and dirty', async () => {
    store().loadCatalog(vehicleCatalogXml('Dirty'), 'Dirty.xosc');
    store().addEntry('Dirty', entry('extra'));
    expect(store().isCatalogDirty('Dirty')).toBe(true);

    renderWithProviders(<CatalogList />);
    fireEvent.click(screen.getByTitle('Unload Catalog'));

    // Confirmation appears; nothing is unloaded yet.
    expect(await screen.findByText('Unload catalog?')).toBeInTheDocument();
    expect(store().catalogs.has('Dirty')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.queryByText('Unload catalog?')).not.toBeInTheDocument();
    });
    // Still loaded and still dirty.
    expect(store().catalogs.has('Dirty')).toBe(true);
    expect(store().isCatalogDirty('Dirty')).toBe(true);
  });

  it('prompts before unloading a dirty catalog; confirming discards and unloads it', async () => {
    store().loadCatalog(vehicleCatalogXml('Dirty'), 'Dirty.xosc');
    store().addEntry('Dirty', entry('extra'));

    renderWithProviders(<CatalogList />);
    fireEvent.click(screen.getByTitle('Unload Catalog'));
    expect(await screen.findByText('Unload catalog?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Discard and unload' }));
    await waitFor(() => {
      expect(store().catalogs.has('Dirty')).toBe(false);
    });
  });
});
