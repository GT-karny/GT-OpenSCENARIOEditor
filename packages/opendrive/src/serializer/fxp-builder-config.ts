/**
 * fast-xml-parser XMLBuilder configuration for OpenDRIVE (.xodr) files.
 */
import { XMLBuilder } from 'fast-xml-parser';

export function createXodrXmlBuilder(formatted: boolean): XMLBuilder {
  return new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: formatted,
    indentBy: '  ',
    suppressBooleanAttributes: false,
    suppressEmptyNode: false,
    processEntities: true,
    cdataPropName: '__cdata',
  });
}
