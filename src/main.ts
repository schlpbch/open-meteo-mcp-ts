#!/usr/bin/env node

/**
 * MCP Server entry point for Open-Meteo weather service.
 * Provides weather, snow, air quality, and location data via MCP protocol.
 */

import process from "process";
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
} from "./server.js";

/**
 * Initialize and run the MCP server
 */
async function main() {
  // Create MCP server instance
  const server = new Server(
    {
      name: "open-meteo-mcp",
      version: "4.1.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
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
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
}
