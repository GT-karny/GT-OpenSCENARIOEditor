import type { CatalogLocations, CatalogLocation } from '@osce/shared';
import type { RawXml } from '../utils/xml-helpers.js';
import { strAttr, child } from '../utils/xml-helpers.js';

const CATALOG_KEYS: Array<[string, keyof CatalogLocations]> = [
  ['VehicleCatalog', 'vehicleCatalog'],
  ['ControllerCatalog', 'controllerCatalog'],
  ['PedestrianCatalog', 'pedestrianCatalog'],
  ['MiscObjectCatalog', 'miscObjectCatalog'],
  ['EnvironmentCatalog', 'environmentCatalog'],
  ['ManeuverCatalog', 'maneuverCatalog'],
  ['TrajectoryCatalog', 'trajectoryCatalog'],
  ['RouteCatalog', 'routeCatalog'],
];

export function parseCatalogLocations(raw: RawXml | undefined): CatalogLocations {
  if (!raw) return {};
  const result: CatalogLocations = {};
  for (const [xmlKey, tsKey] of CATALOG_KEYS) {
    const location = child(raw, xmlKey);
    if (location) {
      result[tsKey] = parseCatalogLocation(location);
    }
  }
  return result;
}

function parseCatalogLocation(raw: RawXml): CatalogLocation {
  const dir = child(raw, 'Directory');
  return {
    directory: strAttr(dir, 'path'),
  };
}
