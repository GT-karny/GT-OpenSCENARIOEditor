/**
 * OpenDRIVE (.xodr) XML serializer.
 * Converts an OpenDriveDocument back to valid OpenDRIVE XML.
 */
import type { IXodrSerializer, OdrSerializeOptions, OpenDriveDocument } from '@osce/shared';
import { createXodrXmlBuilder } from './fxp-builder-config.js';
import { buildHeader } from './build-header.js';
import { buildRoad } from './build-road.js';
import { buildJunction, buildJunctionGroup } from './build-junction.js';
import { buildController } from './build-controller.js';
import { buildStation } from './build-railroad.js';
import { willResolveToOdr19 } from '../version/detect-odr19.js';

export class XodrSerializer implements IXodrSerializer {
  serialize(doc: OpenDriveDocument): string {
    return this.buildXml(doc, false);
  }

  serializeFormatted(doc: OpenDriveDocument, options?: OdrSerializeOptions): string {
    return this.buildXml(doc, true, options);
  }

  private buildXml(
    doc: OpenDriveDocument,
    formatted: boolean,
    options?: OdrSerializeOptions,
  ): string {
    const builder = createXodrXmlBuilder(formatted);

    // Version resolution: bump the emitted @revMinor to 9 when the document uses
    // 1.9 constructs under an earlier declared minor. Build a header copy so the
    // store document (and thus idempotence of the default path) is never mutated.
    const header =
      options?.resolveVersion && willResolveToOdr19(doc)
        ? { ...doc.header, revMinor: 9 }
        : doc.header;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xmlObj: any = {
      OpenDRIVE: {
        header: buildHeader(header),
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

    if (doc.stations && doc.stations.length > 0) {
      xmlObj.OpenDRIVE.station = doc.stations.map(buildStation);
    }

    if (doc.junctionGroups && doc.junctionGroups.length > 0) {
      xmlObj.OpenDRIVE.junctionGroup = doc.junctionGroups.map(buildJunctionGroup);
    }

    const xmlDecl = '<?xml version="1.0" encoding="UTF-8"?>\n';
    return xmlDecl + builder.build(xmlObj);
  }
}
