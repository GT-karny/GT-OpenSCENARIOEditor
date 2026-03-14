/**
 * Serializer for the .osce.json editor file format.
 *
 * This format contains both the standard OpenDRIVE document data
 * and editor-specific metadata (virtual roads, junction metadata, settings).
 */

import type { OpenDriveDocument } from '@osce/shared';
import type { EditorMetadata } from '../store/editor-metadata-types.js';

/**
 * The top-level structure of an .osce.json file.
 */
export interface OsceEditorFile {
  /** Format identifier. Always 'osce-editor'. */
  format: 'osce-editor';
  /** Schema version of this file. */
  version: string;
  /** Standard OpenDRIVE document data (xodr-compatible). */
  openDriveDocument: OpenDriveDocument;
  /** Editor-specific metadata. */
  editorMetadata: EditorMetadata;
}

/**
 * Serialize an editor state to a .osce.json string.
 */
export function serializeOsceJson(
  document: OpenDriveDocument,
  metadata: EditorMetadata,
): string {
  const file: OsceEditorFile = {
    format: 'osce-editor',
    version: metadata.version,
    openDriveDocument: document,
    editorMetadata: metadata,
  };
  return JSON.stringify(file, null, 2);
}

/**
 * Check if a string is a valid .osce.json file.
 */
export function isOsceJsonFormat(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    return parsed?.format === 'osce-editor';
  } catch {
    return false;
  }
}
