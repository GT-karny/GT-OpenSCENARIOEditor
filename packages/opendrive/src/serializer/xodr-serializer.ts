/**
 * OpenDRIVE (.xodr) XML serializer.
 * Converts an OpenDriveDocument back to valid OpenDRIVE XML.
 */
import type { IXodrSerializer, OpenDriveDocument } from '@osce/shared';
import { createXodrXmlBuilder } from './fxp-builder-config.js';
import { buildHeader } from './build-header.js';
import { buildRoad } from './build-road.js';
import { buildJunction } from './build-junction.js';
import { buildController } from './build-controller.js';

export class XodrSerializer implements IXodrSerializer {
  serialize(doc: OpenDriveDocument): string {
    return this.buildXml(doc, false);
  }

  serializeFormatted(doc: OpenDriveDocument): string {
    return this.buildXml(doc, true);
  }

  private buildXml(doc: OpenDriveDocument, formatted: boolean): string {
    const builder = createXodrXmlBuilder(formatted);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xmlObj: any = {
      OpenDRIVE: {
        header: buildHeader(doc.header),
      },
    };

    if (doc.roads.length > 0) {
      xmlObj.OpenDRIVE.road = doc.roads.map(buildRoad);
    }

    if (doc.controllers.length > 0) {
      xmlObj.OpenDRIVE.controller = doc.controllers.map(buildController);
    }

    if (doc.junctions.length > 0) {
      xmlObj.OpenDRIVE.junction = doc.junctions.map(buildJunction);
    }

    const xmlDecl = '<?xml version="1.0" encoding="UTF-8"?>\n';
    return xmlDecl + builder.build(xmlObj);
  }
}
