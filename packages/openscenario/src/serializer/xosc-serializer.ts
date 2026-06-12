import type { IXoscSerializer, ScenarioDocument } from '@osce/shared';
import { createXoscXmlBuilder } from './fxp-builder-config.js';
import { buildFileHeader } from './build-file-header.js';
import { buildParameterDeclarations, buildVariableDeclarations } from './build-parameters.js';
import { buildCatalogLocations } from './build-catalog-locations.js';
import { buildRoadNetwork } from './build-road-network.js';
import { buildEntities } from './build-entities.js';
import { buildStoryboard } from './build-storyboard.js';

export class XoscSerializer implements IXoscSerializer {
  serialize(doc: ScenarioDocument): string {
    return this.buildXml(doc, false);
  }

  serializeFormatted(doc: ScenarioDocument): string {
    return this.buildXml(doc, true);
  }

  private buildXml(doc: ScenarioDocument, formatted: boolean): string {
    const builder = createXoscXmlBuilder(formatted);

    // Keys are inserted in XSD ScenarioDefinition sequence order so that
    // fast-xml-parser emits elements in spec order:
    // ParameterDeclarations?, VariableDeclarations?, CatalogLocations, RoadNetwork, Entities, Storyboard.
    const variableDecls = buildVariableDeclarations(doc.variableDeclarations);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xmlObj: any = {
      OpenSCENARIO: {
        '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@_xsi:noNamespaceSchemaLocation': 'OpenSCENARIO.xsd',
        FileHeader: buildFileHeader(doc.fileHeader),
        ParameterDeclarations: buildParameterDeclarations(doc.parameterDeclarations),
        ...(variableDecls ? { VariableDeclarations: variableDecls } : {}),
        CatalogLocations: buildCatalogLocations(doc.catalogLocations),
        RoadNetwork: buildRoadNetwork(doc.roadNetwork),
        Entities: buildEntities(doc.entities),
        Storyboard: buildStoryboard(doc.storyboard, doc._editor.parameterBindings),
      },
    };

    const xmlDecl = '<?xml version="1.0" encoding="UTF-8"?>\n';
    return xmlDecl + builder.build(xmlObj);
  }
}
