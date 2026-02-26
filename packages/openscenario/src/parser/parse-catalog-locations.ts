import type { CatalogLocations, CatalogLocation } from '@osce/shared';
import { strAttr } from '../utils/xml-helpers.js';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseCatalogLocations(raw: any): CatalogLocations {
  if (!raw) return {};
  const result: CatalogLocations = {};
  for (const [xmlKey, tsKey] of CATALOG_KEYS) {
    if (raw[xmlKey]) {
      result[tsKey] = parseCatalogLocation(raw[xmlKey]);
    }
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCatalogLocation(raw: any): CatalogLocation {
  const dir = raw?.Directory;
  return {
    directory: strAttr(dir, 'path'),
  };
}
