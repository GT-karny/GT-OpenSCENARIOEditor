import type { IXoscParser, ScenarioDocument } from '@osce/shared';
import { createXoscXmlParser } from './fxp-config.js';
import { parseFileHeader } from './parse-file-header.js';
import { parseParameterDeclarations, parseVariableDeclarations } from './parse-parameters.js';
import { parseCatalogLocations } from './parse-catalog-locations.js';
import { parseRoadNetwork } from './parse-road-network.js';
import { parseEntities } from './parse-entities.js';
import { parseStoryboard } from './parse-storyboard.js';
import { generateId } from '@osce/shared';
import { createDefaultEditorMetadata } from '../utils/defaults.js';
import {
  startBindingCollection,
  finishBindingCollection,
  child,
  has,
} from '../utils/xml-helpers.js';
import type { RawXml } from '../utils/xml-helpers.js';
import { XoscRootMismatchError } from './xosc-root-error.js';
import type { XMLParser } from 'fast-xml-parser';

export class XoscParser implements IXoscParser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = createXoscXmlParser();
  }

  parse(xml: string): ScenarioDocument {
    const raw = this.xmlParser.parse(xml) as RawXml;
    const root = child(raw, 'OpenSCENARIO');

    if (!root) {
      throw new Error('Invalid OpenSCENARIO XML: missing <OpenSCENARIO> root element');
    }

    // The XSD OpenScenarioCategory is a choice: a scenario, a catalog, or a
    // parameter value distribution. Detect the two non-scenario roots up front
    // so they fail loudly instead of parsing to a silently-empty scenario.
    if (has(root, 'ParameterValueDistribution')) {
      throw new XoscRootMismatchError('parameterValueDistribution');
    }
    if (has(root, 'Catalog')) {
      throw new XoscRootMismatchError('catalog');
    }

    startBindingCollection();

    const doc: ScenarioDocument = {
      id: generateId(),
      fileHeader: parseFileHeader(child(root, 'FileHeader')),
      parameterDeclarations: parseParameterDeclarations(child(root, 'ParameterDeclarations')),
      variableDeclarations: parseVariableDeclarations(child(root, 'VariableDeclarations')),
      catalogLocations: parseCatalogLocations(child(root, 'CatalogLocations')),
      roadNetwork: parseRoadNetwork(child(root, 'RoadNetwork')),
      entities: parseEntities(child(root, 'Entities')),
      storyboard: parseStoryboard(child(root, 'Storyboard')),
      _editor: createDefaultEditorMetadata(),
    };

    doc._editor.parameterBindings = finishBindingCollection();

    return doc;
  }
}
