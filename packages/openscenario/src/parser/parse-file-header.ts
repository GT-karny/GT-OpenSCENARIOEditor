import type { FileHeader } from '@osce/shared';
import type { RawXml } from '../utils/xml-helpers.js';
import { numAttr, strAttr } from '../utils/xml-helpers.js';

export function parseFileHeader(raw: RawXml | undefined): FileHeader {
  if (!raw) {
    return { revMajor: 1, revMinor: 3, date: '', description: '', author: '' };
  }
  return {
    revMajor: numAttr(raw, 'revMajor', 1),
    revMinor: numAttr(raw, 'revMinor', 3),
    date: strAttr(raw, 'date'),
    description: strAttr(raw, 'description'),
    author: strAttr(raw, 'author'),
  };
}
