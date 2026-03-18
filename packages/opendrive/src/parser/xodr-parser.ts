/**
 * OpenDRIVE (.xodr) XML parser.
 * Implements IXodrParser from @osce/shared.
 */
import type { IXodrParser, OpenDriveDocument } from '@osce/shared';
import { createXodrXmlParser, ensureArray } from './xml-helpers.js';
import { parseHeader } from './parse-header.js';
import { parseRoad } from './parse-road.js';
import { parseController } from './parse-controller.js';
import { parseJunction } from './parse-junction.js';

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

    return {
      header: parseHeader(root.header),
      roads: ensureArray(root.road).map(parseRoad),
      controllers: ensureArray(root.controller).map(parseController),
      junctions: ensureArray(root.junction).map(parseJunction),
    };
  }
}
