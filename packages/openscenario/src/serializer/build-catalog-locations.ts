import type { CatalogLocations } from '@osce/shared';
import { buildAttrs } from '../utils/xml-helpers.js';

const CATALOG_KEYS: Array<[keyof CatalogLocations, string]> = [
  ['vehicleCatalog', 'VehicleCatalog'],
  ['controllerCatalog', 'ControllerCatalog'],
  ['pedestrianCatalog', 'PedestrianCatalog'],
  ['miscObjectCatalog', 'MiscObjectCatalog'],
  ['environmentCatalog', 'EnvironmentCatalog'],
  ['maneuverCatalog', 'ManeuverCatalog'],
  ['trajectoryCatalog', 'TrajectoryCatalog'],
  ['routeCatalog', 'RouteCatalog'],
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildCatalogLocations(cl: CatalogLocations): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};
  let hasAny = false;
  for (const [tsKey, xmlKey] of CATALOG_KEYS) {
    const loc = cl[tsKey];
    if (loc) {
      result[xmlKey] = { Directory: buildAttrs({ path: loc.directory }) };
      hasAny = true;
    }
  }
  return hasAny ? result : '';
}
