/**
 * Singleton instance of the EditorMetadataStore for the web app.
 *
 * Used alongside the OpenDriveStore to persist editor-specific metadata
 * (virtual roads, junction metadata, settings) that are NOT part of
 * the OpenDRIVE standard.
 */

import { createEditorMetadataStore } from '@osce/opendrive-engine';

export const editorMetadataStoreApi = createEditorMetadataStore();
