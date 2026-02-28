/**
 * Helper functions for creating MCP tool responses.
 */

import type { McpToolResult } from '@osce/shared';

export function successResult(data: unknown): McpToolResult {
  return { success: true, data };
}

export function errorResult(message: string): McpToolResult {
  return { success: false, error: message };
}

/**
 * Convert McpToolResult to MCP SDK content format for tool call responses.
 */
export function toMcpContent(result: McpToolResult): {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
} {
  if (result.success) {
    return {
      content: [
        {
          type: 'text',
          text: typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2),
        },
      ],
    };
  }
  return {
    content: [{ type: 'text', text: result.error ?? 'Unknown error' }],
    isError: true,
  };
}
