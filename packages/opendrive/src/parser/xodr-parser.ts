/**
 * OpenDRIVE (.xodr) XML parser.
 * Implements IXodrParser from @osce/shared.
 */
import type { IXodrParser, OpenDriveDocument } from '@osce/shared';
import { createXodrXmlParser, ensureArray } from './xml-helpers.js';
import { parseHeader } from './parse-header.js';
import { parseRoad } from './parse-road.js';
import { parseController } from './parse-controller.js';
import { parseJunction, parseJunctionGroups } from './parse-junction.js';
import { parseStations } from './parse-railroad.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export class XodrParser implements IXodrParser {
  parse(xml: string): OpenDriveDocument {
    const parser = createXodrXmlParser();
    const parsed = parser.parse(xml);
    const root: Raw = parsed.OpenDRIVE ?? parsed['OpenDRIVE'];

    if (!root) {
      throw new Error('Invalid OpenDRIVE XML: missing <OpenDRIVE> root element');
    }

    const doc: OpenDriveDocument = {
      header: parseHeader(root.header),
      roads: ensureArray(root.road).map(parseRoad),
      controllers: ensureArray(root.controller).map(parseController),
      junctions: ensureArray(root.junction).map(parseJunction),
    };

    // Top-level optional elements
    const stations = parseStations(root.station);
    if (stations.length > 0) doc.stations = stations;

    const junctionGroups = parseJunctionGroups(root.junctionGroup);
    if (junctionGroups.length > 0) doc.junctionGroups = junctionGroups;

    return doc;
  }
}
