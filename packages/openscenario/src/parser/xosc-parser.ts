import type { IXoscParser, ScenarioDocument } from '@osce/shared';
import { createXoscXmlParser } from './fxp-config.js';
import { parseFileHeader } from './parse-file-header.js';
import { parseParameterDeclarations, parseVariableDeclarations } from './parse-parameters.js';
import { parseCatalogLocations } from './parse-catalog-locations.js';
import { parseRoadNetwork } from './parse-road-network.js';
import { parseEntities } from './parse-entities.js';
import { parseStoryboard } from './parse-storyboard.js';
import { generateId } from '../utils/uuid.js';
import { createDefaultEditorMetadata } from '../utils/defaults.js';
import type { XMLParser } from 'fast-xml-parser';

export class XoscParser implements IXoscParser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = createXoscXmlParser();
  }

  parse(xml: string): ScenarioDocument {
    const raw = this.xmlParser.parse(xml);
    const root = raw?.OpenSCENARIO;

    if (!root) {
      throw new Error('Invalid OpenSCENARIO XML: missing <OpenSCENARIO> root element');
    }

    return {
      id: generateId(),
      fileHeader: parseFileHeader(root.FileHeader),
      parameterDeclarations: parseParameterDeclarations(root.ParameterDeclarations),
      variableDeclarations: parseVariableDeclarations(root.VariableDeclarations),
      catalogLocations: parseCatalogLocations(root.CatalogLocations),
      roadNetwork: parseRoadNetwork(root.RoadNetwork),
      entities: parseEntities(root.Entities),
      storyboard: parseStoryboard(root.Storyboard),
      _editor: createDefaultEditorMetadata(),
    };
  }
}
