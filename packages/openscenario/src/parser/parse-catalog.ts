import type { CatalogDocument, CatalogEntry, CatalogType } from '@osce/shared';
import { XMLParser } from 'fast-xml-parser';
import { parseFileHeader } from './parse-file-header.js';
import {
  parseVehicleDefinition,
  parsePedestrianDefinition,
  parseMiscObjectDefinition,
  parseControllerDefinition,
} from './parse-entities.js';
import { parseEnvironment, parseTrajectory } from './parse-actions.js';
import { parseManeuver } from './parse-storyboard.js';
import { parseRoute } from './parse-positions.js';
import type { RawXml } from '../utils/xml-helpers.js';
import { generateId } from '@osce/shared';
import { strAttr, startBindingCollection, setBindingElementId, finishBindingCollection, child, children } from '../utils/xml-helpers.js';

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
  'RelativeLaneRange',
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

export function parseCatalogXml(xml: string): CatalogDocument {
  const parser = createCatalogXmlParser();
  const raw = parser.parse(xml) as RawXml;
  const root = child(raw, 'OpenSCENARIO');
  const catalog = child(root, 'Catalog');

  if (!catalog) {
    throw new Error('Invalid catalog XML: missing <Catalog> element under <OpenSCENARIO>');
  }

  const catalogName = strAttr(catalog, 'name');

  startBindingCollection();
  const entries = parseCatalogEntries(catalog);
  const parameterBindings = finishBindingCollection();

  const catalogType = inferCatalogType(entries);

  return {
    id: generateId(),
    fileHeader: parseFileHeader(child(root, 'FileHeader')),
    catalogName,
    catalogType,
    entries,
    _parameterBindings: Object.keys(parameterBindings).length > 0 ? parameterBindings : undefined,
  };
}

function parseCatalogEntries(catalog: RawXml): CatalogEntry[] {
  const entries: CatalogEntry[] = [];

  for (const raw of children(catalog, 'Vehicle')) {
    setBindingElementId(strAttr(raw, 'name'));
    entries.push({ catalogType: 'vehicle', definition: parseVehicleDefinition(raw) });
  }
  for (const raw of children(catalog, 'Pedestrian')) {
    setBindingElementId(strAttr(raw, 'name'));
    entries.push({ catalogType: 'pedestrian', definition: parsePedestrianDefinition(raw) });
  }
  for (const raw of children(catalog, 'MiscObject')) {
    setBindingElementId(strAttr(raw, 'name'));
    entries.push({ catalogType: 'miscObject', definition: parseMiscObjectDefinition(raw) });
  }
  for (const raw of children(catalog, 'Controller')) {
    setBindingElementId(strAttr(raw, 'name'));
    entries.push({ catalogType: 'controller', definition: parseControllerDefinition(raw) });
  }
  for (const raw of children(catalog, 'Environment')) {
    setBindingElementId(strAttr(raw, 'name'));
    entries.push({ catalogType: 'environment', definition: parseEnvironment(raw) });
  }
  for (const raw of children(catalog, 'Maneuver')) {
    setBindingElementId(strAttr(raw, 'name'));
    entries.push({ catalogType: 'maneuver', definition: parseManeuver(raw) });
  }
  for (const raw of children(catalog, 'Trajectory')) {
    setBindingElementId(strAttr(raw, 'name'));
    entries.push({ catalogType: 'trajectory', definition: parseTrajectory(raw) });
  }
  for (const raw of children(catalog, 'Route')) {
    setBindingElementId(strAttr(raw, 'name'));
    entries.push({ catalogType: 'route', definition: parseRoute(raw) });
  }

  return entries;
}

function inferCatalogType(entries: CatalogEntry[]): CatalogType {
  if (entries.length === 0) return 'vehicle';
  // All entries should be the same type in a well-formed catalog
  return entries[0].catalogType;
}
