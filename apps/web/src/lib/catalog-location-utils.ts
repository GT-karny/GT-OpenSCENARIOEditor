import type { CatalogLocations, ProjectFileEntry } from '@osce/shared';

/** Mapping from project catalog subdirectory name to CatalogLocations key and XML element name */
export const CATALOG_DIR_MAP: ReadonlyArray<{
  dir: string;
  key: keyof CatalogLocations;
  xml: string;
}> = [
  { dir: 'Vehicles', key: 'vehicleCatalog', xml: 'VehicleCatalog' },
  { dir: 'Controllers', key: 'controllerCatalog', xml: 'ControllerCatalog' },
  { dir: 'Pedestrians', key: 'pedestrianCatalog', xml: 'PedestrianCatalog' },
  { dir: 'MiscObjects', key: 'miscObjectCatalog', xml: 'MiscObjectCatalog' },
  { dir: 'Environments', key: 'environmentCatalog', xml: 'EnvironmentCatalog' },
  { dir: 'Maneuvers', key: 'maneuverCatalog', xml: 'ManeuverCatalog' },
  { dir: 'Routes', key: 'routeCatalog', xml: 'RouteCatalog' },
];

/**
 * Compute the relative path prefix from a scenario file location to the project root.
 * e.g. "xosc/scenario.xosc" → "../", "xosc/sub/test.xosc" → "../../", root → ""
 */
function computeUpPrefix(scenarioRelativePath: string): string {
  const scenarioDir = scenarioRelativePath.includes('/')
    ? scenarioRelativePath.substring(0, scenarioRelativePath.lastIndexOf('/'))
    : '';
  const depth = scenarioDir ? scenarioDir.split('/').length : 0;
  return depth > 0 ? '../'.repeat(depth) : '';
}

/**
 * Build CatalogLocations from project files for a scenario at the given path.
 * Only includes catalog types whose directories contain at least one .xosc file.
 */
export function buildCatalogLocationsFromProject(
  files: ProjectFileEntry[],
  scenarioRelativePath: string,
): CatalogLocations {
  const upPrefix = computeUpPrefix(scenarioRelativePath);
  const result: CatalogLocations = {};

  for (const { dir, key } of CATALOG_DIR_MAP) {
    const catalogDirPrefix = `catalogs/${dir}/`;
    const hasFiles = files.some(
      (f) => f.type === 'xosc' && f.relativePath.startsWith(catalogDirPrefix),
    );
    if (hasFiles) {
      result[key] = { directory: `${upPrefix}catalogs/${dir}` };
    }
  }

  return result;
}

/**
 * Build CatalogLocations XML string for embedding in an xosc template.
 * Returns `<CatalogLocations/>` if no catalogs are found.
 */
export function buildCatalogLocationsXml(
  files: ProjectFileEntry[],
  scenarioRelativePath: string,
): string {
  const upPrefix = computeUpPrefix(scenarioRelativePath);
  const entries: string[] = [];

  for (const { dir, xml } of CATALOG_DIR_MAP) {
    const catalogDirPrefix = `catalogs/${dir}/`;
    const hasFiles = files.some(
      (f) => f.type === 'xosc' && f.relativePath.startsWith(catalogDirPrefix),
    );
    if (hasFiles) {
      entries.push(
        `    <${xml}>\n      <Directory path="${upPrefix}catalogs/${dir}"/>\n    </${xml}>`,
      );
    }
  }

  if (entries.length === 0) {
    return '<CatalogLocations/>';
  }

  return `<CatalogLocations>\n${entries.join('\n')}\n  </CatalogLocations>`;
}
