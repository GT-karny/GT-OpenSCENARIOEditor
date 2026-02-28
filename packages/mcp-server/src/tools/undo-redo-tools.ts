/**
 * Undo/Redo tools.
 */

import type { McpToolResult } from '@osce/shared';
import { successResult, errorResult } from '../utils/response-helpers.js';
import type { ToolDefinition } from './tool-registry.js';

export const undoRedoTools: ToolDefinition[] = [
  {
    name: 'undo',
    description: 'Undo the last operation. Returns the current state after undoing.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    handler(_args, store): McpToolResult {
      try {
        const s = store.getState();
        if (!s.canUndo()) {
          return errorResult('Nothing to undo. The undo history is empty.');
        }
        s.undo();
        const after = store.getState();
        return successResult({
          canUndo: after.canUndo(),
          canRedo: after.canRedo(),
          entityCount: after.getScenario().entities.length,
          message: 'Undo successful.',
        });
      } catch (e) {
        return errorResult(`Failed to undo: ${(e as Error).message}`);
      }
    },
  },

  {
    name: 'redo',
    description: 'Redo the last undone operation. Returns the current state after redoing.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    handler(_args, store): McpToolResult {
      try {
        const s = store.getState();
        if (!s.canRedo()) {
          return errorResult('Nothing to redo. The redo history is empty.');
        }
        s.redo();
        const after = store.getState();
        return successResult({
          canUndo: after.canUndo(),
          canRedo: after.canRedo(),
          entityCount: after.getScenario().entities.length,
          message: 'Redo successful.',
        });
      } catch (e) {
        return errorResult(`Failed to redo: ${(e as Error).message}`);
      }
    },
  },
];
