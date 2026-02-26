import type { EditorMetadata } from '@osce/shared';

export function createDefaultEditorMetadata(): EditorMetadata {
  return {
    formatVersion: '1.0.0',
    lastModified: new Date().toISOString(),
    appliedTemplates: [],
    nodePositions: {},
    nodeCollapsed: {},
  };
}
