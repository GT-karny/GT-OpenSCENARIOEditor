/**
 * Types for MCP (Model Context Protocol) server integration.
 */

export interface McpToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface McpScenarioState {
  documentId: string;
  entityCount: number;
  storyCount: number;
  hasRoadNetwork: boolean;
  validationErrors: number;
  validationWarnings: number;
}
