/**
 * @osce/mcp-server — MCP server for OpenSCENARIO Editor.
 *
 * Provides AI agents with tools, resources, and prompts for
 * creating and editing OpenSCENARIO scenarios via MCP protocol.
 */

export { createMcpServer } from './server/mcp-server.js';
export type { McpToolResult } from '@osce/shared';
export type { ToolDefinition } from './tools/tool-registry.js';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server/mcp-server.js';

/**
 * Start the MCP server with stdio transport.
 */
export async function startServer(): Promise<void> {
  const { server } = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Auto-start when run directly
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  startServer().catch(console.error);
}
