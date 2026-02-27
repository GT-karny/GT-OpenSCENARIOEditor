/**
 * Tool registry: collects all tool definitions and provides lookup.
 */

import type { McpToolResult } from '@osce/shared';
import type { createScenarioStore } from '@osce/scenario-engine';
import { scenarioTools } from './scenario-tools.js';
import { entityTools } from './entity-tools.js';
import { initTools } from './init-tools.js';
import { storyboardTools } from './storyboard-tools.js';
import { actionTools } from './action-tools.js';
import { triggerTools } from './trigger-tools.js';
import { templateTools } from './template-tools.js';
import { undoRedoTools } from './undo-redo-tools.js';

export type ScenarioStoreInstance = ReturnType<typeof createScenarioStore>;

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>, store: ScenarioStoreInstance) => McpToolResult;
}

let _allTools: ToolDefinition[] | null = null;

export function getAllTools(): ToolDefinition[] {
  if (!_allTools) {
    _allTools = [
      ...scenarioTools,
      ...entityTools,
      ...initTools,
      ...storyboardTools,
      ...actionTools,
      ...triggerTools,
      ...templateTools,
      ...undoRedoTools,
    ];
  }
  return _allTools;
}

export function findTool(name: string): ToolDefinition | undefined {
  return getAllTools().find((t) => t.name === name);
}
