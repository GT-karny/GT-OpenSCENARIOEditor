/**
 * MCP Server instance: creates and configures the Server with all tools, resources, and prompts.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createScenarioStore } from '@osce/scenario-engine';
import { SERVER_NAME, SERVER_VERSION } from './server-config.js';
import { getAllTools, findTool } from '../tools/tool-registry.js';
import { getAllResources, findResource } from '../resources/resource-registry.js';
import { promptDefinitions, findPrompt } from '../prompts/prompt-registry.js';
import { toMcpContent } from '../utils/response-helpers.js';

export function createMcpServer() {
  const store = createScenarioStore();

  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  // --- Tools ---
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = getAllTools().map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = findTool(name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: "${name}". Use tools/list to see available tools.` }],
        isError: true,
      };
    }
    const result = tool.handler(args ?? {}, store);
    return toMcpContent(result);
  });

  // --- Resources ---
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = getAllResources().map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
    }));
    return { resources };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const resource = findResource(uri);
    if (!resource) {
      throw new Error(`Unknown resource URI: "${uri}". Use resources/list to see available resources.`);
    }
    const text = resource.read(store);
    return {
      contents: [
        {
          uri: resource.uri,
          mimeType: resource.mimeType,
          text,
        },
      ],
    };
  });

  // --- Prompts ---
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    const prompts = promptDefinitions.map((p) => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    }));
    return { prompts };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const prompt = findPrompt(name);
    if (!prompt) {
      throw new Error(`Unknown prompt: "${name}". Use prompts/list to see available prompts.`);
    }
    const messages = prompt.generate(args ?? {});
    return {
      description: prompt.description,
      messages,
    };
  });

  return { server, store };
}
