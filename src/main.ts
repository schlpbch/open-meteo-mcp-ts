#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env

/**
 * MCP Server entry point for Open-Meteo weather service.
 * Provides weather, snow, air quality, and location data via MCP protocol.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  getPrompt,
  handleToolCall,
  listPrompts,
  listResources,
  listTools,
  readResource,
} from "./server.ts";

/**
 * Initialize and run the MCP server
 */
async function main() {
  // Create MCP server instance
  const server = new Server(
    {
      name: "open-meteo-mcp",
      version: "4.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  // Register request handlers
  server.setRequestHandler(ListToolsRequestSchema, listTools);
  server.setRequestHandler(CallToolRequestSchema, handleToolCall);
  server.setRequestHandler(ListResourcesRequestSchema, listResources);
  server.setRequestHandler(ReadResourceRequestSchema, readResource);
  server.setRequestHandler(ListPromptsRequestSchema, listPrompts);
  server.setRequestHandler(GetPromptRequestSchema, getPrompt);

  // Create stdio transport
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  // Log server start (to stderr to not interfere with stdio)
  console.error("Open-Meteo MCP Server running on stdio");
}

// Run the server
if (import.meta.main) {
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    Deno.exit(1);
  });
}
