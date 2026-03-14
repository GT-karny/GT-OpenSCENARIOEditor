/**
 * Parser for the .osce.json editor file format.
 */

import type { OpenDriveDocument } from '@osce/shared';
import type { EditorMetadata } from '../store/editor-metadata-types.js';
import { createDefaultEditorMetadata } from '../store/editor-metadata-types.js';
import type { OsceEditorFile } from '../serializer/osce-json-serializer.js';

export interface OsceParseResult {
  document: OpenDriveDocument;
  metadata: EditorMetadata;
}

/**
 * Parse a .osce.json string into an OpenDRIVE document and editor metadata.
 *
 * Performs basic validation and provides defaults for missing fields
 * to maintain forward-compatibility across schema versions.
 */
export function parseOsceJson(json: string): OsceParseResult {
  const parsed: OsceEditorFile = JSON.parse(json);

  if (parsed.format !== 'osce-editor') {
    throw new Error(`Invalid .osce.json format: expected 'osce-editor', got '${parsed.format}'`);
  }

  if (!parsed.openDriveDocument) {
    throw new Error('Missing openDriveDocument in .osce.json file');
  }

  // Apply defaults for forward-compatibility
  const defaults = createDefaultEditorMetadata();
  const metadata: EditorMetadata = {
    version: parsed.editorMetadata?.version ?? defaults.version,
    virtualRoads: parsed.editorMetadata?.virtualRoads ?? [],
    junctionMetadata: parsed.editorMetadata?.junctionMetadata ?? [],
    settings: {
      ...defaults.settings,
      ...parsed.editorMetadata?.settings,
      laneRouting: {
        ...defaults.settings.laneRouting,
        ...parsed.editorMetadata?.settings?.laneRouting,
      },
    },
  };

  return {
    document: parsed.openDriveDocument,
    metadata,
  };
}
