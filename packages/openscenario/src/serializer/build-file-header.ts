import type { FileHeader } from '@osce/shared';
import { buildAttrs } from '../utils/xml-helpers.js';

export function buildFileHeader(fh: FileHeader): Record<string, string> {
  return buildAttrs({
    revMajor: fh.revMajor,
    revMinor: fh.revMinor,
    date: fh.date,
    description: fh.description,
    author: fh.author,
  });
}
