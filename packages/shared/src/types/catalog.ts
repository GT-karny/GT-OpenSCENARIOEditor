/**
 * Catalog types for OpenSCENARIO.
 * A catalog is a standalone .xosc file containing reusable, named elements.
 */

import type { FileHeader } from './scenario.js';
import type {
  VehicleDefinition,
  PedestrianDefinition,
  MiscObjectDefinition,
} from './entities.js';

/** The 8 catalog types defined by OpenSCENARIO v1.2 */
export type CatalogType =
  | 'vehicle'
  | 'controller'
  | 'pedestrian'
  | 'miscObject'
  | 'environment'
  | 'maneuver'
  | 'trajectory'
  | 'route';

/** A parsed catalog file (standalone .xosc with <Catalog> root element) */
export interface CatalogDocument {
  /** Internal UUID */
  id: string;
  /** File metadata from <FileHeader> */
  fileHeader: FileHeader;
  /** The catalog name attribute from <Catalog name="..."> */
  catalogName: string;
  /** The catalog type, inferred from the element types within */
  catalogType: CatalogType;
  /** Entries within this catalog */
  entries: CatalogEntry[];
  /** Source file path (for display and re-saving) */
  _sourcePath?: string;
  /** Parameter bindings captured during parsing (keyed by entry name → field path → $ref) */
  _parameterBindings?: Record<string, Record<string, string>>;
}

/**
 * A single entry in a catalog.
 * Each entry wraps one of the known definition types.
 * Phase 1 supports Vehicle, Pedestrian, MiscObject.
 */
export type CatalogEntry =
  | VehicleCatalogEntry
  | PedestrianCatalogEntry
  | MiscObjectCatalogEntry;

export interface VehicleCatalogEntry {
  catalogType: 'vehicle';
  definition: VehicleDefinition;
}

export interface PedestrianCatalogEntry {
  catalogType: 'pedestrian';
  definition: PedestrianDefinition;
}

export interface MiscObjectCatalogEntry {
  catalogType: 'miscObject';
  definition: MiscObjectDefinition;
}
