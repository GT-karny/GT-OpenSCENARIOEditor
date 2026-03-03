import type { CatalogDocument } from '@osce/shared';
import { createXoscXmlBuilder } from './fxp-builder-config.js';
import { buildFileHeader } from './build-file-header.js';
import { buildVehicle, buildPedestrian, buildMiscObject } from './build-entities.js';
import { buildAttrs } from '../utils/xml-helpers.js';

export function serializeCatalog(doc: CatalogDocument, formatted = true): string {
  const builder = createXoscXmlBuilder(formatted);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catalogContent: any = {
    ...buildAttrs({ name: doc.catalogName }),
  };

  // Group entries by type
  const vehicles = doc.entries.filter((e) => e.catalogType === 'vehicle');
  const pedestrians = doc.entries.filter((e) => e.catalogType === 'pedestrian');
  const miscObjects = doc.entries.filter((e) => e.catalogType === 'miscObject');

  if (vehicles.length > 0) {
    const pb = doc._parameterBindings;
    catalogContent.Vehicle = vehicles.map((e) =>
      buildVehicle(e.definition, pb?.[e.definition.name]),
    );
  }
  if (pedestrians.length > 0) {
    catalogContent.Pedestrian = pedestrians.map((e) => buildPedestrian(e.definition));
  }
  if (miscObjects.length > 0) {
    catalogContent.MiscObject = miscObjects.map((e) => buildMiscObject(e.definition));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const xmlObj: any = {
    OpenSCENARIO: {
      FileHeader: buildFileHeader(doc.fileHeader),
      Catalog: catalogContent,
    },
  };

  const xmlDecl = '<?xml version="1.0" encoding="UTF-8"?>\n';
  return xmlDecl + builder.build(xmlObj);
}
