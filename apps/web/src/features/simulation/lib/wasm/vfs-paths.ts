/**
 * Pure helpers for rewriting OpenSCENARIO file references onto the esmini
 * Emscripten virtual filesystem.
 *
 * esmini resolves a `<CatalogReference catalogName="X">` by loading the file
 * `<catalog-dir>/X.xosc` and matching its internal `<Catalog name="X">`. So each
 * catalog written to the VFS MUST be named after its internal catalog name, not
 * after whatever key the caller happened to use. These helpers centralise that
 * rule and the LogicFile / CatalogLocations path rewriting so the worker stays
 * thin and the logic is unit-testable without a worker/WASM runtime.
 */

/** Virtual-FS locations used by the worker. */
export const VFS = {
  scenarioDir: '/scenarios',
  scenarioFile: '/scenarios/scenario.xosc',
  roadFile: '/scenarios/road.xodr',
  catalogDir: '/catalogs',
} as const;

/**
 * Extract the internal catalog name from a catalog XML string
 * (`<Catalog name="...">`). Falls back to the provided key when absent.
 */
export function catalogNameFromXml(xml: string, fallbackKey: string): string {
  const m = xml.match(/<Catalog\b[^>]*\bname\s*=\s*"([^"]+)"/);
  return m ? m[1] : fallbackKey;
}

/** Compute the VFS path a catalog XML should be written to. */
export function catalogVfsPath(xml: string, fallbackKey: string): string {
  return `${VFS.catalogDir}/${catalogNameFromXml(xml, fallbackKey)}.xosc`;
}

/**
 * Rewrite the single `<LogicFile filepath="...">` reference to point at the
 * road file we write into the VFS. No-op when there is no LogicFile.
 */
export function rewriteLogicFilePath(xosc: string, roadFile = VFS.roadFile): string {
  return xosc.replace(/(<LogicFile\s+filepath\s*=\s*")([^"]*?)(")/, `$1${roadFile}$3`);
}

/**
 * Rewrite every `<XxxCatalog><Directory path="...">` to the VFS catalog
 * directory so esmini scans the files we wrote regardless of the original
 * on-disk layout.
 */
export function rewriteCatalogDirectories(xosc: string, catalogDir = VFS.catalogDir): string {
  return xosc.replace(
    /(<(?:Vehicle|Controller|Pedestrian|MiscObject|Environment|Maneuver|Trajectory|Route)Catalog>\s*<Directory\s+path\s*=\s*")([^"]*?)(")/g,
    `$1${catalogDir}/$3`,
  );
}

export interface PreparedScenario {
  /** The rewritten scenario XML to write to the VFS. */
  scenarioXml: string;
  /** Catalog files to write: VFS path -> XML content. */
  catalogFiles: Array<{ path: string; xml: string }>;
  /** Whether a road file needs to be written. */
  hasRoad: boolean;
}

/**
 * Produce the full set of VFS writes + rewritten scenario for a load request.
 * Pure: performs no IO, so it can be unit-tested directly.
 */
export function prepareScenarioForVfs(
  xoscXml: string,
  xodrData?: string,
  catalogs?: Record<string, string>,
): PreparedScenario {
  let scenarioXml = xoscXml;

  if (xodrData) {
    scenarioXml = rewriteLogicFilePath(scenarioXml);
  }

  const catalogFiles: Array<{ path: string; xml: string }> = [];
  if (catalogs && Object.keys(catalogs).length > 0) {
    for (const [key, xml] of Object.entries(catalogs)) {
      catalogFiles.push({ path: catalogVfsPath(xml, key), xml });
    }
    scenarioXml = rewriteCatalogDirectories(scenarioXml);
  }

  return { scenarioXml, catalogFiles, hasRoad: Boolean(xodrData) };
}
