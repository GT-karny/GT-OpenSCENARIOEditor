import type { CatalogDocument, CatalogEntry, CatalogType } from '@osce/shared';
import { XMLParser } from 'fast-xml-parser';
import { parseFileHeader } from './parse-file-header.js';
import {
  parseVehicleDefinition,
  parsePedestrianDefinition,
  parseMiscObjectDefinition,
} from './parse-entities.js';
import { generateId } from '../utils/uuid.js';
import { strAttr } from '../utils/xml-helpers.js';

/**
 * Elements that can appear multiple times inside a <Catalog>.
 * We need a separate parser config because the scenario parser
 * does not treat Vehicle/Pedestrian/MiscObject as arrays.
 */
const CATALOG_ARRAY_ELEMENTS = new Set([
  'Vehicle',
  'Controller',
  'Pedestrian',
  'MiscObject',
  'Environment',
  'Maneuver',
  'Trajectory',
  'Route',
  'ParameterDeclaration',
  'Property',
  'AdditionalAxle',
  'Waypoint',
  'Vertex',
  'SpeedProfileEntry',
  'Knot',
  'ControlPoint',
  'Event',
  'Action',
  'ConditionGroup',
  'Condition',
  'EntityRef',
  'LaneRange',
]);

function createCatalogXmlParser(): XMLParser {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name: string, _jpath: string, _isLeafNode: boolean, isAttribute: boolean) => {
      if (isAttribute) return false;
      return CATALOG_ARRAY_ELEMENTS.has(name);
    },
    parseTagValue: false,
    parseAttributeValue: false,
    preserveOrder: false,
    allowBooleanAttributes: true,
    trimValues: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ensureArray(val: any): any[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

export function parseCatalogXml(xml: string): CatalogDocument {
  const parser = createCatalogXmlParser();
  const raw = parser.parse(xml);
  const root = raw?.OpenSCENARIO;

  if (!root?.Catalog) {
    throw new Error('Invalid catalog XML: missing <Catalog> element under <OpenSCENARIO>');
  }

  const catalog = root.Catalog;
  const catalogName = strAttr(catalog, 'name');
  const entries = parseCatalogEntries(catalog);
  const catalogType = inferCatalogType(entries, catalog);

  return {
    id: generateId(),
    fileHeader: parseFileHeader(root.FileHeader),
    catalogName,
    catalogType,
    entries,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCatalogEntries(catalog: any): CatalogEntry[] {
  const entries: CatalogEntry[] = [];

  for (const raw of ensureArray(catalog.Vehicle)) {
    entries.push({ catalogType: 'vehicle', definition: parseVehicleDefinition(raw) });
  }
  for (const raw of ensureArray(catalog.Pedestrian)) {
    entries.push({ catalogType: 'pedestrian', definition: parsePedestrianDefinition(raw) });
  }
  for (const raw of ensureArray(catalog.MiscObject)) {
    entries.push({ catalogType: 'miscObject', definition: parseMiscObjectDefinition(raw) });
  }

  return entries;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function inferCatalogType(entries: CatalogEntry[], _catalog: any): CatalogType {
  if (entries.length === 0) return 'vehicle';
  // All entries should be the same type in a well-formed catalog
  return entries[0].catalogType;
}
