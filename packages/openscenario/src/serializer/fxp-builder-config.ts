import { XMLBuilder } from 'fast-xml-parser';

export function createXoscXmlBuilder(formatted: boolean): XMLBuilder {
  return new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: formatted,
    indentBy: '  ',
    suppressBooleanAttributes: false,
    suppressEmptyNode: false,
    processEntities: false,
  });
}
